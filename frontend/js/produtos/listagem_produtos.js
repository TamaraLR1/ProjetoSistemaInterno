document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('products-list-container');
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');
    
    const placeholderPath = '../../assets/placeholder.png'; 

    // Função global para trocar a foto e gerenciar a classe 'active'
    window.trocarFoto = function(el, productId) {
        // 1. Atualiza a imagem principal do card correspondente
        const mainImg = document.getElementById(`main-img-${productId}`);
        if (mainImg) mainImg.src = el.src;

        // 2. Localiza o container de miniaturas específico deste card
        const thumbContainer = el.parentElement;
        
        // 3. Remove a classe 'active' de todas as miniaturas dentro deste container
        const allThumbs = thumbContainer.querySelectorAll('.thumbnail-item');
        allThumbs.forEach(thumb => thumb.classList.remove('active'));

        // 4. Adiciona a classe 'active' apenas na miniatura que disparou o evento
        el.classList.add('active');
    };

    const fetchProducts = async () => {
        loadingMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        container.innerHTML = ''; 

        try {
            const url = `http://localhost:5000/api/products?v=${Date.now()}`; 
            
            const response = await fetch(url, { 
                method: 'GET',
                credentials: 'include' 
            });

            if (response.status === 401 || response.status === 403) {
                window.location.href = '../login.html';
                return;
            }

            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

            const products = await response.json();
            loadingMessage.style.display = 'none';

            if (!Array.isArray(products) || products.length === 0) {
                container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Você ainda não cadastrou nenhum produto.</p>';
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
                    style: 'currency',
                    currency: 'BRL'
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
                
                // ALTERAÇÃO: onmouseover agora chama a função trocarFoto passando o elemento (this) e o ID
                productCard.innerHTML = `
                    <div class="main-image-container">
                        <img src="${mainImg}" 
                             alt="${product.name || 'Produto'}" 
                             class="product-image" 
                             id="main-img-${product.id}">
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
            loadingMessage.style.display = 'none';
            errorMessage.style.display = 'block';
            errorMessage.textContent = `Erro ao carregar produtos.`;
        }
    };

    fetchProducts();
});