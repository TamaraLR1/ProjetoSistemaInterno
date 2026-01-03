document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('products-list-container');
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');
    
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const clearSearchButton = document.getElementById('clear-search-button'); // Novo elemento

    const placeholderPath = '../../assets/placeholder.png'; 

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
            const url = `http://localhost:5000/api/products?q=${encodeURIComponent(q)}&v=${Date.now()}`; 
            
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
                        <button onclick="document.getElementById('search-input').value=''; location.reload();" 
                                style="color: #007bff; background: none; border: none; cursor: pointer; text-decoration: underline;">
                            Ver lista completa
                        </button>
                    </div>`;
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

                const mainImg = imagensArray.length > 0 
                    ? `http://localhost:5000/uploads/${imagensArray[0]}` 
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
                            <img src="http://localhost:5000/uploads/${img}" 
                                 class="thumbnail-item ${idx === 0 ? 'active' : ''}" 
                                 onmouseover="trocarFoto(this, '${product.id}')"
                                 alt="Miniatura">
                        `).join('')}
                    </div>
                    <div class="product-info">
                        <h2>${product.name || 'Sem nome'}</h2>
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
                errorMessage.textContent = `Erro ao carregar produtos.`;
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

    // EVENTO DO BOTÃO VER TODOS
    if (clearSearchButton) {
        clearSearchButton.addEventListener('click', () => {
            searchInput.value = ''; // Limpa o campo de texto
            fetchProducts('');      // Busca sem filtros
        });
    }

    fetchProducts();
});