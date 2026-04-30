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

document.addEventListener('DOMContentLoaded', () => {
    const toastOverlay = document.getElementById('confirmation-toast');
    const btnCancel = document.getElementById('toast-btn-cancel');
    const btnConfirm = document.getElementById('toast-btn-confirm');
    
    // Variável de estado para guardar o botão/formulário que originou o clique
    let pendingAction = null;

    // 1. Ouvinte Global para botões de perigo
    document.addEventListener('click', function(e) {
        const dangerBtn = e.target.closest('.danger-btn');
        
        // Ignora se não for botão de perigo ou se for o próprio botão "Sim" do Toast
        if (!dangerBtn || dangerBtn.id === 'toast-btn-confirm') return;
        
        e.preventDefault();

        // Salva o elemento original na memória
        pendingAction = dangerBtn;

        // Mostra o Toast na tela
        toastOverlay.classList.remove('hidden');
    });

    // 2. Ação de Cancelar (Fechar o Toast)
    btnCancel.addEventListener('click', () => {
        toastOverlay.classList.add('hidden');
        pendingAction = null; // Limpa a memória
    });

    // 3. Ação de Confirmar (Executar a ação salva)
    btnConfirm.addEventListener('click', () => {
        if (!pendingAction) return;

        toastOverlay.classList.add('hidden');

        const parentForm = pendingAction.closest('form');
        
        if (parentForm) {
            parentForm.requestSubmit(); 
        } else if (pendingAction.tagName.toLowerCase() === 'a') {
            // Se era um link, força a navegação
            window.location.href = pendingAction.href;
        } else {
            // disparamos um evento customizado para ouvir em outras partes do código
            const confirmedEvent = new CustomEvent('action-confirmed', { bubbles: true });
            pendingAction.dispatchEvent(confirmedEvent);
        }

        // Limpa a memória
        pendingAction = null;
    });
});