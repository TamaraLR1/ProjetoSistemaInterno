// Caminho: frontend/js/produtos/edicao_produto.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Coleta de Elementos
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    const form = document.getElementById('product-edit-form');
    const nameInput = document.getElementById('product-name');
    const descriptionInput = document.getElementById('product-description');
    const priceInput = document.getElementById('product-price');
    const imagesInput = document.getElementById('product-images'); 
    // Elemento para exibir MÚLTIPLAS imagens
    const currentImagesContainer = document.getElementById('current-images-container'); 
    const statusMessage = document.getElementById('status-message');
    const titleElement = document.getElementById('edit-page-title');
    
    // Caminho para a imagem placeholder no frontend
    const placeholderPath = '../../assets/placeholder.png'; 

    let productID = null; 

    // 2. Validação Inicial
    if (!productId || isNaN(parseInt(productId))) {
        statusMessage.textContent = 'Erro: ID do produto inválido na URL.';
        statusMessage.className = 'message-box error';
        return;
    }
    productID = parseInt(productId);
    titleElement.textContent = `Editando Produto (ID: ${productID})`;
    form.parentElement.style.display = 'block'; // Mostra o card do formulário

    // ===============================================
    // 3. FUNÇÃO PARA CARREGAR DETALHES DO PRODUTO
    // ===============================================
    const fetchProductDetails = async () => {
        statusMessage.textContent = 'Carregando detalhes...';
        statusMessage.className = 'message-box';

        try {
            const response = await fetch(`http://localhost:5000/api/products/${productID}`, {
                method: 'GET',
                credentials: 'include',
            });

            if (response.status === 401 || response.status === 403) {
                // Sessão expirada ou não autorizado
                alert('Sessão expirada ou acesso negado. Redirecionando para o login.');
                window.location.href = '../../login.html';
                return;
            }
            
            if (!response.ok) {
                throw new Error('Falha ao buscar detalhes do produto.');
            }

            const product = await response.json();

            // 🌟 PREENCHER O FORMULÁRIO
            nameInput.value = product.name;
            descriptionInput.value = product.description || '';
            // Formata o preço para o padrão brasileiro (vírgula)
            priceInput.value = parseFloat(product.price).toFixed(2).replace('.', ','); 

            // 🌟 TRATAMENTO DE IMAGENS ATUAIS
            currentImagesContainer.innerHTML = ''; // Limpa o container

            if (product.image_urls && product.image_urls.length > 0) {
                product.image_urls.forEach(imageUrl => {
                    const imgUrl = `http://localhost:5000/${imageUrl}`;
                    const imgElement = document.createElement('img');
                    imgElement.src = imgUrl;
                    imgElement.alt = product.name;
                    imgElement.className = 'product-image-preview';

                    const imageWrapper = document.createElement('div');
                    imageWrapper.className = 'current-image-container'; // Usa o CSS de container
                    imageWrapper.appendChild(imgElement);
                    
                    // Nota: A lógica de exclusão de imagens é complexa e requer uma nova rota no backend (não incluída aqui), 
                    // mas é aqui que você adicionaria um botão de exclusão.

                    currentImagesContainer.appendChild(imageWrapper);
                });
            } else {
                // Caso não haja imagens, exibe o placeholder
                currentImagesContainer.innerHTML = `
                    <div class="current-image-container">
                        <img src="${placeholderPath}" alt="Sem imagem" class="product-image-preview">
                    </div>
                `;
            }

            // 🌟 VERIFICAR PERMISSÃO DE EDIÇÃO
            if (!product.isOwner) {
                // Se não for o dono, desabilita o formulário
                form.querySelectorAll('input, textarea, button').forEach(el => el.disabled = true);
                statusMessage.textContent = 'Você só pode visualizar este produto. A edição está desabilitada.';
                statusMessage.className = 'message-box error';
            } else {
                statusMessage.textContent = '';
                statusMessage.className = '';
            }

        } catch (error) {
            console.error('Erro ao buscar detalhes do produto:', error);
            statusMessage.textContent = 'Erro ao carregar detalhes do produto.';
            statusMessage.className = 'message-box error';
        }
    };


    // ===============================================
    // 4. FUNÇÃO PARA LIDAR COM A SUBMISSÃO DE EDIÇÃO (APENAS DADOS DE TEXTO)
    // ===============================================
    const handleEditSubmit = async (event) => {
        event.preventDefault();
        
        // Validação básica (mesmo que os inputs sejam required)
        if (!nameInput.value || !priceInput.value) {
            alert('Nome e Preço são obrigatórios!');
            return;
        }

        statusMessage.textContent = 'Salvando alterações...';
        statusMessage.className = 'message-box';

        // Coleta dos dados
        const name = nameInput.value;
        const description = descriptionInput ? descriptionInput.value : '';
        const price = parseFloat(priceInput.value.replace(',', '.'));
        
        // 🌟 Usamos FormData APENAS para enviar dados de texto na rota PUT/PATCH
        // O Multer tem um middleware chamado `upload.none()` que leria FormData sem arquivos
        // Mas a forma mais simples e robusta para dados de texto é JSON puro, 
        // já que a rota PUT do backend ainda não foi ajustada para Multer.none().
        // *************************************************************************
        // ** Manteremos o envio como JSON puro para a rota PUT/products/:id atual **
        // *************************************************************************
        const updateData = {
            name: name,
            description: description,
            price: price.toFixed(2)
        };


        try {
            const response = await fetch(`http://localhost:5000/api/products/${productID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json', // Importante para enviar JSON
                },
                body: JSON.stringify(updateData),
                credentials: 'include',
            });

            const data = await response.json().catch(() => ({ message: 'Resposta não JSON' }));
            
            // 4. Tratamento da resposta
            if (response.ok) {
                alert('Produto atualizado com sucesso!');
                statusMessage.textContent = 'Produto atualizado com sucesso! Redirecionando...';
                statusMessage.className = 'message-box success';
                
                // Redireciona
                setTimeout(() => {
                    window.location.href = 'listagem_produtos.html';
                }, 1500);
            } else if (response.status === 401 || response.status === 403) {
                alert('Sessão expirada ou acesso negado. Redirecionando para o login.');
                window.location.href = '../../login.html';
            } else {
                console.error('Erro no backend:', data);
                statusMessage.textContent = `Erro ao salvar: ${data.message || 'Erro desconhecido.'}`;
                statusMessage.className = 'message-box error';
            }

        } catch (error) {
            console.error('Erro na requisição de atualização:', error);
            statusMessage.textContent = 'Erro ao conectar com o servidor. Verifique sua conexão e o console.';
            statusMessage.className = 'message-box error';
        }
    };


    // 5. Adiciona o Listener e Inicia o Carregamento
    if (form) {
        form.addEventListener('submit', handleEditSubmit);
        fetchProductDetails();
    }
});