// Caminho: frontend/js/produtos/detalhes_produto.js

document.addEventListener('DOMContentLoaded', () => {

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    // Elementos de exibição
    const nameTitle = document.getElementById('product-name-title');
    const categorySpan = document.getElementById('product-category');
    const priceSpan = document.getElementById('product-price');
    const stockSpan = document.getElementById('product-stock');
    const descriptionSpan = document.getElementById('product-description');
    const imagesContainer = document.getElementById('product-images-container');
    const editLink = document.getElementById('edit-link'); 
    const deleteBtn = document.getElementById('delete-btn'); 
    
    const placeholderPath = '../../assets/placeholder.png'; 

    if (!productId || isNaN(parseInt(productId))) {
        nameTitle.textContent = 'Erro: ID do produto inválido na URL.';
        return;
    }
    const productID = parseInt(productId);
    nameTitle.textContent = 'Carregando detalhes...';

    // --- FUNÇÃO DE BUSCA E EXIBIÇÃO ---
    const fetchProductDetails = async () => {
        try {
            // Usa a constante dinâmica API_URL
            const response = await fetch(`${API_URL}/products/${productID}`, {
                method: 'GET',
                credentials: 'include',
            });

            if (response.status === 401 || response.status === 403) {
                alert('Sessão expirada ou não autenticado. Redirecionando para o login.');
                window.location.href = '../../login.html';
                return;
            }
            
            if (!response.ok) {
                throw new Error('Falha ao buscar detalhes do produto.');
            }

            const product = await response.json();

            // 1. Exibir Detalhes de Texto
            nameTitle.textContent = product.name;
            
            if (categorySpan) {
                categorySpan.textContent = product.category_name || 'Sem categoria';
            }

            priceSpan.textContent = `R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}`;
            
            if (stockSpan) {
                stockSpan.textContent = product.stock_quantity ?? '0';
            }

            descriptionSpan.textContent = product.description || 'Nenhuma descrição fornecida.';

            // 2. Exibir Imagens usando IMG_BASE_URL dinâmico
            imagesContainer.innerHTML = ''; 
            
            if (product.image_urls && product.image_urls.length > 0) {
                product.image_urls.forEach(imageUrl => {
                    // Ajuste aqui para usar a URL de produção se necessário
                    const imgUrl = imageUrl.startsWith('http') ? imageUrl : `${IMG_BASE_URL}/${imageUrl}`;
                    
                    const imgElement = document.createElement('img');
                    imgElement.src = imgUrl;
                    imgElement.alt = product.name;
                    imgElement.className = 'detail-image'; 
                    imagesContainer.appendChild(imgElement);
                });
            } else {
                imagesContainer.innerHTML = `
                    <img src="${placeholderPath}" alt="Sem imagem" class="detail-image">
                `;
            }

            // 3. Mostrar links de Ação
            if (editLink) {
                editLink.style.display = 'inline-block';
                editLink.href = `edicao_produto.html?id=${productID}`;
            }
            if (deleteBtn) {
                deleteBtn.style.display = 'inline-block'; 
            }

        } catch (error) {
            console.error('Erro ao buscar detalhes do produto:', error);
            nameTitle.textContent = 'Erro ao carregar detalhes do produto.';
            imagesContainer.innerHTML = 'Não foi possível carregar os detalhes.';
        }
    };

    // --- FUNÇÃO DE EXCLUSÃO ---
    const handleDelete = async () => {
        if (!confirm("Tem certeza que deseja DELETAR este produto? Esta ação não pode ser desfeita.")) {
            return; 
        }
        
        deleteBtn.disabled = true;
        deleteBtn.textContent = 'Excluindo...';

        try {
            // Usa a constante dinâmica API_URL
            const response = await fetch(`${API_URL}/products/${productID}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                alert('Produto excluído com sucesso!');
                window.location.href = 'listagem_produtos.html';
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido.' }));
                alert(`Falha ao excluir produto: ${errorData.message}`);
            }

        } catch (error) {
            console.error('Erro na requisição de exclusão:', error);
            alert('Erro de conexão com o servidor.');
        } finally {
            deleteBtn.disabled = false;
            deleteBtn.textContent = 'Excluir Produto';
        }
    };

    fetchProductDetails();
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDelete);
    }
});