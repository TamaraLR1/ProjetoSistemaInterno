document.addEventListener('DOMContentLoaded', () => {


    // Seleção de Elementos
    const form = document.getElementById('product-register-form');
    const nameInput = document.getElementById('product-name');
    const descriptionInput = document.getElementById('product-description');
    const priceInput = document.getElementById('product-price');
    const stockInput = document.getElementById('product-stock');
    const imagesInput = document.getElementById('product-images');
    const categorySelect = document.getElementById('product-category');

    // --- FUNÇÃO PARA CARREGAR CATEGORIAS NO SELECT ---
    async function carregarCategorias() {
        if (!categorySelect) return;

        try {
            // URL dinâmica para buscar categorias
            const response = await fetch(`${API_URL}/categories`);
            if (!response.ok) throw new Error('Falha ao buscar categorias');
            
            const categorias = await response.json();

            categorySelect.innerHTML = '<option value="">Selecione uma categoria...</option>';
            categorias.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                categorySelect.appendChild(option);
            });
        } catch (error) {
            console.error("Erro ao carregar categorias:", error);
        }
    }

    carregarCategorias();

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault(); 
            
            const name = nameInput.value.trim();
            const description = descriptionInput ? descriptionInput.value.trim() : '';
            const priceRaw = priceInput.value.replace(',', '.');
            const stockRaw = stockInput ? stockInput.value.trim() : '0';
            const category_id = categorySelect ? categorySelect.value : '';

            if (!name || !priceRaw) {
                alert("Por favor, preencha o nome e o preço do produto.");
                return;
            }

            if (!category_id) {
                alert("Por favor, selecione uma categoria para o produto.");
                return;
            }

            const price = parseFloat(priceRaw);
            if (isNaN(price)) {
                alert("Por favor, insira um preço válido.");
                return;
            }

            const stock_quantity = parseInt(stockRaw);
            if (isNaN(stock_quantity) || stock_quantity < 0) {
                alert("Por favor, insira uma quantidade de estoque válida (mínimo 0).");
                return;
            }

            const files = imagesInput.files;
            if (files.length === 0) {
                 alert("É obrigatório selecionar pelo menos uma imagem para o produto.");
                 return;
            }

            const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
            const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/jfif'];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!ALLOWED_TYPES.includes(file.type)) {
                    alert(`O arquivo "${file.name}" não é permitido. Use apenas JPG, PNG, WEBP ou JFIF.`);
                    return;
                }
                if (file.size > MAX_SIZE_BYTES) {
                    alert(`O arquivo "${file.name}" é muito grande. O limite máximo é de 5MB.`);
                    return;
                }
            }

            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            formData.append('price', price.toFixed(2));
            formData.append('stock_quantity', stock_quantity); 
            formData.append('category_id', category_id);

            for (let i = 0; i < files.length; i++) {
                formData.append('product-images', files[i]);
            }

            try {
                // URL dinâmica para cadastrar produto
                const response = await fetch(`${API_URL}/products`, {
                    method: 'POST',
                    body: formData, 
                    credentials: 'include',
                });

                const data = await response.json().catch(() => ({ message: 'Erro ao processar resposta do servidor.' })); 
                
                if (response.ok) { 
                    alert('Produto cadastrado com sucesso!');
                    form.reset(); 
                } else if (response.status === 401 || response.status === 403) {
                    alert('Sessão expirada. Por favor, faça login novamente.');
                    window.location.href = '../login.html';
                } else {
                    alert(`Erro ao cadastrar: ${data.message || 'Ocorreu um problema no servidor.'}`);
                }

            } catch (error) {
                console.error('Erro de conexão:', error);
                alert('Não foi possível conectar ao servidor. Verifique se o backend está rodando corretamente.');
            }
        });
    }
});