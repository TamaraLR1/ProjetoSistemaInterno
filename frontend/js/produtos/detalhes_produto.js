// Caminho: frontend/js/produtos/detalhes_produto.js

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    // Elementos de exibição
    const nameTitle = document.getElementById('product-name-title');
    const priceSpan = document.getElementById('product-price');
    const sellerSpan = document.getElementById('product-seller'); // Elemento para o nome do vendedor
    const descriptionSpan = document.getElementById('product-description');
    const imagesContainer = document.getElementById('product-images-container');
    const editLink = document.getElementById('edit-link'); 
    const deleteBtn = document.getElementById('delete-btn'); 
    
    const placeholderPath = '../../assets/placeholder.png'; 

    if (!productId || isNaN(parseInt(productId))) {
        nameTitle.textContent = 'Erro: ID do produto inválido na URL.';
        return;
    }
    const productID = parseInt(productId);
    nameTitle.textContent = 'Carregando detalhes...';

// --- FUNÇÃO DE BUSCA E EXIBIÇÃO ---
    const fetchProductDetails = async () => {
        try {
            // Usa a rota GET /api/products/:id (protegida)
            const response = await fetch(`http://localhost:5000/api/products/${productID}`, {
                method: 'GET',
                credentials: 'include',
            });

            if (response.status === 401 || response.status === 403) {
                // Se a rota está protegida e falhar, assume que a sessão expirou
                alert('Sessão expirada ou não autenticado. Redirecionando para o login.');
                window.location.href = '../../login.html';
                return;
            }
            
            if (!response.ok) {
                throw new Error('Falha ao buscar detalhes do produto.');
            }

            const product = await response.json();

            // 1. Exibir Detalhes de Texto
            nameTitle.textContent = product.name;
            priceSpan.textContent = `R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}`;
            
            // CORREÇÃO: Usar firstName e lastName do vendedor
            sellerSpan.textContent = `${product.firstName || 'Desconhecido'} ${product.lastName || ''}`.trim();

            descriptionSpan.textContent = product.description || 'Nenhuma descrição fornecida.';

            // 2. Exibir Imagens
            imagesContainer.innerHTML = ''; 
            
            if (product.image_urls && product.image_urls.length > 0) {
                product.image_urls.forEach(imageUrl => {
                    const imgUrl = `http://localhost:5000/uploads/${imageUrl}`;
                    const imgElement = document.createElement('img');
                    imgElement.src = imgUrl;
                    imgElement.alt = product.name;
                    imgElement.className = 'detail-image'; 
                    imagesContainer.appendChild(imgElement);
                });
            } else {
                imagesContainer.innerHTML = `
                    <img src="${placeholderPath}" alt="Sem imagem" class="detail-image">
                `;
            }

            // 3. Mostrar links de Ação se o usuário for o dono (baseado na flag isOwner do backend)
            if (product.isOwner) {
                editLink.style.display = 'inline-block';
                editLink.href = `edicao_produto.html?id=${productID}`;
                
                deleteBtn.style.display = 'inline-block'; 
            } else {
                 // Garante que os botões fiquem escondidos se o isOwner for false
                 editLink.style.display = 'none';
                 deleteBtn.style.display = 'none'; 
            }

        } catch (error) {
            console.error('Erro ao buscar detalhes do produto:', error);
            nameTitle.textContent = 'Erro ao carregar detalhes do produto.';
            imagesContainer.innerHTML = 'Não foi possível carregar os detalhes.';
        }
    };

// --- FUNÇÃO DE EXCLUSÃO ---
    const handleDelete = async () => {
        if (!confirm("Tem certeza que deseja DELETAR este produto? Esta ação não pode ser desfeita e removerá todas as imagens associadas.")) {
            return; // Sai se o usuário cancelar
        }
        
        deleteBtn.disabled = true;
        deleteBtn.textContent = 'Excluindo...';

        try {
            // Chama a rota DELETE protegida
            const response = await fetch(`http://localhost:5000/api/products/${productID}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                alert('Produto excluído com sucesso!');
                // Redireciona para a lista após a exclusão
                window.location.href = 'listagem_produtos.html';
            } else if (response.status === 403) {
                alert('Acesso negado: Você não tem permissão para excluir este produto.');
            } else if (response.status === 401) {
                alert('Sessão expirada. Redirecionando para o login.');
                window.location.href = '../../login.html';
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido.' }));
                alert(`Falha ao excluir produto: ${errorData.message}`);
            }

        } catch (error) {
            console.error('Erro na requisição de exclusão:', error);
            alert('Erro de conexão com o servidor. Verifique o console.');
        } finally {
            deleteBtn.disabled = false;
            deleteBtn.textContent = 'Excluir Produto';
        }
    };


    // --- INICIALIZAÇÃO ---
    fetchProductDetails();
    
    // Adiciona o listener de exclusão apenas se o botão existir no HTML
    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDelete);
    }
});