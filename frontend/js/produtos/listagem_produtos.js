// Caminho: frontend/js/produtos/listagem_produtos.js

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
                credentials: 'include', // Essencial para o backend verificar a autenticação
            });

            if (!response.ok) {
                // Se a resposta for 401/403 (Não autorizado/Proibido), redireciona para o login.
                 if (response.status === 401 || response.status === 403) {
                    console.warn('Sessão expirada. Redirecionando para o login.');
                    // Assumindo que o login.html está na raiz, sobe duas pastas do /html/produtos/
                    window.location.href = '../../login.html'; 
                    return;
                }
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
                const imageUrl = product.image_url && product.image_url.trim() !== ''
                    ? `http://localhost:5000/${product.image_url}` 
                    : placeholderPath; 

                // Monta o card do produto
                productCard.innerHTML = `
                    <img src="${imageUrl}" alt="${product.name}" class="product-image">
                    <h2>${product.name}</h2>
                    <p class="product-price">R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}</p>
                    <p class="product-description">${product.description || 'Sem descrição.'}</p>
                    
                    <button class="edit-product-btn" data-product-id="${product.id}">Editar</button>
                `;
                container.appendChild(productCard);
            });

            // 🌟 NOVO: Adicionar event listener para os botões "Editar"
            document.querySelectorAll('.edit-product-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    // Pega o ID do produto armazenado no atributo data-product-id
                    const id = event.currentTarget.getAttribute('data-product-id');
                    
                    // Redireciona para a nova página de edição, passando o ID como parâmetro de consulta
                    window.location.href = `edicao_produto.html?id=${id}`;
                });
            });


        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            loadingMessage.style.display = 'none';
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'Ocorreu um erro ao carregar os produtos. Verifique o console ou a conexão com o backend.';
        }
    };

    fetchProducts();
});