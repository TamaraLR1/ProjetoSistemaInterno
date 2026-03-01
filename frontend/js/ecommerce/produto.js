const API_URL = 'http://localhost:5000/api';
const IMG_BASE_URL = 'http://localhost:5000/uploads';

async function initProductDetails() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        // Chamada para buscar UM único produto (ajustaremos a rota no back abaixo)
        const response = await fetch(`${API_URL}/public/products/${productId}`);
        const product = await response.json();

        const container = document.getElementById('product-details-content');
        
        const imagePath = product.main_image 
            ? (product.main_image.startsWith('http') ? product.main_image : `${IMG_BASE_URL}/${product.main_image}`)
            : 'https://via.placeholder.com/500';

        container.innerHTML = `
            <div class="image-section">
                <img src="${imagePath}" class="product-image-main" alt="${product.name}">
            </div>
            <div class="product-info-box">
                <span class="seller-badge"><i class="fas fa-store"></i> Vendido por: <strong>${product.seller_name}</strong></span>
                <h1>${product.name}</h1>
                <p class="description-text">${product.description || 'Este produto não possui descrição detalhada.'}</p>
                <div class="price-tag">R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}</div>
                <p style="margin-bottom: 20px; color: ${product.stock_quantity > 0 ? '#10b981' : '#ef4444'}">
                    <i class="fas fa-box"></i> Estoque disponível: ${product.stock_quantity} unidades
                </p>
                <div class="action-buttons">
                    <button class="btn-action btn-cart" onclick="addToCart(${product.id})">Adicionar ao Carrinho</button>
                    <button class="btn-action btn-buy" onclick="checkout(${product.id})">Comprar Agora</button>
                </div>
            </div>
        `;
    } catch (err) {
        console.error(err);
        document.getElementById('product-details-content').innerHTML = "Erro ao carregar o produto.";
    }
}

function addToCart(id) {
    alert("Produto adicionado ao carrinho!");
    // Aqui você implementaria a lógica do LocalStorage ou API de carrinho
}

function checkout(id) {
    window.location.href = `checkout.html?product_id=${id}`;
}

document.addEventListener('DOMContentLoaded', initProductDetails);