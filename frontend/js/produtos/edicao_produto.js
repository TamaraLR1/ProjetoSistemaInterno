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
    
    // NOVO: Elemento para exibir as imagens atuais
    // Você deve adicionar <div id="current-images-container"> no seu HTML
    const currentImagesContainer = document.getElementById('current-images-container'); 
    
    const statusMessage = document.getElementById('status-message');
    const titleElement = document.getElementById('edit-page-title');
    
    const placeholderPath = '../../assets/placeholder.png'; 

    let productID = null; 

    // 2. Validação Inicial
    if (!productId || isNaN(parseInt(productId))) {
        statusMessage.textContent = 'Erro: ID do produto inválido na URL.';
        statusMessage.className = 'message-box error';
        return;
    }
    productID = parseInt(productId);
    titleElement.textContent = `Editando Produto (ID: ${productID})`;
    form.parentElement.style.display = 'block'; 
    
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
            // Converte para o formato local (vírgula)
            priceInput.value = parseFloat(product.price).toFixed(2).replace('.', ','); 

            // NOVO: Exibir imagens atuais
            currentImagesContainer.innerHTML = ''; // Limpa o container
            
            if (product.image_urls && product.image_urls.length > 0) {
                product.image_urls.forEach(imageUrl => {
                    const imgUrl = `http://localhost:5000/uploads/${imageUrl}`;
                    
                    const imgContainer = document.createElement('div');
                    imgContainer.className = 'current-image-item'; 
                    imgContainer.title = "A nova imagem substituirá esta.";
                    
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
                        <img src="${placeholderPath}" alt="Sem imagem atual" class="product-image-preview">
                        <p style="font-size: 0.8em; margin-top: 5px;">Nenhuma imagem atual.</p>
                    </div>
                 `;
            }

        } catch (error) {
            console.error('Erro ao carregar detalhes do produto:', error);
            statusMessage.textContent = 'Erro ao carregar os dados do produto para edição.';
            statusMessage.className = 'message-box error';
        }
    };
    
    // ===============================================
    // 4. FUNÇÃO PARA SUBMISSÃO (handleEditSubmit)
    // ===============================================
    const handleEditSubmit = async (event) => {
        event.preventDefault();
        
        statusMessage.textContent = 'Salvando alterações...';
        statusMessage.className = 'message-box info';
        
        // Coleta dos dados
        const name = nameInput.value;
        const description = descriptionInput.value || '';
        const price = parseFloat(priceInput.value.replace(',', '.'));
        const files = imagesInput.files; 
        
        if (!name || isNaN(price)) {
             statusMessage.textContent = 'Nome e Preço são obrigatórios e válidos.';
             statusMessage.className = 'message-box error';
             return;
        }

        // Montagem do FormData (CRUCIAL para enviar arquivos)
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('price', price.toFixed(2)); 

        // Adiciona as novas imagens (se existirem). 
        // O nome 'product-images' DEVE casar com o Multer na rota do backend.
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                formData.append('product-images', files[i]); 
            }
        }
        
        try {
            // Requisição PUT para a rota que lida com imagens (product.routes.ts)
            const response = await fetch(`http://localhost:5000/api/products/${productID}`, {
                method: 'PUT',
                // NÂO defina Content-Type; o navegador faz isso para FormData
                body: formData, 
                credentials: 'include',
            });

            const data = await response.json().catch(() => ({ message: 'Resposta não JSON' }));
            
            // 4. Tratamento da resposta
            if (response.ok) {
                alert('Produto atualizado com sucesso!');
                statusMessage.textContent = 'Produto atualizado com sucesso! Redirecionando...';
                statusMessage.className = 'message-box success';
                
                // Redireciona
                setTimeout(() => {
                    window.location.href = 'listagem_produtos.html';
                }, 1500);
            } else if (response.status === 401 || response.status === 403) {
                alert('Sessão expirada ou acesso negado. Redirecionando para o login.');
                window.location.href = '../../login.html';
            } else {
                console.error('Erro no backend:', data);
                statusMessage.textContent = `Erro ao salvar: ${data.message || 'Erro desconhecido.'}`;
                statusMessage.className = 'message-box error';
            }

        } catch (error) {
            console.error('Erro na requisição de atualização:', error);
            statusMessage.textContent = 'Erro ao conectar com o servidor. Verifique sua conexão e o console.';
            statusMessage.className = 'message-box error';
        }
    };


    // 5. Adiciona o Listener e Inicia o Carregamento
    if (form) {
        form.addEventListener('submit', handleEditSubmit);
        fetchProductDetails();
    }
});