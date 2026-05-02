/**
 * 2. Verifica a sessão assim que a página carrega.
 */
async function checkUserSession() {
    try {
        const response = await fetch(`${API_URL}/cart/count`, { 
            method: 'GET',
            credentials: 'include' 
        });

        if (response.ok) {
            const data = await response.json();
            
            if (data && data.user) {
                console.log("Login confirmado para:", data.user.name);
                renderLoggedUserMenu(data.user, data.count);
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
 * 3. Transforma o cabeçalho de "Login" para "Menu do Usuário"
 */
function renderLoggedUserMenu(user, cartCount) {
    const authSection = document.getElementById('auth-section');
    const template = document.getElementById('user-logged-template');

    if (!authSection || !template) {
        console.warn("Estrutura de Menu Logado não encontrada no HTML.");
        return;
    }

    authSection.innerHTML = '';
    const clone = template.content.cloneNode(true);

    // Nome do Usuário
    const nameEl = clone.querySelector('#user-name');
    if (nameEl) nameEl.textContent = user.name;

    // Avatar Dinâmico
    const avatarEl = clone.querySelector('#user-avatar');
    if (avatarEl) {
        if (user.avatar) {
            // Se já for uma URL completa (Google/FB), usa direto. Se não, usa nossa IMG_BASE_URL
            avatarEl.src = user.avatar.startsWith('http') 
                ? user.avatar 
                : `${IMG_BASE_URL}/${user.avatar}`;
        } else {
            avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
        }
    }

    // Contador do Carrinho
    const badgeEl = clone.querySelector('#cart-count-logged');
    if (badgeEl) {
        badgeEl.textContent = cartCount || 0;
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

    // Logout Dinâmico
    const logoutBtn = clone.querySelector('#btn-logout');
    if (logoutBtn) {
        logoutBtn.onclick = async (e) => {
            e.preventDefault();
            try {
                await fetch(`${API_URL}/logout`, { 
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
 * 4. Atualiza badges globais
 */
function updateGlobalCartBadge(count) {
    const globalBadge = document.getElementById('global-cart-count');
    if (globalBadge) {
        globalBadge.textContent = count || 0;
        globalBadge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Eventos
document.addEventListener('click', () => {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) dropdown.classList.remove('active');
});

document.addEventListener('DOMContentLoaded', checkUserSession);