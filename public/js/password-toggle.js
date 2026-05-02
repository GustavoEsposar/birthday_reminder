document.addEventListener("DOMContentLoaded", () => {
    const toggleButtons = document.querySelectorAll(".toggle-password");

    toggleButtons.forEach(button => {
        button.addEventListener("click", function() {
            // Encontra o input de senha relativo a este botão
            const passwordInput = this.parentElement.querySelector("input");
            const icon = this.querySelector(".material-symbols-outlined");

            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                icon.textContent = "visibility";
            } else {
                passwordInput.type = "password";
                icon.textContent = "visibility_off";
            }
        });
    });
});
