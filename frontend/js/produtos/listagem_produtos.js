// frontend/js/products/listagem_produtos.js

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('products-list-container');
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');

    const fetchProducts = async () => {
        // Resetar estados
        loadingMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        container.innerHTML = ''; // Limpa o container, exceto a mensagem de loading

        try {

            const cacheBuster = `?v=${new Date().getTime()}`;
            const url = `http://localhost:5000/api/products${cacheBuster}`;
            // Chamada à nova API GET /api/products
            const response = await fetch(url, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const products = await response.json();

            // Oculta a mensagem de loading
            loadingMessage.style.display = 'none';

            if (products.length === 0) {
                container.innerHTML = '<p>Nenhum produto cadastrado ainda.</p>';
                return;
            }

            // Renderiza cada produto
            products.forEach(product => {
                // CORREÇÃO DO CAMINHO DO PLACEHOLDER
                const placeholderPath = '../../assets/placeholder.png';
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                
                // Nota: O URL da imagem virá da sua pasta 'uploads' (ex: uploads/nome-do-arquivo)
                // Você precisará configurar o Express para servir esta pasta estaticamente.
                const imageUrl = product.image_url 
                    ? `http://localhost:5000/${product.image_url}` 
                    : placeholderPath; // Use uma imagem padrão se não houver

                console.log(`[PRODUTO: ${product.id}] URL da Imagem: ${imageUrl}`);

                productCard.innerHTML = `
                    <img src="${imageUrl}" alt="${product.name}" class="product-image">
                    <h2>${product.name}</h2>
                    <p class="product-price">R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}</p>
                    <p class="product-description">${product.description || 'Sem descrição.'}</p>
                    <button>Ver Detalhes</button>
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