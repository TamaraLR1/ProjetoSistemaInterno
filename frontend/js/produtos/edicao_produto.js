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
    const currentImage = document.getElementById('current-image');
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
    // 3. FUNÇÃO PARA CARREGAR OS DADOS ATUAIS (GET)
    // ===============================================
    const fetchProductDetails = async () => {
        statusMessage.textContent = 'Carregando detalhes do produto...';
        statusMessage.className = 'message-box';
        form.style.display = 'none';

        try {
            // Requisição GET para o endpoint com ID
            const response = await fetch(`http://localhost:5000/api/products/${productID}`, {
                method: 'GET',
                credentials: 'include',
            });

            if (response.status === 401 || response.status === 403) {
                alert('Sessão expirada ou acesso negado. Redirecionando para o login.');
                window.location.href = '../../login.html'; 
                return;
            }

            if (!response.ok) {
                const data = await response.json().catch(() => ({ message: `Erro HTTP: ${response.status}` }));
                throw new Error(data.message || 'Erro ao carregar produto.');
            }

            const product = await response.json();
            
            // Preenche o formulário
            nameInput.value = product.name || '';
            descriptionInput.value = product.description || '';
            // Formata o preço com 2 casas decimais
            priceInput.value = parseFloat(product.price).toFixed(2); 

            // Exibe a imagem atual
            const imageUrl = product.image_url ? `http://localhost:5000/${product.image_url}` : placeholderPath;
            currentImage.src = imageUrl;
            
            statusMessage.textContent = 'Detalhes carregados com sucesso. Pronto para editar.';
            statusMessage.className = 'message-box success';
            form.style.display = 'block'; // Mostra o formulário
            
        } catch (error) {
            console.error('Erro ao carregar detalhes do produto:', error);
            statusMessage.textContent = `Erro: ${error.message}`;
            statusMessage.className = 'message-box error';
        }
    };
    
    // ===============================================
    // 4. FUNÇÃO PARA ENVIAR AS ALTERAÇÕES (PUT)
    // ===============================================
    const handleEditSubmit = async (event) => {
        event.preventDefault();
        
        statusMessage.textContent = 'Salvando alterações...';
        statusMessage.className = 'message-box';
        
        // 1. Cria o objeto FormData para enviar texto e o arquivo (imagem)
        const formData = new FormData();
        formData.append('name', nameInput.value);
        formData.append('description', descriptionInput.value);
        formData.append('price', priceInput.value);
        
        // 2. Adiciona o arquivo SOMENTE se o usuário o tiver selecionado
        if (imagesInput.files && imagesInput.files.length > 0) {
            // O nome do campo aqui ('product-images') DEVE CORRESPONDER ao que está no product.routes.ts
            formData.append('product-images', imagesInput.files[0]);
        }
        
        try {
            // 3. Usa o método PUT para a rota de atualização
            const response = await fetch(`http://localhost:5000/api/products/${productID}`, {
                method: 'PUT',
                // Não defina Content-Type; o FormData cuida disso, incluindo o boundary
                body: formData, 
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