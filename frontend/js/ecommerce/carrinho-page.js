const IMG_BASE_URL = 'http://localhost:5000/uploads';

function loadCart() {
    const cart = JSON.parse(localStorage.getItem('cart_items')) || [];
    const container = document.getElementById('cart-list');
    const summary = document.getElementById('cart-summary');
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = "<p>Seu carrinho está vazio.</p>";
        summary.style.display = 'none';
        return;
    }

    summary.style.display = 'block';
    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        const imagePath = item.image 
            ? (item.image.startsWith('http') ? item.image : `${IMG_BASE_URL}/${item.image}`)
            : 'https://via.placeholder.com/80';

        return `
            <div class="cart-item">
                <img src="${imagePath}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <small>Vendedor: ${item.seller}</small>
                    <p>Qtd: ${item.quantity} x R$ ${parseFloat(item.price).toFixed(2)}</p>
                </div>
                <div class="cart-item-subtotal">
                    R$ ${itemTotal.toFixed(2).replace('.', ',')}
                </div>
                <button onclick="removeItem(${item.id})" style="color: red; border: none; background: none; cursor: pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');

    document.getElementById('cart-total-value').innerText = `Total: R$ ${total.toFixed(2).replace('.', ',')}`;
}

function removeItem(id) {
    let cart = JSON.parse(localStorage.getItem('cart_items')) || [];
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('cart_items', JSON.stringify(cart));
    loadCart();
}

document.addEventListener('DOMContentLoaded', loadCart);