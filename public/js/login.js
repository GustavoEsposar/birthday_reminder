document.addEventListener("DOMContentLoaded", () => {
    const formLogin = document.getElementById("form-login");

    if (formLogin) {
        formLogin.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            if (!email || !password) {
                showToast("Por favor, preencha todos os campos.", "error");
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
                    // Backend retorna o redirect path após criar a sessão
                    window.location.href = data.redirect;
                } else {
                    showToast(data.error || "Credenciais inválidas.", "error");
                }
            } catch (error) {
                console.error("Erro na requisição:", error);
                showToast("Falha na comunicação com o servidor.", "error");
            }
        });
    }
});
