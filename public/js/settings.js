document.addEventListener("DOMContentLoaded", () => {
    //1. Lógica para vincular Telegram
    const btnGenerateTelegram = document.getElementById("btn-generate-telegram");

    if (btnGenerateTelegram) {
        btnGenerateTelegram.addEventListener("click", async (e) => {
            e.preventDefault();

            try {
                const response = await fetch("/app/settings/generate-telegram-token", {
                    method: "POST",
                });

                if (response.ok) {
                    const data = await response.json();
                    showToast(data.message, "success");
                } else {
                    const errorData = await response.json();
                    showToast(errorData.error || "Ocorreu um erro desconhecido.", "error");
                }
            } catch (error) {
                console.error("Erro na requisição:", error);
            }
        });
    }

    //2. Lógica para desvincular o Telegram
    const btnRevokeTelegram = document.getElementById("btn-revoke-telegram");

    if (btnRevokeTelegram) {
        btnRevokeTelegram.addEventListener("action-confirmed", async (e) => {
            e.preventDefault();

            try {
                const response = await fetch("/app/settings/revoke-telegram", {
                    method: "POST",
                });

                if (response.ok) {
                    const data = await response.json();
                    showToast(data.message, "success");
                    window.location.href = "/app/settings";
                } else {
                    const errorData = await response.json();
                    showToast(errorData.error || "Ocorreu um erro desconhecido.", "error");
                }
            } catch (error) {
                console.error("Erro na requisição:", error);
            }
        });
    }

    // 3. Lógica de Navegação por Abas (Tabs)
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove 'active' de todos
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            // Adiciona 'active' no alvo clicado
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // 4. Lógica de Submissão Segura de Senha via Fetch
    const passwordForm = document.getElementById('form-change-password');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evita que a página recarregue

            const formData = new FormData(passwordForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/users/change-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                if (response.ok) {
                    showToast('Senha atualizada com sucesso!', 'success');
                    passwordForm.reset();
                } else {
                    showToast(result.error || 'Erro ao atualizar senha.', 'error');
                }
            } catch (err) {
                showToast('Falha na comunicação com o servidor.', 'error');
            }
        });
    }

    // 5. Lógica de Atualização de Preferências de Notificação
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
            chip.className = "chip sobrepor";
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

            try {
                const response = await fetch("/app/settings/update-notification-schedule", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ cronValues })
                });

                const data = await response.json();

                if (response.ok) {
                    showToast(data.message, "success");
                } else {
                    showToast("Erro ao salvar", "error");
                }
            } catch (error) {
                showToast("Erro de conexão com o servidor.", "error");
            }
        });
    }

    // 6. Lógica das configurações de Canais de Notificação
    const formChannels = document.getElementById('form-notification-channels');

    if (formChannels) {
        formChannels.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Pega todos os checkboxes marcados com o nome 'channels'
            const checkedBoxes = formChannels.querySelectorAll('input[name="channels"]:checked');
            
            // Regra 1 (Front-end): Pelo menos um canal
            if (checkedBoxes.length === 0) {
                showToast('Você deve manter ao menos um canal de notificação ativo!', 'error');
                return;
            }

            // Constrói o array de strings (ex: ['email', 'telegram'] ou ['email'])
            const selectedChannels = Array.from(checkedBoxes).map(cb => cb.value);

            try {
                const response = await fetch('/dashboard/settings/channels', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ channels: selectedChannels })
                });

                const result = await response.json();

                if (!response.ok) {
                    showToast(result.error || 'Erro ao salvar configurações.', 'error');
                    return;
                }

                showToast('Canais de notificação atualizados com sucesso!', 'success');
            } catch (error) {
                console.error('Erro na requisição:', error);
                showToast('Ocorreu um erro ao comunicar com o servidor.', 'error');
            }
        });
    }
});