/**
 * 2. Inicialização: Carrega os itens assim que a página abre
 */
async function initCart() {
    try {
        const response = await fetch(`${API_URL}/cart`, { 
            credentials: 'include' 
        });

        if (response.status === 401) {
            // Se não estiver logado, redireciona para o login com retorno
            const currentUrl = encodeURIComponent(window.location.href);
            window.location.href = `login.html?redirect=${currentUrl}`;
            return;
        }

        if (!response.ok) throw new Error('Erro ao buscar dados do carrinho');

        const cartItems = await response.json();
        renderCartTable(cartItems);
    } catch (err) {
        console.error("Erro no carrinho:", err);
        showEmptyMessage();
    }
}

/**
 * 3. Renderização: Constrói as linhas da tabela dinamicamente
 */
function renderCartTable(items) {
    const tbody = document.getElementById('cart-items-body');
    const cartTable = document.getElementById('cart-table');
    const summaryDiv = document.getElementById('cart-summary');
    const emptyMsg = document.getElementById('cart-empty-msg');
    const totalDisplay = document.getElementById('cart-total-value');

    let grandTotal = 0;
    tbody.innerHTML = '';

    if (!items || items.length === 0) {
        showEmptyMessage();
        return;
    }

    // Mostra a tabela e o resumo, esconde a mensagem de vazio
    cartTable.style.display = 'table';
    summaryDiv.style.display = 'flex';
    emptyMsg.style.display = 'none';

    items.forEach(item => {
        const price = parseFloat(item.price);
        const quantity = parseInt(item.quantity);
        const subtotal = price * quantity;
        grandTotal += subtotal;

        // Ajuste dinâmico da imagem para não quebrar no celular
        const imagePath = item.main_image 
            ? (item.main_image.startsWith('http') ? item.main_image : `${IMG_BASE_URL}/${item.main_image}`)
            : 'https://via.placeholder.com/100?text=Sem+Imagem';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="product-cell">
                    <img src="${imagePath}" alt="${item.name}">
                    <span class="product-name">${item.name}</span>
                </div>
            </td>
            <td>R$ ${price.toFixed(2).replace('.', ',')}</td>
            <td>
                <input type="number" class="qty-input" value="${quantity}" min="1" 
                       onchange="updateCartQuantity(${item.productId}, this.value)">
            </td>
            <td><strong>R$ ${subtotal.toFixed(2).replace('.', ',')}</strong></td>
            <td>
                <button class="btn-delete" onclick="removeCartItem(${item.productId})" title="Remover item">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    totalDisplay.innerText = `R$ ${grandTotal.toFixed(2).replace('.', ',')}`;
}

/**
 * 4. Ação: Atualizar quantidade diretamente na tabela
 */
async function updateCartQuantity(productId, newQuantity) {
    if (newQuantity < 1) return;

    try {
        const response = await fetch(`${API_URL}/cart/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity: parseInt(newQuantity) }),
            credentials: 'include'
        });

        if (response.ok) {
            initCart(); 
        }
    } catch (err) {
        console.error("Erro ao atualizar quantidade:", err);
    }
}

/**
 * 5. Ação: Remover item do carrinho
 */
async function removeCartItem(productId) {
    if (!confirm("Deseja realmente remover este produto do seu carrinho?")) return;

    try {
        const response = await fetch(`${API_URL}/cart/remove/${productId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            initCart(); 
            if (typeof checkUserSession === 'function') checkUserSession();
        }
    } catch (err) {
        console.error("Erro ao remover item:", err);
    }
}

/**
 * 6. Auxiliar: Interface para carrinho vazio
 */
function showEmptyMessage() {
    const table = document.getElementById('cart-table');
    const summary = document.getElementById('cart-summary');
    const msg = document.getElementById('cart-empty-msg');
    
    if (table) table.style.display = 'none';
    if (summary) summary.style.display = 'none';
    if (msg) msg.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', initCart);