document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profile-form');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const avatarInput = document.getElementById('avatar-input');
    const avatarPreview = document.getElementById('avatar-preview');
    const btnChangePhoto = document.getElementById('btn-change-photo');
    
    const editBtn = document.getElementById('edit-profile-btn');
    const saveBtn = document.getElementById('save-profile-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');

    // Seleção das mensagens de erro do HTML
    const firstNameError = document.getElementById('firstName-error');
    const lastNameError = document.getElementById('lastName-error');

    const loadProfile = async () => {
        const res = await fetch('http://localhost:5000/api/user/info', { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            firstNameInput.value = data.user.firstName || '';
            lastNameInput.value = data.user.lastName || '';
            emailInput.value = data.user.email || '';
            if (data.user.avatar_url) {
                avatarPreview.src = `http://localhost:5000/uploads/${data.user.avatar_url}?t=${Date.now()}`;
            } else {
                avatarPreview.src = "../../assets/usuario.png";
            }
        }
    };

    const toggleMode = (isEditing) => {
        firstNameInput.disabled = !isEditing;
        lastNameInput.disabled = !isEditing;
        btnChangePhoto.style.display = isEditing ? 'block' : 'none';
        editBtn.style.display = isEditing ? 'none' : 'inline-block';
        saveBtn.style.display = isEditing ? 'inline-block' : 'none';
        cancelBtn.style.display = isEditing ? 'inline-block' : 'none';

        if (!isEditing) {
            // Limpa erros visuais ao cancelar
            firstNameInput.style.borderColor = '';
            lastNameInput.style.borderColor = '';
            firstNameError.style.display = 'none';
            lastNameError.style.display = 'none';
        }
    };

    editBtn.addEventListener('click', () => toggleMode(true));
    btnChangePhoto.addEventListener('click', () => avatarInput.click());

    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) avatarPreview.src = URL.createObjectURL(file);
    });

    // --- LÓGICA DE VALIDAÇÃO E SUBMIT ---
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Resetar estados de erro antes de validar
        let hasError = false;
        firstNameError.style.display = 'none';
        lastNameError.style.display = 'none';
        firstNameInput.style.borderColor = '';
        lastNameInput.style.borderColor = '';

        // 2. Validar Nome
        if (firstNameInput.value.trim() === '') {
            firstNameError.style.display = 'block';
            firstNameInput.style.borderColor = 'red';
            hasError = true;
        }

        // 3. Validar Sobrenome
        if (lastNameInput.value.trim() === '') {
            lastNameError.style.display = 'block';
            lastNameInput.style.borderColor = 'red';
            hasError = true;
        }

        // 4. Se houver erro, para a execução aqui
        if (hasError) return;

        // 5. Se não houver erro, prossegue com o FormData
        const formData = new FormData();
        formData.append('firstName', firstNameInput.value.trim());
        formData.append('lastName', lastNameInput.value.trim());
        
        if (avatarInput.files[0]) {
            formData.append('avatar', avatarInput.files[0]);
        }

        try {
            const response = await fetch('http://localhost:5000/api/user/update', {
                method: 'PUT',
                body: formData,
                credentials: 'include'
            });

            if (response.ok) {
                alert('Perfil atualizado com sucesso!');
                location.reload();
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Erro ao atualizar');
            }
        } catch (err) {
            console.error(err);
            alert('Erro de conexão.');
        }
    });

    cancelBtn.addEventListener('click', () => { loadProfile(); toggleMode(false); });
    loadProfile();
});