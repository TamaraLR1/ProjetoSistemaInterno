const API_URL = 'http://localhost:5000/api';
const IMG_BASE_URL = 'http://localhost:5000/uploads';

async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        const categories = await response.json();
        const grid = document.getElementById('categories-cards-grid');

        grid.innerHTML = categories.map(cat => `
            <div class="category-card" onclick="goToCategory(${cat.id}, '${cat.name}')">
                <div class="category-icon"><i class="fas fa-tag"></i></div>
                <h3>${cat.name}</h3>
            </div>
        `).join('');
        setupCarousel();
    } catch (err) { console.error(err); }
}

// REDIRECIONAMENTO PARA NOVA TELA
window.goToCategory = (id, name) => {
    window.location.href = `categoria.html?id=${id}&name=${encodeURIComponent(name)}`;
};

function setupCarousel() {
    const wrapper = document.getElementById('categories-wrapper');
    const btnNext = document.getElementById('next-cat');
    const btnPrev = document.getElementById('prev-cat');
    btnNext.onclick = () => wrapper.scrollLeft += wrapper.clientWidth;
    btnPrev.onclick = () => wrapper.scrollLeft -= wrapper.clientWidth;
    wrapper.onscroll = () => {
        btnPrev.style.display = wrapper.scrollLeft > 20 ? 'flex' : 'none';
        btnNext.style.display = wrapper.scrollLeft >= (wrapper.scrollWidth - wrapper.clientWidth - 20) ? 'none' : 'flex';
    };
}

async function loadProducts() {
    const grid = document.getElementById('ecommerce-products-grid');
    try {
        const res = await fetch(`${API_URL}/public/products`);
        const data = await res.json();
        grid.innerHTML = data.map(p => `
            <div class="product-card">
                <img src="${p.main_image ? `${IMG_BASE_URL}/${p.main_image}` : 'https://via.placeholder.com/150'}" style="width:100%; height:140px; object-fit:contain;">
                <h3 style="font-size:0.85rem; margin:10px 0; height:2.4rem; overflow:hidden;">${p.name}</h3>
                <p style="color:var(--primary); font-weight:800;">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>
            </div>
        `).join('');
    } catch (e) { console.error(e); }
}

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();
});