// Caminho: frontend/js/products/listagem_produtos.js

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('products-list-container');
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');
    
    // Caminho corrigido para o placeholder (sobe duas pastas)
    const placeholderPath = '../../assets/placeholder.png'; 

    const fetchProducts = async () => {
        loadingMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        container.innerHTML = ''; 

        try {
            // Adiciona um 'cache buster' para garantir que a lista seja sempre atualizada
            const cacheBuster = `?v=${new Date().getTime()}`;
            // A porta 5000 é do seu Backend (Express)
            const url = `http://localhost:5000/api/products${cacheBuster}`; 

            const response = await fetch(url, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const products = await response.json();

            loadingMessage.style.display = 'none';

            if (products.length === 0) {
                container.innerHTML = '<p>Nenhum produto cadastrado ainda.</p>';
                return;
            }

            products.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                
                // Verifica se a URL existe e não é vazia
                // O controller listProducts garante que `product.image_url` contenha a primeira URL de imagem.
                const imageUrl = product.image_url && product.image_url.trim() !== ''
                    ? `http://localhost:5000/${product.image_url}` 
                    : placeholderPath; 

                // Log para depuração: Mostra a URL que está sendo usada
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