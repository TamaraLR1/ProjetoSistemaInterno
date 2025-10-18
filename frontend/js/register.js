// register.js

document.addEventListener('DOMContentLoaded', () => {
    // Seleciona os elementos do formulário de cadastro
    const registerForm = document.getElementById('register-form');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const messageDiv = document.getElementById('message');

    if (registerForm) {
        // Adiciona um ouvinte de evento para o envio do formulário
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Impede o envio padrão do formulário

            const firstName = firstNameInput.value;
            const lastName = lastNameInput.value;
            const email = emailInput.value;
            const password = passwordInput.value;

            // Limpa mensagens anteriores
            messageDiv.textContent = '';
            messageDiv.className = '';

            try {
                // Envia os dados para a API de registro no backend
                const response = await fetch('http://localhost:5000/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firstName, lastName, email, password }),
                });

                // Analisa a resposta da API
                const data = await response.json();

                if (response.ok) {
                    // Cadastro bem-sucedido: exibe alerta e redireciona
                    alert('Usuário cadastrado com sucesso!');
                    window.location.href = 'login.html';
                } else {
                    // Cadastro falhou: exibe a mensagem de erro da API
                    messageDiv.textContent = data.message || 'Erro ao cadastrar. Tente novamente.';
                    messageDiv.className = 'error';
                }
            } catch (error) {
                console.error('Erro na requisição de cadastro:', error);
                messageDiv.textContent = 'Erro ao conectar com o servidor. Tente novamente.';
                messageDiv.className = 'error';
            }
        });
    }
});