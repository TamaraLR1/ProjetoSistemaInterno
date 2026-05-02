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

    const firstNameError = document.getElementById('firstName-error');
    const lastNameError = document.getElementById('lastName-error');

    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/jfif'];

    // 2. Carregar Perfil usando a URL dinâmica
    const loadProfile = async () => {
        try {
            const res = await fetch(`${API_URL}/user/info`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                firstNameInput.value = data.user.firstName || '';
                lastNameInput.value = data.user.lastName || '';
                emailInput.value = data.user.email || '';
                
                if (data.user.avatar_url) {
                    // Busca a foto no local correto (Local ou Produção)
                    avatarPreview.src = `${IMG_BASE_URL}/${data.user.avatar_url}?t=${Date.now()}`;
                } else {
                    avatarPreview.src = "../../assets/usuario.png";
                }
            }
        } catch (err) {
            console.error("Erro ao carregar perfil:", err);
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
        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            alert(`O arquivo "${file.name}" não é permitido. Use JPG, PNG, WEBP ou JFIF.`);
            avatarInput.value = '';
            return;
        }

        if (file.size > MAX_SIZE_BYTES) {
            alert(`O arquivo "${file.name}" é muito grande. O limite é de 5MB.`);
            avatarInput.value = '';
            return;
        }

        avatarPreview.src = URL.createObjectURL(file);
    });

    // 3. Atualizar Perfil usando a URL dinâmica
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        let hasError = false;
        firstNameError.style.display = 'none';
        lastNameError.style.display = 'none';
        firstNameInput.style.borderColor = '';
        lastNameInput.style.borderColor = '';

        if (firstNameInput.value.trim() === '') {
            firstNameError.style.display = 'block';
            firstNameInput.style.borderColor = 'red';
            hasError = true;
        }

        if (lastNameInput.value.trim() === '') {
            lastNameError.style.display = 'block';
            lastNameInput.style.borderColor = 'red';
            hasError = true;
        }

        if (hasError) return;

        const formData = new FormData();
        formData.append('firstName', firstNameInput.value.trim());
        formData.append('lastName', lastNameInput.value.trim());
        
        if (avatarInput.files[0]) {
            formData.append('avatar', avatarInput.files[0]);
        }

        try {
            // Fetch para a URL de produção se não for localhost
            const response = await fetch(`${API_URL}/user/update`, {
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
            alert('Erro de conexão com o servidor.');
        }
    });

    cancelBtn.addEventListener('click', () => { loadProfile(); toggleMode(false); });
    loadProfile();
});