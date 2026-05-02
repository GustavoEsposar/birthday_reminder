document.addEventListener("DOMContentLoaded", () => {
    const formRecovery = document.getElementById("form-recovery");
    const formToken = document.getElementById("form-token");
    const emailInput = document.getElementById("email");

    if (formRecovery) {
        formRecovery.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            if (!email) {
                showToast("Por favor, digite seu e-mail.", "error");
                return;
            }

            try {
                // Primeira Fase: Pedir para gerar o token
                const response = await fetch("/login/generate-recovery-token", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (response.ok) {
                    showToast(data.message, "success");
                    // Transição visual
                    formRecovery.classList.add("hidden");
                    formToken.classList.remove("hidden");
                } else {
                    showToast(data.error || "Ocorreu um erro ao gerar o token.", "error");
                }
            } catch (error) {
                console.error("Erro na requisição:", error);
                showToast("Falha na comunicação com o servidor.", "error");
            }
        });
    }

    if (formToken) {
        formToken.addEventListener("submit", async (e) => {
            e.preventDefault();

            const token = document.getElementById("token").value.trim().toUpperCase();
            const password = document.getElementById("password").value.trim().replace(/\s+/g, ' ');
            const passwordConfirm = document.getElementById("passwordConfirm").value.trim().replace(/\s+/g, ' ');

            // Validação local
            if (!token || !password || !passwordConfirm) {
                showToast("Por favor, preencha todos os campos.", "error");
                return;
            }

            if (password.length < 8 || password.length > 64) {
                showToast("A senha deve ter entre 8 e 64 caracteres.", "error");
                return;
            }

            if (password !== passwordConfirm) {
                showToast("As senhas digitadas não coincidem.", "error");
                return;
            }

            // O e-mail usado no primeiro form deve ser reenviado
            const email = emailInput.value.trim();

            try {
                // Segunda Fase: Validar token e trocar a senha
                const response = await fetch("/login/recovery", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, token, password, passwordConfirm })
                });

                const data = await response.json();

                if (response.ok) {
                    showToast(data.message, "success");
                    // Aguarda 2 segundos para o usuário ler a mensagem
                    setTimeout(() => {
                        window.location.href = "/login";
                    }, 2000);
                } else {
                    showToast(data.error || "Token inválido.", "error");
                }
            } catch (error) {
                console.error("Erro na requisição:", error);
                showToast("Falha na comunicação com o servidor.", "error");
            }
        });
    }
});
