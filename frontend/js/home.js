// home.js

document.addEventListener('DOMContentLoaded', () => {
    // Seleciona os elementos do DOM
    const userAvatar = document.querySelector('.user-avatar');
    const logoutMenu = document.querySelector('.logout-menu');
    const logoutBtn = document.getElementById('logout-btn');
    const fullNameElement = document.getElementById('user-full-name'); 

    // Função para buscar e exibir informações do usuário
    const fetchUserInfo = async () => {
        try {
            // 2. Uso da API_URL dinâmica
            const response = await fetch(`$API_URL}/user/info`, {
                method: 'GET',
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                const user = data.user;
                
                if (fullNameElement) {
                    const fullName = `${user.firstName} ${user.lastName}`;
                    fullNameElement.textContent = fullName;
                }

                // 3. Atualiza o avatar usando IMG_BASE_URL dinâmica
                if (userAvatar && user.avatar_url) {
                    userAvatar.src = `${IMG_BASE_URL}/${user.avatar_url}?t=${Date.now()}`;
                } else if (userAvatar) {
                    const currentUrl = window.location.href;
                    if (currentUrl.includes('/html/perfil/') || currentUrl.includes('/html/produtos/')) {
                        userAvatar.src = "../../assets/usuario.png";
                    } else {
                        userAvatar.src = "../assets/usuario.png";
                    }
                }
                
            } else if (response.status === 401 || response.status === 403) {
                console.warn('Sessão expirada ou não autenticada. Redirecionando...');
                window.location.href = '/login.html';
            }
        } catch (error) {
            console.error('Erro na requisição de informações do usuário:', error);
            window.location.href = '/login.html';
        }
    };

    fetchUserInfo();

    // Lógica para gerenciar o menu de logout
    if (userAvatar && logoutMenu && logoutBtn) {
        
        userAvatar.addEventListener('click', (event) => {
            logoutMenu.classList.toggle('show');
            event.stopPropagation();
        });

        document.addEventListener('click', (event) => {
            if (!logoutMenu.contains(event.target) && logoutMenu.classList.contains('show')) {
                logoutMenu.classList.remove('show');
            }
        });

        // 4. Lógica de Logout com URL dinâmica
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch(`$API_URL}/logout`, {
                    method: 'POST',
                    credentials: 'include',
                });
                
                window.location.href = '/login.html';
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
                alert('Erro ao fazer logout. Tente novamente.');
            }
        });
    }
});