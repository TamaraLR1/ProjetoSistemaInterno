document.addEventListener('DOMContentLoaded', () => {

    const productSelect = document.getElementById('product-select');
    const form = document.getElementById('stock-movement-form');
    const historyBody = document.getElementById('history-body');

    // 2. Carregar produtos do vendedor para o Select
    const loadProducts = async () => {
        try {
            // Usando a URL dinâmica
            const response = await fetch(`${API_URL}/products`, { credentials: 'include' });
            const products = await response.json();
            
            productSelect.innerHTML = '<option value="">Selecione um produto...</option>';
            
            products.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = `${p.name} (Atual: ${p.stock_quantity})`;
                productSelect.appendChild(option);
            });
        } catch (err) { 
            console.error("Erro ao carregar produtos", err); 
        }
    };

    // 3. Carregar o Histórico de Movimentações
    const loadHistory = async () => {
        try {
            // Usando a URL dinâmica
            const response = await fetch(`${API_URL}/inventory/history`, { credentials: 'include' });
            const history = await response.json();

            if (!historyBody) return;
            historyBody.innerHTML = '';

            if (!history || history.length === 0) {
                historyBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhuma movimentação encontrada.</td></tr>';
                return;
            }

            history.forEach(move => {
                const date = new Date(move.created_at).toLocaleString('pt-BR');
                const typeClass = move.movement_type === 'IN' ? 'type-in' : 'type-out';
                const typeLabel = move.movement_type === 'IN' ? 'Entrada' : 'Saída';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${date}</td>
                    <td><strong>${move.product_name}</strong></td>
                    <td><span class="type-badge ${typeClass}">${typeLabel}</span></td>
                    <td>${move.quantity}</td>
                    <td>${move.reason || '-'}</td>
                `;
                historyBody.appendChild(row);
            });
        } catch (err) {
            console.error("Erro ao carregar histórico", err);
            historyBody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center;">Erro ao carregar histórico.</td></tr>';
        }
    };

    // 4. Registrar Movimentação
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            product_id: productSelect.value,
            movement_type: document.getElementById('movement-type').value,
            quantity: document.getElementById('quantity').value,
            reason: document.getElementById('reason').value
        };

        try {
            // Usando a URL dinâmica
            const response = await fetch(`${API_URL}/inventory/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            if (response.ok) {
                alert('Estoque atualizado!');
                form.reset(); 
                
                await loadProducts();
                await loadHistory();
            } else {
                const err = await response.json();
                alert(err.message || 'Erro ao processar movimentação.');
            }
        } catch (err) { 
            console.error("Erro na requisição", err); 
            alert('Falha na comunicação com o servidor.');
        }
    });

    // Inicialização da página
    loadProducts();
    loadHistory();
});