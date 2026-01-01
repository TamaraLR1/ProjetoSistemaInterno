document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profile-form');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    
    // Elementos de Erro
    const firstNameError = document.getElementById('firstName-error');
    const lastNameError = document.getElementById('lastName-error');

    // Botões
    const editBtn = document.getElementById('edit-profile-btn');
    const saveBtn = document.getElementById('save-profile-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');

    // Carregar dados iniciais
    const loadData = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/user/info', { credentials: 'include' });
            const data = await response.json();
            if (response.ok) {
                firstNameInput.value = data.user.firstName;
                lastNameInput.value = data.user.lastName;
                emailInput.value = data.user.email;
            }
        } catch (err) { console.error("Erro ao carregar:", err); }
    };

    const toggleMode = (isEditing) => {
        firstNameInput.disabled = !isEditing;
        lastNameInput.disabled = !isEditing;
        
        editBtn.style.display = isEditing ? 'none' : 'inline-block';
        saveBtn.style.display = isEditing ? 'inline-block' : 'none';
        cancelBtn.style.display = isEditing ? 'inline-block' : 'none';

        if (!isEditing) {
            // Limpa erros ao cancelar
            firstNameInput.classList.remove('input-error');
            lastNameInput.classList.remove('input-error');
            firstNameError.style.display = 'none';
            lastNameError.style.display = 'none';
        }
    };

    editBtn.addEventListener('click', () => toggleMode(true));
    cancelBtn.addEventListener('click', () => {
        loadData();
        toggleMode(false);
    });

    // Validar enquanto digita (UX Dinâmica)
    const validateField = (input, errorElement) => {
        if (input.value.trim() === "") {
            input.classList.add('input-error');
            errorElement.style.display = 'block';
            return false;
        } else {
            input.classList.remove('input-error');
            errorElement.style.display = 'none';
            return true;
        }
    };

    firstNameInput.addEventListener('input', () => validateField(firstNameInput, firstNameError));
    lastNameInput.addEventListener('input', () => validateField(lastNameInput, lastNameError));

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const isNameValid = validateField(firstNameInput, firstNameError);
        const isLastNameValid = validateField(lastNameInput, lastNameError);

        if (!isNameValid || isLastNameValid === false) return;

        try {
            const response = await fetch('http://localhost:5000/api/user/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: firstNameInput.value.trim(),
                    lastName: lastNameInput.value.trim(),
                    email: emailInput.value
                }),
                credentials: 'include'
            });

            if (response.ok) {
                alert('Perfil atualizado!');
                toggleMode(false);
                location.reload();
            }
        } catch (err) { alert("Erro na conexão."); }
    });

    loadData();
});