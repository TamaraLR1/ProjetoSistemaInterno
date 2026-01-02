document.addEventListener('DOMContentLoaded', () => {
    // 1. Seleção de Elementos
    const form = document.getElementById('product-register-form');
    const nameInput = document.getElementById('product-name');
    const descriptionInput = document.getElementById('product-description');
    const priceInput = document.getElementById('product-price');
    const imagesInput = document.getElementById('product-images'); 

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault(); 
            
            // 2. Coleta e Limpeza de Dados
            const name = nameInput.value.trim();
            const description = descriptionInput ? descriptionInput.value.trim() : '';
            const priceRaw = priceInput.value.replace(',', '.');
            
            // Validação simples de preenchimento
            if (!name || !priceRaw) {
                alert("Por favor, preencha o nome e o preço do produto.");
                return;
            }

            const price = parseFloat(priceRaw);
            if (isNaN(price)) {
                alert("Por favor, insira um preço válido.");
                return;
            }

            // 3. Validação de Arquivos (Tamanho e Tipo)
            const files = imagesInput.files;

            if (files.length === 0) {
                 alert("É obrigatório selecionar pelo menos uma imagem para o produto.");
                 return;
            }

            // Configurações de restrição
            const MAX_SIZE_MB = 5;
            const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
            const ALLOWED_TYPES = [
                'image/jpeg', 
                'image/jpg', 
                'image/png', 
                'image/webp', 
                'image/jfif'
            ];

            // Loop de validação individual por arquivo
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Valida o tipo MIME do arquivo
                if (!ALLOWED_TYPES.includes(file.type)) {
                    alert(`O arquivo "${file.name}" não é permitido. Use apenas JPG, PNG, WEBP ou JFIF.`);
                    return;
                }

                // Valida o tamanho (Máximo 5MB)
                if (file.size > MAX_SIZE_BYTES) {
                    alert(`O arquivo "${file.name}" é muito grande. O limite máximo é de ${MAX_SIZE_MB}MB.`);
                    return;
                }
            }

            // 4. Montagem do FormData para envio
            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            formData.append('price', price.toFixed(2));

            // Anexa os arquivos validados ao campo 'product-images'
            // O nome deve ser o mesmo esperado no backend: upload.array('product-images')
            for (let i = 0; i < files.length; i++) {
                formData.append('product-images', files[i]);
            }

            // 5. Envio dos dados ao Servidor
            try {
                const response = await fetch('http://localhost:5000/api/products', {
                    method: 'POST',
                    body: formData, 
                    credentials: 'include', // Necessário se houver cookies de sessão
                });

                const data = await response.json().catch(() => ({ message: 'Erro ao processar resposta do servidor.' })); 
                
                if (response.ok) { 
                    alert('Produto cadastrado com sucesso!');
                    form.reset(); 
                } else if (response.status === 401 || response.status === 403) {
                    alert('Sessão expirada. Por favor, faça login novamente.');
                    window.location.href = 'login.html';
                } else {
                    console.error('Erro retornado pelo servidor:', data);
                    alert(`Erro ao cadastrar: ${data.message || 'Ocorreu um problema no servidor.'}`);
                }

            } catch (error) {
                console.error('Erro de conexão/CORS:', error);
                alert('Não foi possível conectar ao servidor. Verifique sua conexão ou se o backend está rodando.');
            }
        });
    }
});