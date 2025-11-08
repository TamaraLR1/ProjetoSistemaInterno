// cadastro_produtos.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Seleção e Verificação de Elementos
    const form = document.getElementById('product-register-form');
    const nameInput = document.getElementById('product-name');
    const descriptionInput = document.getElementById('product-description');
    const priceInput = document.getElementById('product-price');
    // Campo de arquivo (com atributo 'multiple' no HTML)
    const imagesInput = document.getElementById('product-images'); 

    // ... (Verificações de segurança inalteradas) ...

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault(); 
            
            // ... (Validação de input inalterada) ...

            // 2. Coleta dos dados
            const name = nameInput.value;
            const description = descriptionInput ? descriptionInput.value : '';
            // Converte o preço para o formato de ponto
            const price = parseFloat(priceInput.value.replace(',', '.')); 
            
            // 3. Montagem do FormData
            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            formData.append('price', price.toFixed(2)); // Envia com 2 casas decimais

            // 🌟 AJUSTE CRUCIAL AQUI: Itera sobre a lista de arquivos
            const files = imagesInput.files;

            if (files.length === 0) {
                 alert("É obrigatório selecionar pelo menos uma imagem.");
                 return;
            }

            // Anexa CADA arquivo individualmente com o mesmo nome de campo: 'product-images'
            // O nome 'product-images' DEVE coincidir com o usado no Multer (upload.array('product-images', 5))
            for (let i = 0; i < files.length; i++) {
                formData.append('product-images', files[i]);
            }

            // 4. Envio da Requisição
            try {
                // A URL deve ser a mesma da rota POST que você corrigiu: /api/products
                const response = await fetch('http://localhost:5000/api/products', {
                    method: 'POST',
                    // Importante: Não definir Content-Type para FormData.
                    body: formData, 
                    credentials: 'include',
                });

                // ... (Tratamento da resposta inalterado) ...
                const data = await response.json().catch(() => ({ message: 'Resposta não JSON' })); 
                
                if (response.ok) { 
                    alert('Produto cadastrado com sucesso!');
                    form.reset(); 
                } else if (response.status === 401 || response.status === 403) {
                    alert('Sessão expirada ou não autenticada. Redirecionando para o login.');
                    window.location.href = 'login.html';
                } else {
                    console.error('Erro no backend:', data);
                    alert(`Erro ao cadastrar produto: ${data.message || 'Erro desconhecido.'}`);
                }

            } catch (error) {
                // ... (Tratamento de erro de rede inalterado) ...
                console.error('Erro na requisição de cadastro (FALHA DE REDE/CORS):', error);
                alert('Erro ao conectar com o servidor. Verifique o console do navegador.');
            }
        });
    }
});