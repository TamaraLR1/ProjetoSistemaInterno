// Configuração da URL da API - Ajuste se o seu backend estiver em outra porta
const API_AUTH_URL = 'http://localhost:5000/api';

/**
 * Verifica a sessão do usuário ao carregar a página
 */
async function checkUserSession() {
    try {
        // O 'credentials: include' é VITAL para enviar o cookie de login para o servidor
        const response = await fetch(`${API_AUTH_URL}/cart/count`, { 
            method: 'GET',
            credentials: 'include' 
        });

        // Se o status for 401, o usuário não está logado. 
        // Não fazemos nada e deixamos o menu padrão "Login" aparecer.
        if (response.status === 401) {
            console.log("Status: Navegando como visitante.");
            return;
        }

        if (response.ok) {
            const data = await response.json();
            
            // Se o backend retornou o objeto user, trocamos o menu
            if (data && data.user) {
                console.log("Usuário logado detectado:", data.user.name);
                renderLoggedUserMenu(data.user, data.count);
            }
        }
    } catch (error) {
        // Erro de conexão com o servidor
        console.error("Erro ao verificar sessão do usuário:", error);
    }
}

/**
 * Substitui a seção de login pelo Nome e Foto do Usuário
 */
function renderLoggedUserMenu(user, cartCount) {
    const authSection = document.getElementById('auth-section');
    const template = document.getElementById('user-logged-template');

    // Validação de segurança: só executa se os elementos existirem na página atual
    if (!authSection || !template) {
        console.warn("Avisos: Elementos de interface de usuário não encontrados no HTML.");
        return;
    }

    // Limpa o conteúdo atual (Vender, Login, Carrinho deslogado)
    authSection.innerHTML = '';

    // Clona o template HTML
    const clone = template.content.cloneNode(true);

    // Preenche o Nome
    const nameElement = clone.getElementById('user-name');
    if (nameElement) nameElement.textContent = user.name || user.username;

    // Preenche a Imagem (Avatar)
    const avatarElement = clone.getElementById('user-avatar');
    if (avatarElement) {
        // Se o usuário tiver imagem, usa a URL do servidor, senão usa um placeholder
        avatarElement.src = user.avatar 
            ? `http://localhost:5000/uploads/${user.avatar}` 
            : 'https://via.placeholder.com/150';
    }

    // Preenche o contador do carrinho para o estado logado
    const cartCountElement = clone.getElementById('cart-count-logged');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount || 0;
    }

    // Lógica para abrir/fechar o Dropdown
    const trigger = clone.getElementById('user-trigger');
    const dropdown = clone.getElementById('user-dropdown');
    if (trigger && dropdown) {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });

        // Fecha o menu ao clicar fora dele
        document.addEventListener('click', () => {
            dropdown.classList.remove('active');
        });
    }

    // Lógica do botão de Logout
    const logoutBtn = clone.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch(`${API_AUTH_URL}/logout`, { 
                    method: 'POST', 
                    credentials: 'include' 
                });
                window.location.href = 'index.html'; // Recarrega para o estado deslogado
            } catch (err) {
                console.error("Erro ao fazer logout:", err);
            }
        });
    }

    // Mostra o link do Painel se for Vendedor
    const sellerPanel = clone.getElementById('seller-panel-link');
    if (sellerPanel && user.role === 'seller') {
        sellerPanel.style.display = 'flex';
    }

    // Adiciona o menu pronto ao cabeçalho
    authSection.appendChild(clone);
}

// Inicia a verificação assim que o DOM estiver pronto
document.addEventListener('DOMContentLoaded', checkUserSession);