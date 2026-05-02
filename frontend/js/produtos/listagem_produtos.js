document.addEventListener('DOMContentLoaded', () => {

    const container = document.getElementById('products-list-container');
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');
    
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const clearSearchButton = document.getElementById('clear-search-button');

    const placeholderPath = '../../assets/placeholder.png'; 

    // Função global para trocar foto (ajustada para ser compatível com as constantes)
    window.trocarFoto = function(el, productId) {
        const mainImg = document.getElementById(`main-img-${productId}`);
        if (mainImg) mainImg.src = el.src;
        const thumbContainer = el.parentElement;
        const allThumbs = thumbContainer.querySelectorAll('.thumbnail-item');
        allThumbs.forEach(thumb => thumb.classList.remove('active'));
        el.classList.add('active');
    };

    const fetchProducts = async (q = '') => {
        if (!container) return;

        loadingMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        container.innerHTML = ''; 

        try {
            // 2. Uso da URL dinâmica com Cache Busting
            const url = `${API_URL}/products?q=${encodeURIComponent(q)}&v=${Date.now()}`; 
            
            const response = await fetch(url, { 
                method: 'GET',
                credentials: 'include' 
            });

            if (response.status === 401 || response.status === 403) {
                window.location.href = '../login.html';
                return;
            }

            const products = await response.json();
            loadingMessage.style.display = 'none';

            if (!Array.isArray(products) || products.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 20px;">
                        <p>Nenhum produto encontrado.</p>
                        <button id="reset-search-btn" 
                                style="color: #007bff; background: none; border: none; cursor: pointer; text-decoration: underline;">
                            Ver lista completa
                        </button>
                    </div>`;
                
                document.getElementById('reset-search-btn')?.addEventListener('click', () => {
                    searchInput.value = '';
                    fetchProducts('');
                });
                return;
            }

            products.forEach(product => {
                let imagensArray = [];
                if (product.all_images) {
                    imagensArray = typeof product.all_images === 'string' 
                        ? product.all_images.split(',') 
                        : product.all_images;
                }

                const precoFormatado = parseFloat(product.price || 0).toLocaleString('pt-BR', {
                    style: 'currency', currency: 'BRL'
                });

                const stock = parseInt(product.stock_quantity || 0);
                let stockHTML = stock === 0 
                    ? `<span class="stock-badge out-of-stock">Sem estoque!</span>` 
                    : `<span class="stock-badge in-stock">Estoque: ${stock} un.</span>`;

                // 3. Uso da IMG_BASE_URL dinâmica para a imagem principal
                const mainImg = imagensArray.length > 0 
                    ? `${IMG_BASE_URL}/${imagensArray[0]}` 
                    : placeholderPath;

                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.style.cursor = 'pointer';

                productCard.onclick = (e) => {
                    if (e.target.classList.contains('thumbnail-item')) return;
                    window.location.href = `detalhes_produto.html?id=${product.id}`;
                };
                
                productCard.innerHTML = `
                    <div class="main-image-container">
                        <img src="${mainImg}" alt="${product.name}" class="product-image" id="main-img-${product.id}">
                    </div>
                    <div class="thumbnails-container">
                        ${imagensArray.map((img, idx) => `
                            <img src="${IMG_BASE_URL}/${img}" 
                                 class="thumbnail-item ${idx === 0 ? 'active' : ''}" 
                                 onmouseover="trocarFoto(this, '${product.id}')"
                                 alt="Miniatura">
                        `).join('')}
                    </div>
                    <div class="product-info">
                        <div class="product-header">
                            <h2>${product.name || 'Sem nome'}</h2>
                            ${stockHTML}
                        </div>
                        <p class="product-price">${precoFormatado}</p>
                        <p class="product-description">${product.description || 'Sem descrição.'}</p>
                    </div>
                `;
                container.appendChild(productCard);
            });

        } catch (error) {
            console.error('Erro:', error);
            if(loadingMessage) loadingMessage.style.display = 'none';
            if(errorMessage) {
                errorMessage.style.display = 'block';
                errorMessage.textContent = `Erro ao conectar com o servidor.`;
            }
        }
    };

    // Eventos de Busca
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', () => fetchProducts(searchInput.value));
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') fetchProducts(searchInput.value);
        });
    }

    if (clearSearchButton) {
        clearSearchButton.addEventListener('click', () => {
            searchInput.value = ''; 
            fetchProducts('');      
        });
    }

    fetchProducts();
});