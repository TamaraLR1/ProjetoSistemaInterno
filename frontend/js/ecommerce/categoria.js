// Configurações de API
const API_URL = 'http://localhost:5000/api';
const IMG_BASE_URL = 'http://localhost:5000/uploads'; // Ajuste se suas imagens estiverem em outra pasta

async function initCategoryPage() {
    // 1. Captura os parâmetros da URL do navegador (ex: categoria.html?id=4&name=Roupas)
    const params = new URLSearchParams(window.location.search);
    const catId = params.get('id');
    const catName = params.get('name');

    // Validação básica
    if (!catId) {
        console.error("ID da categoria não encontrado na URL.");
        window.location.href = 'index.html';
        return;
    }

    // 2. Atualiza o título visual da página com o nome vindo da URL
    const titleElement = document.getElementById('category-name-display');
    if (titleElement) titleElement.innerText = decodeURIComponent(catName);

    try {
        // 3. CHAMADA À API (Ajustada para sua rota específica do Express)
        // Rota no Back-end: /products/category/:category
        // URL Gerada: http://localhost:5000/api/public/products/category/4
        const response = await fetch(`${API_URL}/public/products/category/${catId}`);
        
        if (!response.ok) throw new Error('Erro ao buscar produtos');
        
        const products = await response.json();
        
        renderProducts(products);

    } catch (err) {
        console.error("Erro na requisição:", err);
        const grid = document.getElementById('category-products-grid');
        if (grid) grid.innerHTML = `<p class="error-msg">Não foi possível carregar os produtos desta categoria.</p>`;
    }
}

function renderProducts(products) {
    const grid = document.getElementById('category-products-grid');
    const countDisplay = document.getElementById('product-count');
    
    if (!grid) return;

    if (!products || products.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-box-open" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 15px; display: block;"></i>
                <p style="color: #64748b; font-size: 1.1rem;">Nenhum produto encontrado nesta categoria.</p>
                <a href="index.html" style="color: var(--primary); text-decoration: none; font-weight: 600; margin-top: 10px; display: inline-block;">Ver outras categorias</a>
            </div>`;
        if (countDisplay) countDisplay.innerText = "0 produtos encontrados";
        return;
    }

    if (countDisplay) countDisplay.innerText = `${products.length} produtos encontrados de vários vendedores`;

    grid.innerHTML = products.map(p => {
        const imagePath = p.main_image 
            ? (p.main_image.startsWith('http') ? p.main_image : `${IMG_BASE_URL}/${p.main_image}`)
            : 'https://via.placeholder.com/200?text=Sem+Imagem';

        // Envolvemos o card em um link que aponta para produto.html?id=...
        return `
            <div class="product-card" 
                 onclick="window.location.href='produto.html?id=${p.id}'" 
                 style="cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; border: 1px solid #eee; padding: 15px; border-radius: 8px;">
                
                <div class="product-img-container" style="height: 160px; display: flex; align-items: center; justify-content: center;">
                    <img src="${imagePath}" alt="${p.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </div>

                <div class="product-vendor" style="font-size: 0.7rem; color: #64748b; margin-top: 10px; margin-bottom: 8px;">
                    <i class="fas fa-store"></i> Vendido por: <strong>${p.seller_name || 'Loja Parceira'}</strong>
                </div>

                <h3 style="font-size: 0.9rem; margin: 12px 0; height: 2.4rem; overflow: hidden; line-height: 1.2; color: #334155;">
                    ${p.name}
                </h3>

                <div class="product-price" style="color: var(--primary); font-weight: 800; font-size: 1.2rem; margin-bottom: 10px;">
                    R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}
                </div>
            </div>
        `;
    }).join('');
}

// Inicializa a página quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initCategoryPage);