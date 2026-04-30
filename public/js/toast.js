function showToast(message, type = 'success') {
    // Verifica se o container já existe, se não, cria ele dinamicamente
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Cria o aviso
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    // Adiciona na tela
    container.appendChild(toast);

    // Remove após 3 segundos
    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}