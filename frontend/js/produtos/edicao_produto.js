// Caminho: frontend/js/produtos/edicao_produto.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Coleta de Elementos
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    const form = document.getElementById('product-edit-form');
    const nameInput = document.getElementById('product-name');
    const descriptionInput = document.getElementById('product-description');
    const categorySelect = document.getElementById('product-category'); // NOVO: Seleção da categoria
    const priceInput = document.getElementById('product-price');
    const imagesInput = document.getElementById('product-images'); 
    
    const currentImagesContainer = document.getElementById('current-images-container'); 
    const statusMessage = document.getElementById('status-message');
    const titleElement = document.getElementById('edit-page-title');
    const placeholderPath = '../../assets/placeholder.png'; 

    let productID = null; 

    // 2. Validação Inicial do ID
    if (!productId || isNaN(parseInt(productId))) {
        statusMessage.textContent = 'Erro: ID do produto inválido na URL.';
        statusMessage.className = 'message-box error';
        statusMessage.style.display = 'block';
        return;
    }
    productID = parseInt(productId);
    if (titleElement) titleElement.textContent = `Editando Produto (ID: ${productID})`;
    if (form) form.parentElement.style.display = 'block'; 

    // ===============================================
    // 3. FUNÇÃO PARA CARREGAR CATEGORIAS (NOVA)
    // ===============================================
    const fetchCategories = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/categories');
            if (!response.ok) throw new Error('Falha ao buscar categorias.');
            
            const categories = await response.json();
            
            if (categorySelect) {
                categorySelect.innerHTML = '<option value="" disabled>Selecione uma categoria...</option>';
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.name;
                    categorySelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
        }
    };
    
    // ===============================================
    // 4. FUNÇÃO PARA CARREGAR DETALHES
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
            
            if (!response.ok) throw new Error('Falha ao buscar detalhes do produto.');

            const product = await response.json();

            // Preenche os campos de texto
            nameInput.value = product.name;
            descriptionInput.value = product.description || '';
            priceInput.value = parseFloat(product.price).toFixed(2).replace('.', ','); 

            // NOVO: Seleciona a categoria atual no select
            if (categorySelect && product.category_id) {
                categorySelect.value = product.category_id;
            }

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
            statusMessage.style.display = 'block';
        }
    };
    
    // ===============================================
    // 5. FUNÇÃO PARA SUBMISSÃO (handleEditSubmit)
    // ===============================================
    const handleEditSubmit = async (event) => {
        event.preventDefault();
        
        const name = nameInput.value.trim();
        const description = descriptionInput.value || '';
        const category_id = categorySelect.value; // NOVO: Coleta da categoria
        const priceValue = priceInput.value.replace(',', '.');
        const files = imagesInput.files; 
        
        if (!name || !priceValue || isNaN(parseFloat(priceValue)) || !category_id) {
             statusMessage.textContent = 'Nome, Preço e Categoria são obrigatórios.';
             statusMessage.className = 'message-box error';
             statusMessage.style.display = 'block';
             return;
        }

        // Validação de arquivos (mantida)
        if (files && files.length > 0) {
            const MAX_SIZE_MB = 5;
            const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
            const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/jfif'];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!ALLOWED_TYPES.includes(file.type)) {
                    alert(`O arquivo "${file.name}" não é permitido.`);
                    return;
                }
                if (file.size > MAX_SIZE_BYTES) {
                    alert(`O arquivo "${file.name}" excede o limite de 5MB.`);
                    return;
                }
            }
        }

        statusMessage.textContent = 'Salvando alterações...';
        statusMessage.className = 'message-box info';
        statusMessage.style.display = 'block';

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('category_id', category_id); // NOVO: Inclusão no FormData
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
                window.location.href = 'listagem_produtos.html';
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

    // 6. Inicialização Sequencial (Importante!)
    if (form) {
        form.addEventListener('submit', handleEditSubmit);
        // Primeiro carregamos as categorias, depois os detalhes para poder selecionar o valor correto
        fetchCategories().then(() => {
            fetchProductDetails();
        });
    }
});