// Caminho: frontend/js/produtos/edicao_produto.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Coleta de Elementos
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    const form = document.getElementById('product-edit-form');
    const nameInput = document.getElementById('product-name');
    const descriptionInput = document.getElementById('product-description');
    const priceInput = document.getElementById('product-price');
    const imagesInput = document.getElementById('product-images'); 
    
    // Elemento para exibir as imagens atuais
    const currentImagesContainer = document.getElementById('current-images-container'); 
    
    const statusMessage = document.getElementById('status-message');
    const titleElement = document.getElementById('edit-page-title');
    
    const placeholderPath = '../../assets/placeholder.png'; 

    let productID = null; 

    // 2. Validação Inicial do ID
    if (!productId || isNaN(parseInt(productId))) {
        statusMessage.textContent = 'Erro: ID do produto inválido na URL.';
        statusMessage.className = 'message-box error';
        return;
    }
    productID = parseInt(productId);
    if (titleElement) titleElement.textContent = `Editando Produto (ID: ${productID})`;
    if (form) form.parentElement.style.display = 'block'; 
    
    // ===============================================
    // 3. FUNÇÃO PARA CARREGAR DETALHES
    // ===============================================
    const fetchProductDetails = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/products/${productID}`, {
                method: 'GET',
                credentials: 'include',
            });

            if (response.status === 401 || response.status === 403) {
                alert('Sessão expirada ou acesso negado. Redirecionando para o login.');
                window.location.href = '../../login.html';
                return;
            }
            
            if (!response.ok) {
                throw new Error('Falha ao buscar detalhes do produto.');
            }

            const product = await response.json();

            // Preenche os campos de texto
            nameInput.value = product.name;
            descriptionInput.value = product.description || '';
            priceInput.value = parseFloat(product.price).toFixed(2).replace('.', ','); 

            // Exibir imagens atuais
            if (currentImagesContainer) {
                currentImagesContainer.innerHTML = ''; 
                
                if (product.image_urls && product.image_urls.length > 0) {
                    product.image_urls.forEach(imageUrl => {
                        const imgUrl = `http://localhost:5000/uploads/${imageUrl}`;
                        
                        const imgContainer = document.createElement('div');
                        imgContainer.className = 'current-image-item'; 
                        
                        const imgElement = document.createElement('img');
                        imgElement.src = imgUrl;
                        imgElement.alt = product.name;
                        imgElement.className = 'product-image-preview'; 
                        
                        imgContainer.appendChild(imgElement);
                        currentImagesContainer.appendChild(imgContainer);
                    });
                } else {
                     currentImagesContainer.innerHTML = `
                        <div class="current-image-item">
                            <img src="${placeholderPath}" alt="Sem imagem" class="product-image-preview">
                            <p style="font-size: 0.8em; margin-top: 5px;">Nenhuma imagem atual.</p>
                        </div>
                     `;
                }
            }

        } catch (error) {
            console.error('Erro ao carregar detalhes:', error);
            statusMessage.textContent = 'Erro ao carregar os dados do produto.';
            statusMessage.className = 'message-box error';
        }
    };
    
    // ===============================================
    // 4. FUNÇÃO PARA SUBMISSÃO (handleEditSubmit)
    // ===============================================
    const handleEditSubmit = async (event) => {
        event.preventDefault();
        
        // Coleta dos dados
        const name = nameInput.value.trim();
        const description = descriptionInput.value || '';
        const priceValue = priceInput.value.replace(',', '.');
        const files = imagesInput.files; 
        
        if (!name || !priceValue || isNaN(parseFloat(priceValue))) {
             statusMessage.textContent = 'Nome e Preço são obrigatórios.';
             statusMessage.className = 'message-box error';
             return;
        }

        // --- 🌟 BLOCO DE VALIDAÇÃO DE ARQUIVOS (IGUAL AO CADASTRO) ---
        if (files && files.length > 0) {
            const MAX_SIZE_MB = 5;
            const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
            const ALLOWED_TYPES = [
                'image/jpeg', 
                'image/jpg', 
                'image/png', 
                'image/webp', 
                'image/jfif'
            ];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Validação de Tipo
                if (!ALLOWED_TYPES.includes(file.type)) {
                    alert(`O arquivo "${file.name}" não é permitido. Use apenas JPG, PNG, WEBP ou JFIF.`);
                    imagesInput.value = ''; // Limpa seleção inválida
                    return;
                }

                // Validação de Tamanho
                if (file.size > MAX_SIZE_BYTES) {
                    alert(`O arquivo "${file.name}" excede o limite de ${MAX_SIZE_MB}MB.`);
                    imagesInput.value = ''; // Limpa seleção inválida
                    return;
                }
            }
        }
        // -------------------------------------------------------------

        statusMessage.textContent = 'Salvando alterações...';
        statusMessage.className = 'message-box info';

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('price', parseFloat(priceValue).toFixed(2)); 

        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                formData.append('product-images', files[i]); 
            }
        }
        
        try {
            const response = await fetch(`http://localhost:5000/api/products/${productID}`, {
                method: 'PUT',
                body: formData, 
                credentials: 'include',
            });

            const data = await response.json().catch(() => ({ message: 'Resposta inválida do servidor.' }));
            
            if (response.ok) {
                alert('Produto atualizado com sucesso!');
                statusMessage.textContent = 'Sucesso! Redirecionando...';
                statusMessage.className = 'message-box success';
                
                setTimeout(() => {
                    window.location.href = 'listagem_produtos.html';
                }, 1500);
            } else if (response.status === 401 || response.status === 403) {
                alert('Sessão expirada. Redirecionando para o login.');
                window.location.href = '../../login.html';
            } else {
                statusMessage.textContent = `Erro: ${data.message || 'Erro desconhecido.'}`;
                statusMessage.className = 'message-box error';
            }

        } catch (error) {
            console.error('Erro na requisição:', error);
            statusMessage.textContent = 'Erro ao conectar com o servidor.';
            statusMessage.className = 'message-box error';
        }
    };

    // 5. Inicialização
    if (form) {
        form.addEventListener('submit', handleEditSubmit);
        fetchProductDetails();
    }
});