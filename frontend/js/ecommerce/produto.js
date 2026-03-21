const API_URL = 'http://localhost:5000/api';
const IMG_BASE_URL = 'http://localhost:5000/uploads';

async function initProductDetails() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        window.location.href = 'index.html';
        return;
    }

    // 1. Tenta atualizar o contador. 
    // Se der 401, ele apenas fica em '0', sem redirecionar (silencioso).
    updateCartCounter();

    try {
        // 2. Busca o produto (Rota Pública - Qualquer um vê)
        const response = await fetch(`${API_URL}/public/products/${productId}`);
        if (!response.ok) throw new Error('Produto não encontrado');
        const product = await response.json();

        // 3. Renderiza a página
        renderProduct(product);

    } catch (err) {
        console.error("Erro ao carregar detalhes:", err);
    }
}

function renderProduct(product) {
    document.getElementById('product-name').innerText = product.name;
    document.getElementById('product-description').innerText = product.description || '';
    document.getElementById('product-seller').innerText = product.seller_name || 'Loja';
    document.getElementById('product-price').innerText = `R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}`;
    
    const img = document.getElementById('product-img');
    if (img) {
        img.src = product.main_image 
            ? (product.main_image.startsWith('http') ? product.main_image : `${IMG_BASE_URL}/${product.main_image}`)
            : 'https://via.placeholder.com/400';
    }

    // Define as ações dos botões
    document.getElementById('btn-add-to-cart').onclick = () => handleCartAction(product.id, 'add_cart');
    document.getElementById('btn-buy-now').onclick = () => handleCartAction(product.id, 'buy_now');
}

async function handleCartAction(productId, type) {
    try {
        const response = await fetch(`${API_URL}/cart/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity: 1 }),
            credentials: 'include' 
        });

        // --- AQUI ESTÁ O QUE VOCÊ PEDIU ---
        // Se o servidor responder 401, é porque o usuário clicou mas não está logado.
        if (response.status === 401) {
            console.log("Usuário não logado. Redirecionando agora...");
            
            // Opcional: Salvar no localStorage se você quiser que adicione sozinho após o login
            // localStorage.setItem('pending_action', JSON.stringify({ type, productId }));

            const currentUrl = encodeURIComponent(window.location.href);
            window.location.href = `login.html?redirect=${currentUrl}`;
            return;
        }

        if (response.ok) {
            if (type === 'buy_now') {
                window.location.href = 'carrinho.html';
            } else {
                alert("Produto adicionado ao seu carrinho!");
                updateCartCounter();
            }
        }
    } catch (err) {
        console.error("Erro ao processar clique:", err);
    }
}

async function updateCartCounter() {
    try {
        const res = await fetch(`${API_URL}/cart/count`, { credentials: 'include' });
        const el = document.getElementById('cart-count');
        if (el) {
            if (res.ok) {
                const data = await res.json();
                el.innerText = data.count || 0;
            } else {
                el.innerText = '0'; // Se não estiver logado, contador é 0
            }
        }
    } catch (e) {
        console.error("Erro silencioso no contador.");
    }
}

document.addEventListener('DOMContentLoaded', initProductDetails);