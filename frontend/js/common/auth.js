const API_AUTH_URL = 'http://localhost:5000/api';

/**
 * 1. Verifica a sessão assim que a página carrega.
 * Esta função deve ser chamada em todas as páginas (index, produto, etc).
 */
async function checkUserSession() {
    try {
        const response = await fetch(`${API_AUTH_URL}/cart/count`, { 
            method: 'GET',
            credentials: 'include' // Essencial para enviar os cookies da sessão
        });

        if (response.ok) {
            const data = await response.json();
            
            // O Backend agora retorna data.user com 'name' (vindo do CONCAT) e 'avatar' (vindo do avatar_url)
            if (data && data.user) {
                console.log("Login confirmado para:", data.user.name);
                renderLoggedUserMenu(data.user, data.count);
            } else {
                console.log("Navegando como visitante.");
            }
        } else {
            console.log("Usuário não está logado.");
        }
    } catch (error) {
        console.error("Erro ao conectar com o servidor de autenticação:", error);
    }
}

/**
 * 2. Transforma o cabeçalho de "Login" para "Menu do Usuário"
 */
function renderLoggedUserMenu(user, cartCount) {
    const authSection = document.getElementById('auth-section');
    const template = document.getElementById('user-logged-template');

    // Se a página não tiver esses elementos (ex: página de login), a função para aqui
    if (!authSection || !template) {
        console.warn("Estrutura de Menu Logado não encontrada no HTML.");
        return;
    }

    // Limpa os links de Login/Cadastro originais
    authSection.innerHTML = '';

    // Clona o template do usuário logado
    const clone = template.content.cloneNode(true);

    // Preenche o Nome Completo (vindo do firstName + lastName do SQL)
    const nameEl = clone.querySelector('#user-name');
    if (nameEl) nameEl.textContent = user.name;

    // Preenche a Imagem de Perfil (Avatar)
    const avatarEl = clone.querySelector('#user-avatar');
    if (avatarEl) {
        if (user.avatar) {
            // Se for um link externo usa direto, se for nome de arquivo usa a pasta uploads
            avatarEl.src = user.avatar.startsWith('http') 
                ? user.avatar 
                : `http://localhost:5000/uploads/${user.avatar}`;
        } else {
            // Imagem padrão caso o usuário não tenha foto
            avatarEl.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name) + '&background=random';
        }
    }

    // Atualiza o contador do carrinho no estado logado
    const badgeEl = clone.querySelector('#cart-count-logged');
    if (badgeEl) badgeEl.textContent = cartCount || 0;

    // Lógica do Dropdown (Abrir/Fechar)
    const trigger = clone.querySelector('#user-trigger');
    const menu = clone.querySelector('#user-dropdown');
    
    if (trigger && menu) {
        trigger.onclick = (e) => {
            e.stopPropagation();
            menu.classList.toggle('active');
        };
    }

    // Lógica do Botão de Sair (Logout)
    const logoutBtn = clone.querySelector('#btn-logout');
    if (logoutBtn) {
        logoutBtn.onclick = async (e) => {
            e.preventDefault();
            try {
                await fetch(`${API_AUTH_URL}/logout`, { 
                    method: 'POST', 
                    credentials: 'include' 
                });
                // Redireciona para a home e limpa a interface
                window.location.href = 'index.html';
            } catch (err) {
                console.error("Erro ao deslogar:", err);
            }
        };
    }

    // Injeta o menu montado no cabeçalho
    authSection.appendChild(clone);
}

/**
 * 3. Evento Global: Fecha o menu se clicar em qualquer lugar fora dele
 */
document.addEventListener('click', () => {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) dropdown.classList.remove('active');
});

/**
 * 4. Inicialização Automática
 */
document.addEventListener('DOMContentLoaded', checkUserSession);