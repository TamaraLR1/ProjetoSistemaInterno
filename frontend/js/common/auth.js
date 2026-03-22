const API_AUTH_URL = 'http://localhost:5000/api';

/**
 * 1. Verifica a sessão assim que a página carrega.
 * Agora o data.count reflete a quantidade de PRODUTOS distintos.
 */
async function checkUserSession() {
    try {
        const response = await fetch(`${API_AUTH_URL}/cart/count`, { 
            method: 'GET',
            credentials: 'include' 
        });

        if (response.ok) {
            const data = await response.json();
            
            // data.user contém: id, name, avatar, role
            // data.count contém: total de produtos únicos no carrinho
            if (data && data.user) {
                console.log("Login confirmado para:", data.user.name);
                renderLoggedUserMenu(data.user, data.count);
                
                // Função auxiliar para atualizar badges globais se existirem
                updateGlobalCartBadge(data.count);
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

    if (!authSection || !template) {
        // Se cair aqui na página de carrinho, certifique-se que o HTML tem esses IDs
        console.warn("Estrutura de Menu Logado não encontrada no HTML.");
        return;
    }

    authSection.innerHTML = '';
    const clone = template.content.cloneNode(true);

    // Nome do Usuário
    const nameEl = clone.querySelector('#user-name');
    if (nameEl) nameEl.textContent = user.name;

    // Avatar
    const avatarEl = clone.querySelector('#user-avatar');
    if (avatarEl) {
        if (user.avatar) {
            avatarEl.src = user.avatar.startsWith('http') 
                ? user.avatar 
                : `http://localhost:5000/uploads/${user.avatar}`;
        } else {
            avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
        }
    }

    // Contador do Carrinho (Produtos Únicos)
    const badgeEl = clone.querySelector('#cart-count-logged');
    if (badgeEl) {
        badgeEl.textContent = cartCount || 0;
        // Opcional: Esconde a bolinha se estiver zero para um visual mais limpo
        badgeEl.style.display = cartCount > 0 ? 'flex' : 'none';
    }

    // Dropdown
    const trigger = clone.querySelector('#user-trigger');
    const menu = clone.querySelector('#user-dropdown');
    if (trigger && menu) {
        trigger.onclick = (e) => {
            e.stopPropagation();
            menu.classList.toggle('active');
        };
    }

    // Logout
    const logoutBtn = clone.querySelector('#btn-logout');
    if (logoutBtn) {
        logoutBtn.onclick = async (e) => {
            e.preventDefault();
            try {
                await fetch(`${API_AUTH_URL}/logout`, { 
                    method: 'POST', 
                    credentials: 'include' 
                });
                window.location.href = 'index.html';
            } catch (err) {
                console.error("Erro ao deslogar:", err);
            }
        };
    }

    authSection.appendChild(clone);
}

/**
 * 3. Função Extra: Atualiza badges de carrinho fora do menu de usuário
 * Caso você tenha um ícone de carrinho fixo no topo da página.
 */
function updateGlobalCartBadge(count) {
    const globalBadge = document.getElementById('global-cart-count');
    if (globalBadge) {
        globalBadge.textContent = count || 0;
        globalBadge.style.display = count > 0 ? 'flex' : 'none';
    }
}

/**
 * 4. Eventos Globais
 */
document.addEventListener('click', () => {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) dropdown.classList.remove('active');
});

document.addEventListener('DOMContentLoaded', checkUserSession);