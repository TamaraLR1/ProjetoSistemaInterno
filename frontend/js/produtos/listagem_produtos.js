document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('products-list-container');
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');
    
    // Caminho corrigido para o placeholder (sobe duas pastas)
    const placeholderPath = '../../assets/placeholder.png'; 

    const fetchProducts = async () => {
        // 1. Prepara o estado inicial
        loadingMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        container.innerHTML = ''; 

        try {
            // Adiciona um 'cache buster' para garantir que a lista seja sempre atualizada
            const cacheBuster = `?v=${new Date().getTime()}`;
            // A porta 5000 é do seu Backend (Express)
            const url = `http://localhost:5000/api/products${cacheBuster}`; 

            // Esta rota é pública, então não precisa do 'credentials: include' no fetch, 
            // mas é bom ter o CORS configurado no servidor.
            const response = await fetch(url, {
                method: 'GET',
            });

            if (!response.ok) {
                // Tenta ler a mensagem de erro do backend, se houver
                const errorData = await response.json().catch(() => ({ message: `Erro HTTP: ${response.status}` }));
                throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
            }

            const products = await response.json();

            // 2. Oculta a mensagem de carregamento
            loadingMessage.style.display = 'none';

            if (products.length === 0) {
                container.innerHTML = '<p style="text-align: center; width: 100%;">Nenhum produto cadastrado ainda.</p>';
                return;
            }

            // 3. Renderiza os cards
            products.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                
                // O controller listProducts garante que `product.image_url` contenha a primeira URL de imagem.
                const imageUrl = product.image_url && product.image_url.trim() !== ''
                    ? `http://localhost:5000/${product.image_url}` 
                    : placeholderPath; 

                // Log para depuração
                console.log(`[PRODUTO: ${product.id}] URL da Imagem de Destaque: ${imageUrl}`);
                
                // 🌟 ATUALIZAÇÃO: Link para a nova página de DETALHES
                productCard.innerHTML = `
                    <img src="${imageUrl}" alt="${product.name}" class="product-image">
                    <h2>${product.name}</h2>
                    <p class="product-price">R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}</p>
                    <p class="product-description">${product.description || 'Sem descrição.'}</p>
                    
                    <a href="detalhes_produto.html?id=${product.id}" class="detail-link-btn">
                        Ver Detalhes
                    </a>
                `;

                container.appendChild(productCard);
            });

        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            loadingMessage.style.display = 'none';
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'Ocorreu um erro ao carregar os produtos. Verifique o console.';
        }
    };

    fetchProducts();
});