document.addEventListener("DOMContentLoaded", () => {
    const formNotifications = document.getElementById("form-notifications");
    
    if (formNotifications) {
        const container = document.getElementById("intervals-container");
        const input = document.getElementById("new-interval-input");
        const btnAdd = document.getElementById("btn-add-interval");
        const errorMsg = document.getElementById("interval-error-msg");

        const showError = (msg) => {
            errorMsg.textContent = msg;
            errorMsg.style.display = "block";
        };

        const getCurrentIntervals = () => {
            const chips = container.querySelectorAll(".chip");
            return Array.from(chips).map(chip => chip.getAttribute("data-value"));
        };

        // NOVO: Limpa a borda vermelha e a mensagem de erro quando o usuário digita
        input.addEventListener("input", () => {
            input.classList.remove("input-error");
            errorMsg.style.display = "none";
        });

        btnAdd.addEventListener("click", () => {
            const value = parseInt(input.value);
            const currentIntervals = getCurrentIntervals();

            // Validações básicas
            if (isNaN(value)) {
                input.classList.add("input-error");
                return showError("Digite um número válido.");
            }
            if (value < 1 || value > 180) {
                input.classList.add("input-error");
                return showError("O intervalo deve ser entre 1 e 180 dias.");
            }

            // REGRA DE NEGÓCIO REVISADA: Impede duplicatas e pinta a borda
            if (currentIntervals.includes(value.toString())) {
                input.classList.add("input-error"); // <-- Borda fica vermelha aqui
                return showError("Este intervalo já foi adicionado.");
            }

            if (currentIntervals.length >= 10) {
                return showError("Você atingiu o limite máximo de 10 intervalos.");
            }

            // Se passou por tudo, cria o chip
            const chip = document.createElement("div");
            chip.className = "chip";
            chip.setAttribute("data-value", value.toString());
            chip.innerHTML = `
                <span>${value} dia(s) antes</span>
                <button type="button" class="remove-chip" aria-label="Remover">✖</button>
            `;
            
            container.appendChild(chip);
            input.value = ""; 
            input.focus(); // Devolve o cursor para o usuário adicionar outro rapidamente
        });

        // Delegação para remover os chips
        container.addEventListener("click", (e) => {
            if (e.target.classList.contains("remove-chip")) {
                const chip = e.target.closest(".chip");
                if (chip.getAttribute("data-value") !== "0") chip.remove();
            }
        });

        // Envio do formulário
        formNotifications.addEventListener("submit", async (e) => {
            e.preventDefault();
            let cronValues = getCurrentIntervals();
            if (!cronValues.includes("0")) cronValues.push("0");

            // ... seu código de fetch(PATCH) aqui ...
        });
    }
});