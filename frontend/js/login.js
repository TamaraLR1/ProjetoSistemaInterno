document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const messageDiv = document.getElementById('message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Impede os dados de irem para a URL
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('http://localhost:5000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                    credentials: 'include', // Importante para salvar o cookie de sessão
                });

                const data = await response.json();

                if (response.ok) {
                    // Captura para onde o usuário deve voltar (ex: página do produto)
                    const params = new URLSearchParams(window.location.search);
                    const redirectTo = params.get('redirect');

                    if (redirectTo) {
                        window.location.replace(decodeURIComponent(redirectTo));
                    } else {
                        // Redirecionamento padrão por cargo
                        window.location.href = data.user?.role === 'seller' ? './html/home.html' : 'index.html';
                    }
                } else {
                    messageDiv.textContent = data.message || 'E-mail ou senha incorretos.';
                    messageDiv.className = 'error-message';
                }
            } catch (error) {
                console.error('Erro no login:', error);
                messageDiv.textContent = 'Erro ao conectar com o servidor.';
            }
        });
    }
});