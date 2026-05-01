document.addEventListener("DOMContentLoaded", () => {
    const formRegister = document.getElementById("form-register");

    if (formRegister) {
        formRegister.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const passwordOne = document.getElementById("passwordOne").value;
            const passwordTwo = document.getElementById("passwordTwo").value;
            const birth = document.getElementById("birth").value;

            // Validações no front antes de bater na API
            if (!name || !email || !passwordOne || !passwordTwo || !birth) {
                showToast("Por favor, preencha todos os campos.", "error");
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
                    showToast("Conta criada com sucesso! Redirecionando...", "success");
                    setTimeout(() => {
                        window.location.href = data.redirect;
                    }, 1500);
                } else {
                    showToast(data.error || "Erro ao criar conta.", "error");
                }
            } catch (error) {
                console.error("Erro na requisição:", error);
                showToast("Falha na comunicação com o servidor.", "error");
            }
        });
    }
});
