const API_URL = 'http://localhost:5000/api';
const IMG_BASE_URL = 'http://localhost:5000/uploads';

/**
 * 1. Inicialização: Busca os dados do produto na API
 */
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
        console.log("Produto carregado:", product);
        
        renderProduct(product);
    } catch (err) {
        console.error("Erro ao carregar detalhes:", err);
        document.querySelector('.container').innerHTML = `
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
 * 2. Renderização: Preenche o HTML e configura a Galeria/Quantidade
 */
function renderProduct(product) {
    // Informações de texto
    document.getElementById('product-name').innerText = product.name;
    document.getElementById('product-description').innerText = product.description || 'Sem descrição disponível.';
    document.getElementById('product-seller').innerText = product.seller_name || 'Loja Oficial';
    document.getElementById('product-price').innerText = `R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}`;
    
    // Controle de Estoque
    const stockCount = product.stock_quantity || 0;
    document.getElementById('stock-count').innerText = stockCount;
    
    // ---------------------------------------------------------
    // LÓGICA DA IMAGEM PRINCIPAL E GALERIA
    // ---------------------------------------------------------
    const mainImgElement = document.getElementById('product-img');
    const thumbsContainer = document.getElementById('product-thumbs');

    if (mainImgElement) {
        const mainImg = product.main_image;
        mainImgElement.src = mainImg ? (mainImg.startsWith('http') ? mainImg : `${IMG_BASE_URL}/${mainImg}`) : 'https://via.placeholder.com/450?text=Sem+Foto';
    }

    if (thumbsContainer && product.all_images) {
        thumbsContainer.innerHTML = '';
        let imagesArray = typeof product.all_images === 'string' ? product.all_images.split(',') : product.all_images;

        if (imagesArray.length > 1) {
            imagesArray.forEach((imgFile, index) => {
                const thumbImg = document.createElement('img');
                const fullUrl = imgFile.startsWith('http') ? imgFile : `${IMG_BASE_URL}/${imgFile.trim()}`;
                
                thumbImg.src = fullUrl;
                thumbImg.classList.add('thumb-item');
                if (imgFile === product.main_image) thumbImg.classList.add('active');

                thumbImg.onclick = function() {
                    mainImgElement.src = this.src;
                    document.querySelectorAll('.thumb-item').forEach(el => el.classList.remove('active'));
                    this.classList.add('active');
                };
                thumbsContainer.appendChild(thumbImg);
            });
        }
    }

    // ---------------------------------------------------------
    // CONFIGURAÇÃO DOS BOTÕES DE AÇÃO
    // ---------------------------------------------------------
    document.getElementById('btn-add-to-cart').onclick = () => handleCartAction(product.id, 'add_cart');
    document.getElementById('btn-buy-now').onclick = () => handleCartAction(product.id, 'buy_now');

    // Configura o cálculo de frete
    const btnShipping = document.getElementById('btn-calculate-shipping');
    if (btnShipping) {
        btnShipping.onclick = calculateShipping;
    }
}

/**
 * 3. Controle de Quantidade (+ / -)
 */
function changeQty(value) {
    const qtyInput = document.getElementById('product-qty');
    const maxStock = parseInt(document.getElementById('stock-count').innerText) || 1;
    let currentQty = parseInt(qtyInput.value);

    currentQty += value;

    if (currentQty < 1) currentQty = 1;
    if (currentQty > maxStock) currentQty = maxStock;

    qtyInput.value = currentQty;
}

/**
 * 4. Simulação de Frete
 */
function calculateShipping() {
    const cep = document.getElementById('cep-input').value.replace(/\D/g, '');
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
 * 5. Ação do Carrinho (Envia ID e Quantidade selecionada)
 */
async function handleCartAction(productId, type) {
    const quantity = parseInt(document.getElementById('product-qty').value) || 1;

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

// Globaliza a função changeQty para os botões do HTML poderem acessar
window.changeQty = changeQty;

document.addEventListener('DOMContentLoaded', initProductDetails);