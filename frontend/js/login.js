document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('login-form');
    const messageDiv = document.getElementById('message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); 
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                // 2. Uso da API_BASE_URL dinâmica
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                    credentials: 'include', // Mantido: Essencial para o cookie HttpOnly
                });

                const data = await response.json();

                if (response.ok) {
                    const params = new URLSearchParams(window.location.search);
                    const redirectTo = params.get('redirect');

                    if (redirectTo) {
                        window.location.replace(decodeURIComponent(redirectTo));
                    } else {
                        // Redirecionamento padrão baseado no cargo (role)
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