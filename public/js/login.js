document.addEventListener("DOMContentLoaded", () => {
    const formLogin = document.getElementById("form-login");
    const formVerify = document.getElementById("form-verify");
    const emailDisplay = document.getElementById("email-display");

    // Email capturado na fase 1 para ser reutilizado na fase 2
    let loginEmail = "";

    // -------------------------------------------------------
    // Fase 1: Tentativa de login
    // -------------------------------------------------------
    if (formLogin) {
        formLogin.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim().replace(/\s+/g, ' ');

            if (!email || !password) {
                showToast("Por favor, preencha todos os campos.", "error");
                return;
            }

            if (password.length < 8 || password.length > 64) {
                showToast("A senha deve ter entre 8 e 64 caracteres.", "error");
                return;
            }

            try {
                const response = await fetch("/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Login bem-sucedido — redireciona
                    window.location.href = data.redirect;

                } else if (response.status === 403 && data.requiresVerification) {
                    // Conta não verificada: guarda email, popula hint e exibe form de verificação
                    loginEmail = email;
                    if (emailDisplay) emailDisplay.textContent = email;

                    showToast(data.message, "error");
                    formLogin.classList.add("hidden");
                    formVerify.classList.remove("hidden");

                } else {
                    showToast(data.error || "Credenciais inválidas.", "error");
                }
            } catch (error) {
                console.error("Erro na requisição:", error);
                showToast("Falha na comunicação com o servidor.", "error");
            }
        });
    }

    // -------------------------------------------------------
    // Fase 2: Verificação do código OTP (fluxo vindo do login)
    // -------------------------------------------------------
    if (formVerify && formVerify.dataset.context === "login") {
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
                    body: JSON.stringify({ email: loginEmail, token })
                });

                const data = await response.json();

                if (response.ok) {
                    showToast("Conta verificada com sucesso! Faça seu login.", "success");
                    // Reexibe o form de login para que o usuário logue normalmente
                    setTimeout(() => {
                        formVerify.classList.add("hidden");
                        formLogin.classList.remove("hidden");
                        document.getElementById("email").value = loginEmail;
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
