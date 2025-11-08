// Caminho: frontend/js/produtos/detalhes_produto.js

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    // Elementos de exibição
    const nameTitle = document.getElementById('product-name-title');
    const priceSpan = document.getElementById('product-price');
    const sellerSpan = document.getElementById('product-seller');
    const descriptionSpan = document.getElementById('product-description');
    const imagesContainer = document.getElementById('product-images-container');
    const loadingImagesMsg = document.getElementById('loading-images');
    const editLink = document.getElementById('edit-link'); 
    
    const placeholderPath = '../../assets/placeholder.png'; 

    if (!productId || isNaN(parseInt(productId))) {
        nameTitle.textContent = 'Erro: ID do produto inválido na URL.';
        return;
    }
    const productID = parseInt(productId);
    nameTitle.textContent = 'Carregando detalhes...';


    const fetchProductDetails = async () => {
        try {
            // Usa a rota GET /api/products/:id que foi corrigida no controller
            const response = await fetch(`http://localhost:5000/api/products/${productID}`, {
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
            priceSpan.textContent = `R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}`;
            sellerSpan.textContent = product.firstName || 'Desconhecido';
            descriptionSpan.textContent = product.description || 'Nenhuma descrição fornecida.';

            // 2. Exibir Imagens
            imagesContainer.innerHTML = ''; // Limpa a mensagem de carregamento

            if (product.image_urls && product.image_urls.length > 0) {
                product.image_urls.forEach(imageUrl => {
                    const imgUrl = `http://localhost:5000/${imageUrl}`;
                    const imgElement = document.createElement('img');
                    imgElement.src = imgUrl;
                    imgElement.alt = product.name;
                    imgElement.className = 'detail-image'; // Classe para estilização
                    imagesContainer.appendChild(imgElement);
                });
            } else {
                // Caso não haja imagens, exibe o placeholder
                imagesContainer.innerHTML = `
                    <img src="${placeholderPath}" alt="Sem imagem" class="detail-image">
                `;
            }

            // 3. Mostrar link de Edição se o usuário for o dono
            if (product.isOwner) {
                editLink.style.display = 'inline-block';
                editLink.href = `edicao_produto.html?id=${productID}`;
            }

        } catch (error) {
            console.error('Erro ao buscar detalhes do produto:', error);
            nameTitle.textContent = 'Erro ao carregar detalhes do produto.';
            imagesContainer.innerHTML = '';
            imagesContainer.appendChild(document.createTextNode('Não foi possível carregar as imagens.'));
        }
    };

    fetchProductDetails();
});