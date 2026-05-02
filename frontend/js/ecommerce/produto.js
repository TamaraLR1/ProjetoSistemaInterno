
/**
 * 2. Inicialização: Busca os dados do produto na API
 */
async function initProductDetails() {
    const params = new URLSearchParams(window.location.search);
    console.log(params);
    const productId = params.get('id');

    if (!productId) { 
        window.location.href = 'index.html'; 
        return; 
    }

    try {
        const response = await fetch(`${API_URL}/public/products/${productId}`);
        if (!response.ok) throw new Error('Produto não encontrado');
        
        const product = await response.json();
        console.log("Produto carregado:", product);
        
        renderProduct(product);
    } catch (err) {
        console.error("Erro ao carregar detalhes:", err);
        const mainContainer = document.querySelector('.container') || document.body;
        mainContainer.innerHTML = `
            <div style="text-align:center; padding: 80px 20px;">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 20px;"></i>
                <h2>Produto não encontrado</h2>
                <p>O item que você procura não está mais disponível.</p>
                <a href="index.html" style="color: var(--primary); font-weight: 600;">Voltar para a página inicial</a>
            </div>
        `;
    }
}

/**
 * 3. Renderização: Preenche o HTML e configura a Galeria/Quantidade
 */
function renderProduct(product) {
    document.getElementById('product-name').innerText = product.name;
    document.getElementById('product-description').innerText = product.description || 'Sem descrição disponível.';
    document.getElementById('product-seller').innerText = product.seller_name || 'Loja Oficial';
    document.getElementById('product-price').innerText = `R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}`;
    
    const stockCount = product.stock_quantity || 0;
    const stockEl = document.getElementById('stock-count');
    if (stockEl) stockEl.innerText = stockCount;
    
    // Imagem Principal
    const mainImgElement = document.getElementById('product-img');
    const thumbsContainer = document.getElementById('product-thumbs');

    if (mainImgElement) {
        const mainImg = product.main_image;
        mainImgElement.src = mainImg 
            ? (mainImg.startsWith('http') ? mainImg : `${IMG_BASE_URL}/${mainImg}`) 
            : 'https://via.placeholder.com/450?text=Sem+Foto';
    }

    // Galeria de miniaturas
    if (thumbsContainer && product.all_images) {
        thumbsContainer.innerHTML = '';
        let imagesArray = typeof product.all_images === 'string' ? product.all_images.split(',') : product.all_images;

        if (imagesArray.length > 1) {
            imagesArray.forEach((imgFile) => {
                const thumbImg = document.createElement('img');
                const cleanFile = imgFile.trim();
                const fullUrl = cleanFile.startsWith('http') ? cleanFile : `${IMG_BASE_URL}/${cleanFile}`;
                
                thumbImg.src = fullUrl;
                thumbImg.classList.add('thumb-item');
                if (cleanFile === product.main_image) thumbImg.classList.add('active');

                thumbImg.onclick = function() {
                    mainImgElement.src = this.src;
                    document.querySelectorAll('.thumb-item').forEach(el => el.classList.remove('active'));
                    this.classList.add('active');
                };
                thumbsContainer.appendChild(thumbImg);
            });
        }
    }

    // Ações
    document.getElementById('btn-add-to-cart').onclick = () => handleCartAction(product.id, 'add_cart');
    document.getElementById('btn-buy-now').onclick = () => handleCartAction(product.id, 'buy_now');

    const btnShipping = document.getElementById('btn-calculate-shipping');
    if (btnShipping) btnShipping.onclick = calculateShipping;
}

/**
 * 4. Controle de Quantidade
 */
function changeQty(value) {
    const qtyInput = document.getElementById('product-qty');
    const stockEl = document.getElementById('stock-count');
    const maxStock = stockEl ? (parseInt(stockEl.innerText) || 1) : 99;
    let currentQty = parseInt(qtyInput.value) || 1;

    currentQty += value;

    if (currentQty < 1) currentQty = 1;
    if (currentQty > maxStock) currentQty = maxStock;

    qtyInput.value = currentQty;
}

/**
 * 5. Simulação de Frete
 */
function calculateShipping() {
    const cepInput = document.getElementById('cep-input');
    if (!cepInput) return;
    
    const cep = cepInput.value.replace(/\D/g, '');
    const resultDiv = document.getElementById('shipping-result');

    if (cep.length === 8) {
        resultDiv.style.color = "#059669";
        resultDiv.innerHTML = `<i class="fas fa-truck"></i> Frete Grátis para ${cep.substring(0,5)}-${cep.substring(5)}! <br> <strong>Entrega estimada:</strong> 3 a 5 dias úteis.`;
    } else {
        resultDiv.style.color = "#dc2626";
        resultDiv.innerText = "Digite um CEP válido com 8 dígitos.";
    }
}

/**
 * 6. Ação do Carrinho
 */
async function handleCartAction(productId, type) {
    const qtyInput = document.getElementById('product-qty');
    const quantity = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;

    try {
        const response = await fetch(`${API_URL}/cart/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity }),
            credentials: 'include' 
        });

        if (response.status === 401) {
            const currentUrl = encodeURIComponent(window.location.href);
            window.location.href = `login.html?redirect=${currentUrl}`;
            return;
        }

        if (response.ok) {
            if (type === 'buy_now') {
                window.location.href = 'carrinho.html';
            } else {
                alert(`Sucesso! ${quantity} item(s) adicionado(s) ao carrinho.`);
                if (typeof checkUserSession === 'function') await checkUserSession();
            }
        } else {
            const error = await response.json();
            alert(error.message || "Erro ao adicionar ao carrinho.");
        }
    } catch (err) {
        console.error("Erro no carrinho:", err);
        alert("Erro de conexão com o servidor.");
    }
}

window.changeQty = changeQty;
document.addEventListener('DOMContentLoaded', initProductDetails);