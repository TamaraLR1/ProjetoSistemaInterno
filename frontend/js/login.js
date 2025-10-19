// login.js

document.addEventListener('DOMContentLoaded', () => {
    // Seleciona os elementos do formulário de login
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const messageDiv = document.getElementById('message'); 

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); 

            const email = emailInput.value;
            const password = passwordInput.value;

            messageDiv.textContent = '';
            messageDiv.className = '';

            try {
                // Envia os dados para a API de login no backend
                const response = await fetch('http://localhost:5000/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                    credentials: 'include', // Inclui o cookie na requisição
                });

                const data = await response.json();

                if (response.ok) {
                    // O cookie HttpOnly foi definido pelo backend
                    window.location.href = './html/home.html';
                } else {
                    messageDiv.textContent = data.message || 'Erro ao fazer login. Verifique suas credenciais.';
                    messageDiv.className = 'error';
                }
            } catch (error) {
                console.error('Erro na requisição de login:', error);
                messageDiv.textContent = 'Erro ao conectar com o servidor. Tente novamente.';
                messageDiv.className = 'error';
            }
        });
    }
});