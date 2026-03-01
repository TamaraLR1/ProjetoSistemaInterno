const API_URL = 'http://localhost:5000/api';
const IMG_BASE_URL = 'http://localhost:5000/uploads';

/**
 * Carrega as categorias no carrossel superior
 */
async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        const categories = await response.json();
        const grid = document.getElementById('categories-cards-grid');

        if (!grid) return;

        grid.innerHTML = categories.map(cat => `
            <div class="category-card" 
                 onclick="window.location.href='categoria.html?id=${cat.id}&name=${encodeURIComponent(cat.name)}'" 
                 title="${cat.name}">
                <div class="category-icon"><i class="fas fa-tag"></i></div>
                <h3>${cat.name}</h3>
            </div>
        `).join('');
        
        setupCarousel();
    } catch (err) {
        console.error("Erro ao carregar categorias:", err);
    }
}

/**
 * Carrega os produtos da vitrine principal
 */
async function loadProducts() {
    const grid = document.getElementById('ecommerce-products-grid');
    if (!grid) return;

    try {
        const res = await fetch(`${API_URL}/public/products`);
        const products = await res.json();

        if (products.length === 0) {
            grid.innerHTML = '<p>Nenhum produto em oferta no momento.</p>';
            return;
        }

        // ALTERAÇÃO REALIZADA: 
        // 1. Mantive o onclick no card
        // 2. Removi o botão "Ver Detalhes" indesejado
        // 3. Organizei a estrutura da imagem para o CSS controlar
        grid.innerHTML = products.map(p => {
            const imagePath = p.main_image 
                ? (p.main_image.startsWith('http') ? p.main_image : `${IMG_BASE_URL}/${p.main_image}`)
                : 'https://via.placeholder.com/200?text=Sem+Imagem';

            return `
                <div class="product-card" onclick="goToProductDetail(${p.id})" style="cursor: pointer;">
                    <div class="product-img-container">
                        <img src="${imagePath}" alt="${p.name}">
                    </div>
                    <div class="product-info">
                        <div class="product-vendor">
                            <i class="fas fa-store"></i> ${p.seller_name || 'Loja Parceira'}
                        </div>
                        <h3>${p.name}</h3>
                        <div class="product-price">
                            R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error("Erro ao carregar produtos:", e);
        grid.innerHTML = '<p>Erro ao carregar a vitrine. Tente novamente mais tarde.</p>';
    }
}

/**
 * Função de redirecionamento para detalhes
 */
window.goToProductDetail = (id) => {
    window.location.href = `produto.html?id=${id}`;
};

/**
 * Configuração lógica do carrossel de categorias
 */
function setupCarousel() {
    const wrapper = document.getElementById('categories-wrapper');
    const btnNext = document.getElementById('next-cat');
    const btnPrev = document.getElementById('prev-cat');

    if (!wrapper || !btnNext || !btnPrev) return;

    btnNext.onclick = () => wrapper.scrollLeft += wrapper.clientWidth;
    btnPrev.onclick = () => wrapper.scrollLeft -= wrapper.clientWidth;

    wrapper.onscroll = () => {
        btnPrev.style.display = wrapper.scrollLeft > 20 ? 'flex' : 'none';
        const isEnd = wrapper.scrollLeft >= (wrapper.scrollWidth - wrapper.clientWidth - 20);
        btnNext.style.display = isEnd ? 'none' : 'flex';
    };
}

// Inicialização ao carregar o DOM
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();
});