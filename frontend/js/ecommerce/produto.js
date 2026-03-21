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
        const response = await fetch(`${API_URL}/public/products/${productId}`);
        if (!response.ok) throw new Error('Produto não encontrado');
        
        const product = await response.json();
        renderProduct(product);
    } catch (err) {
        console.error("Erro ao carregar detalhes:", err);
    }
}

function renderProduct(product) {
    // Preenche os campos do HTML
    document.getElementById('product-name').innerText = product.name;
    document.getElementById('product-description').innerText = product.description || 'Sem descrição.';
    document.getElementById('product-seller').innerText = product.seller_name || 'Loja Oficial';
    document.getElementById('product-price').innerText = `R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}`;
    
    const imgElement = document.getElementById('product-img');
    if (imgElement) {
        const imageFile = product.main_image || product.image;
        if (imageFile) {
            imgElement.src = imageFile.startsWith('http') ? imageFile : `${IMG_BASE_URL}/${imageFile}`;
        } else {
            imgElement.src = 'https://via.placeholder.com/400?text=Sem+Foto';
        }
    }

    // Define os cliques chamando a função que estava faltando
    document.getElementById('btn-add-to-cart').onclick = () => handleCartAction(product.id, 'add_cart');
    document.getElementById('btn-buy-now').onclick = () => handleCartAction(product.id, 'buy_now');
}

// ESTA É A FUNÇÃO QUE ESTAVA FALTANDO NO SEU ARQUIVO:
async function handleCartAction(productId, type) {
    try {
        const response = await fetch(`${API_URL}/cart/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity: 1 }),
            credentials: 'include' 
        });

        // Se o servidor responder 401, redireciona para login
        if (response.status === 401) {
            const currentUrl = encodeURIComponent(window.location.href);
            window.location.href = `login.html?redirect=${currentUrl}`;
            return;
        }

        if (response.ok) {
            if (type === 'buy_now') {
                window.location.href = 'carrinho.html';
            } else {
                alert("Produto adicionado ao seu carrinho!");
                // CHAVE: Atualiza o contador de itens no cabeçalho usando o auth.js
                if (typeof checkUserSession === 'function') {
                    await checkUserSession();
                }
            }
        }
    } catch (err) {
        console.error("Erro ao processar clique no carrinho:", err);
        alert("Erro ao adicionar produto. Tente novamente.");
    }
}

document.addEventListener('DOMContentLoaded', initProductDetails);