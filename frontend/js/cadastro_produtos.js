// cadastro_produtos.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Seleção e Verificação de Elementos
    const form = document.getElementById('product-register-form');
    const nameInput = document.getElementById('product-name');
    const descriptionInput = document.getElementById('product-description');
    const priceInput = document.getElementById('product-price');
    const imagesInput = document.getElementById('product-images'); // Campo de arquivo

    // Verificação de segurança
    if (!form || !nameInput || !priceInput || !imagesInput) {
        console.error("ERRO FATAL: Falha ao encontrar um ou mais elementos DOM essenciais (form, name, price, images). Verifique os IDs no HTML.");
        // Não retorna aqui, mas o código não vai quebrar tentando acessar .value de 'null'
    }

    if (form) {
        form.addEventListener('submit', async (event) => {
            // ESSENCIAL: Impede o comportamento padrão do formulário.
            event.preventDefault(); 
            
            // Verifica se as variáveis de input foram carregadas antes de tentar acessar o .value
            if (!nameInput || !priceInput || !imagesInput) {
                alert("Erro: O formulário está incompleto. Recarregue a página.");
                return; 
            }

            // 2. Coleta dos dados (seguro)
            const name = nameInput.value;
            const description = descriptionInput ? descriptionInput.value : '';
            const price = priceInput.value;

            // 3. Criação do FormData (Obrigatório para o Multer/arquivo)
            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            formData.append('price', price);
            
            // Adiciona o arquivo. O nome do campo ('productImage') deve corresponder ao Multer
            if (imagesInput.files && imagesInput.files.length > 0) {
                formData.append('productImage', imagesInput.files[0]); 
            }
            
            // 4. Envio da requisição
            try {
                // INÍCIO DO FETCH
                const response = await fetch('http://localhost:5000/api/products', {
                    method: 'POST',
                    // Importante: Não definir Content-Type para FormData.
                    body: formData, 
                    credentials: 'include', // ESSENCIAL para enviar o cookie de autenticação
                });

                // Tenta analisar a resposta JSON
                const data = await response.json().catch(() => ({ message: 'Resposta não JSON' })); 
                
                // 5. Tratamento da resposta
                if (response.ok) { // Status 200-299 (incluindo o esperado 201)
                    alert('Produto cadastrado com sucesso!');
                    form.reset(); 
                } else if (response.status === 401 || response.status === 403) {
                    // Falha na autenticação (cookie ausente ou inválido)
                    alert('Sessão expirada ou não autenticada. Redirecionando para o login.');
                    window.location.href = 'login.html';
                } else {
                    // Outros erros (400, 500)
                    console.error('Erro no backend:', data);
                    alert(`Erro ao cadastrar produto: ${data.message || 'Erro desconhecido.'}`);
                }

            } catch (error) {
                // Erro de rede (servidor desligado, CORS bloqueando)
                console.error('Erro na requisição de cadastro (FALHA DE REDE/CORS):', error);
                alert('Erro ao conectar com o servidor. Verifique o console do navegador.');
            }
        });
    }
});