/**
 * 2. Inicialização: Captura parâmetros da URL e busca produtos
 */
async function initCategoryPage() {
    const params = new URLSearchParams(window.location.search);
    const catId = params.get('id');
    const catName = params.get('name');

    if (!catId) {
        console.error("ID da categoria não encontrado na URL.");
        window.location.href = 'index.html';
        return;
    }

    // Atualiza o título visual
    const titleElement = document.getElementById('category-name-display');
    if (titleElement) titleElement.innerText = decodeURIComponent(catName);

    try {
        // Chamada à API usando a URL dinâmica
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

/**
 * 3. Renderização dos cards de produto
 */
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
        // Ajuste dinâmico do caminho da imagem
        const imagePath = p.main_image 
            ? (p.main_image.startsWith('http') ? p.main_image : `${IMG_BASE_URL}/${p.main_image}`)
            : 'https://via.placeholder.com/200?text=Sem+Imagem';

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

document.addEventListener('DOMContentLoaded', initCategoryPage);