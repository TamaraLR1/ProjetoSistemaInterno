// home.js

document.addEventListener('DOMContentLoaded', () => {
    // Seleciona os elementos do DOM
    const userAvatar = document.querySelector('.user-avatar');
    const logoutMenu = document.querySelector('.logout-menu');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Seleciona o elemento onde o nome completo será exibido
    const fullNameElement = document.getElementById('user-full-name'); 

    // Função para buscar e exibir informações do usuário
    const fetchUserInfo = async () => {
        try {
            // Requisição para a rota protegida
            const response = await fetch('http://localhost:5000/api/user/info', {
                method: 'GET',
                credentials: 'include', // ESSENCIAL: Envia o cookie HttpOnly
            });

            if (response.ok) {
                const data = await response.json();
                const user = data.user;
                
                // 1. Exibe o nome e sobrenome no local desejado
                if (fullNameElement) {
                    const fullName = `${user.firstName} ${user.lastName}`;
                    fullNameElement.textContent = fullName;
                }

                // 2. ATUALIZA A FOTO DO AVATAR NO HEADER
                // Se o usuário tiver uma foto no banco, substitui a padrão (assets/usuario.png)
                if (userAvatar && user.avatar_url) {
                    // Adicionamos ?t=Date.now() para evitar que o navegador use a imagem antiga em cache
                    userAvatar.src = `http://localhost:5000/uploads/${user.avatar_url}?t=${Date.now()}`;
                } else {
                    const currentUrl = window.location.href;
                            
                            if (currentUrl.includes('/html/perfil/') || currentUrl.includes('/html/produtos/')) {
                                userAvatar.src = "../../assets/usuario.png";
                            } else {
                                userAvatar.src = "../assets/usuario.png";
                            }
                }
                
            } else if (response.status === 401 || response.status === 403) {
                // Token inválido/ausente, redireciona para login
                console.warn('Sessão expirada ou não autenticada. Redirecionando...');
                window.location.href = '/login.html';
            }
        } catch (error) {
            console.error('Erro na requisição de informações do usuário:', error);
            // Em caso de erro de conexão, assume-se não autenticado
            window.location.href = '/login.html';
        }
    };

    // Chamada inicial para carregar as informações
    fetchUserInfo();

    // Lógica para gerenciar o menu de logout
    if (userAvatar && logoutMenu && logoutBtn) {
        
        // Alterna a visibilidade do menu de logout ao clicar no avatar
        userAvatar.addEventListener('click', (event) => {
            logoutMenu.classList.toggle('show');
            event.stopPropagation(); // Impede que o clique se propague para o document
        });

        // Oculta o menu se o usuário clicar em qualquer lugar fora dele
        document.addEventListener('click', (event) => {
            if (!logoutMenu.contains(event.target) && logoutMenu.classList.contains('show')) {
                logoutMenu.classList.remove('show');
            }
        });

        // Lógica de Logout
        logoutBtn.addEventListener('click', async () => {
            try {
                // Chamar a API de logout do backend para limpar o cookie HttpOnly
                await fetch('http://localhost:5000/api/logout', {
                    method: 'POST',
                    credentials: 'include', // ESSENCIAL: Envia o cookie para o backend limpá-lo
                });
                
                // Redirecionar
                window.location.href = '/login.html';
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
                alert('Erro ao fazer logout. Tente novamente.');
            }
        });
    }
});