document.addEventListener("DOMContentLoaded", () => {
    const formRegister = document.getElementById("form-register");
    const formVerify = document.getElementById("form-verify");

    // Email capturado na fase 1 para ser reutilizado na fase 2
    let registeredEmail = "";

    // -------------------------------------------------------
    // Fase 1: Preenchimento do formulário de cadastro
    // -------------------------------------------------------
    if (formRegister) {
        formRegister.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = document.getElementById("name").value.trim().replace(/\s+/g, ' ');
            const email = document.getElementById("email").value.trim();
            const passwordOne = document.getElementById("passwordOne").value.trim().replace(/\s+/g, ' ');
            const passwordTwo = document.getElementById("passwordTwo").value.trim().replace(/\s+/g, ' ');
            const birth = document.getElementById("birth").value;

            // Validações no front antes de bater na API
            if (!name || !email || !passwordOne || !passwordTwo || !birth) {
                showToast("Por favor, preencha todos os campos.", "error");
                return;
            }

            if (name.length > 100) {
                showToast("O nome deve ter no máximo 100 caracteres.", "error");
                return;
            }

            if (passwordOne.length < 8 || passwordOne.length > 64) {
                showToast("A senha deve ter entre 8 e 64 caracteres.", "error");
                return;
            }

            if (passwordOne !== passwordTwo) {
                showToast("As senhas digitadas não coincidem.", "error");
                return;
            }

            try {
                const response = await fetch("/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, passwordOne, passwordTwo, birth })
                });

                const data = await response.json();

                if (response.ok) {
                    // Guarda o email para a fase 2 e faz a transição dos forms
                    registeredEmail = email;
                    showToast(data.message, "success");
                    formRegister.classList.add("hidden");
                    formVerify.classList.remove("hidden");
                } else {
                    showToast(data.error || "Erro ao criar conta.", "error");
                }
            } catch (error) {
                console.error("Erro na requisição:", error);
                showToast("Falha na comunicação com o servidor.", "error");
            }
        });
    }

    // -------------------------------------------------------
    // Fase 2: Verificação do código OTP
    // -------------------------------------------------------
    if (formVerify && formVerify.dataset.context === "register") {
        formVerify.addEventListener("submit", async (e) => {
            e.preventDefault();

            const token = document.getElementById("token-verify").value.trim().toUpperCase();

            if (!token) {
                showToast("Por favor, insira o código de verificação.", "error");
                return;
            }

            try {
                const response = await fetch("/register/verify-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: registeredEmail, token })
                });

                const data = await response.json();

                if (response.ok) {
                    showToast("Email verificado! Redirecionando para o login...", "success");
                    setTimeout(() => {
                        window.location.href = data.redirect;
                    }, 1500);
                } else {
                    showToast(data.error || "Código inválido. Tente novamente.", "error");
                }
            } catch (error) {
                console.error("Erro na requisição:", error);
                showToast("Falha na comunicação com o servidor.", "error");
            }
        });
    }
});
