const API_URL = 'http://localhost:5000/api/categories';

const categoryForm = document.getElementById('category-form');
const categoryTbody = document.getElementById('category-tbody');
const categoryIdInput = document.getElementById('category-id');
const categoryNameInput = document.getElementById('category-name');
const formTitle = document.getElementById('form-title');
const btnCancel = document.getElementById('btn-cancel');
const searchInput = document.getElementById('search-input');

let allCategories = []; // Cache local para busca rápida

// --- FUNÇÕES DE BUSCA (READ) ---

async function fetchCategories() {
    try {
        const response = await fetch(API_URL);
        allCategories = await response.json();
        renderTable(allCategories);
    } catch (error) {
        console.error("Erro ao buscar categorias:", error);
    }
}

function renderTable(data) {
    categoryTbody.innerHTML = '';
    data.forEach(cat => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cat.id}</td>
            <td>${cat.name}</td>
            <td><code>${cat.slug}</code></td>
            <td>
                <button class="btn-edit" onclick="prepareEdit(${cat.id}, '${cat.name}')">Editar</button>
                <button class="btn-delete" onclick="deleteCategory(${cat.id})">Excluir</button>
            </td>
        `;
        categoryTbody.appendChild(tr);
    });
}

// Filtro de busca em tempo real
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allCategories.filter(cat => 
        cat.name.toLowerCase().includes(term)
    );
    renderTable(filtered);
});

// --- FUNÇÕES DE CRIAÇÃO E EDIÇÃO (POST/PUT) ---

categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = categoryIdInput.value;
    const name = categoryNameInput.value;
    
    const isEdit = id !== "";
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${API_URL}/${id}` : API_URL;

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        if (response.ok) {
            alert(isEdit ? "Categoria atualizada com sucesso!" : "Categoria cadastrada!");
            resetForm();
            fetchCategories();
        } else {
            const err = await response.json();
            alert("Erro: " + err.message);
        }
    } catch (error) {
        alert("Erro na requisição.");
    }
});

// Preenche o form para editar
window.prepareEdit = (id, name) => {
    formTitle.innerText = "Editando Categoria: " + name;
    categoryIdInput.value = id;
    categoryNameInput.value = name;
    btnCancel.style.display = "inline-block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- FUNÇÃO DE EXCLUSÃO (DELETE) ---

window.deleteCategory = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria? Os produtos vinculados podem ficar sem categoria.")) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.ok) {
            fetchCategories();
        } else {
            const err = await response.json();
            alert(err.message);
        }
    } catch (error) {
        alert("Erro ao excluir.");
    }
};

function resetForm() {
    formTitle.innerText = "Cadastrar Nova Categoria";
    categoryIdInput.value = "";
    categoryForm.reset();
    btnCancel.style.display = "none";
}

btnCancel.addEventListener('click', resetForm);

// Inicialização
fetchCategories();