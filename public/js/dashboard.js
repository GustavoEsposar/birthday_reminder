document.addEventListener("DOMContentLoaded", () => {
    // Lógica de aprovação/rejeição de pendentes
    const pendentesWrapper = document.querySelector('.pendentes-wrapper');

    function injectPessoaCard(birthdate) {
        const template = document.getElementById('card-pessoa-template');
        if (!template) return;
        const clone = template.content.cloneNode(true);

        let displayDate = birthdate.date;
        if (typeof birthdate.date === 'string' && birthdate.date.includes('T')) {
            const d = new Date(birthdate.date);
            const day = String(d.getUTCDate()).padStart(2, '0');
            const month = String(d.getUTCMonth() + 1).padStart(2, '0');
            const year = d.getUTCFullYear();
            displayDate = `${day}/${month}/${year}`;
        }

        const cardDiv = clone.querySelector('.pessoa');
        clone.querySelector('.card-name').textContent = birthdate.name;
        clone.querySelector('.card-date').textContent = displayDate;
        cardDiv.setAttribute('data-name', birthdate.name);
        cardDiv.setAttribute('data-age', new Date(birthdate.date).getTime());
        const d = new Date(birthdate.date);
        const calValue = String(d.getUTCMonth() + 1).padStart(2, '0') + String(d.getUTCDate()).padStart(2, '0');
        cardDiv.setAttribute('data-calendar', calValue);
        clone.querySelector('input[name="birthdateId"]').value = birthdate._id;

        const form = document.getElementById('inline-add-form');
        form.parentNode.insertBefore(clone, form.nextElementSibling);
    }

    if (pendentesWrapper) {
        pendentesWrapper.addEventListener('click', async function (e) {
            const approveBtn = e.target.closest('.approve-btn');
            const rejectBtn = e.target.closest('.reject-btn');
            if (!approveBtn && !rejectBtn) return;

            const pendingId = (approveBtn || rejectBtn).dataset.pendingId;
            const action = approveBtn ? 'approve' : 'reject';
            const card = pendentesWrapper.querySelector(`.pessoa-pendente[data-pending-id="${pendingId}"]`);

            try {
                const response = await fetch(`/app/invite/${action}/${pendingId}`, { method: 'POST' });
                const result = await response.json();

                if (response.ok) {
                    showToast(result.message, 'success');
                    card?.remove();

                    if (action === 'approve' && result.birthdate) {
                        injectPessoaCard(result.birthdate);
                    }

                    const remaining = pendentesWrapper.querySelectorAll('.pessoa-pendente');
                    if (remaining.length === 0) pendentesWrapper.remove();
                } else {
                    showToast(result.error || 'Erro', 'error');
                }
            } catch {
                showToast('Erro de comunicação com o servidor', 'error');
            }
        });
    }

    // Lógica para deletar aniversarios
    // Captura o container pai que guarda todos os cards -> isso garante que novos cards também funcionarao
    const containerPessoas = document.querySelector('.pessoas');

    containerPessoas.addEventListener('submit', async function (e) {
        // Verifica se o submit veio de um formulário com a classe 'delete-form'
        if (e.target && e.target.classList.contains('delete-form')) {
            e.preventDefault();

            // O e.target é o formulário específico que foi clicado
            const form = e.target;
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/app/delete-birthdate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    showToast(result.message, "success");

                    // Remove o card da tela pelo elemento pai mais próximo que tenha a classe '.pessoa'
                    const cardToRemove = form.closest('.pessoa');
                    if (cardToRemove) {
                        cardToRemove.remove();
                    }
                } else {
                    showToast(result.error || "Erro ao deletar", "error");
                }
            } catch (error) {
                showToast("Erro de comunicação com o servidor", "error");
            }
        }
    });

    // Lógica para o formulário de adição inline (dentro do dashboard)
    document.getElementById('inline-add-form').addEventListener('submit', async function (e) {
        e.preventDefault();

        const nameInput = document.getElementById("new-name");
        const name = nameInput.value.trim().replace(/\s+/g, ' ');
        const birthdate = document.getElementById("new-birthdate").value;

        if (!name || !birthdate) {
            showToast("Por favor, preencha todos os campos.", "error");
            return;
        }

        if (name.length > 100) {
            showToast("o nome deve ter no máximo 100 caracteres.", "error");
            return;
        }

        const data = { name, birthdate };

        try {
            const response = await fetch('/app/add-birthdate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                showToast(result.message, "success");

                // 1. Formatação da data para exibição (DD/MM/AAAA)
                let displayDate = data.birthdate;
                if (data.birthdate.includes('-')) {
                    const [ano, mes, dia] = data.birthdate.split('-');
                    displayDate = `${dia}/${mes}/${ano}`;
                }

                // 2. Localiza o Template
                const template = document.getElementById('card-pessoa-template');
                const clone = template.content.cloneNode(true);

                // 3. Preenche os dados no clone (usando as classes que sugerimos no template)
                const cardDiv = clone.querySelector('.pessoa');
                clone.querySelector('.card-name').textContent = data.name;
                clone.querySelector('.card-date').textContent = displayDate;

                // 4. Configura os atributos de ordenação/pesquisa (data-attributes)
                cardDiv.setAttribute('data-name', data.name);
                cardDiv.setAttribute('data-age', new Date(data.birthdate).getTime());
                cardDiv.setAttribute('data-calendar', data.birthdate.slice(5).replace('-', ''));

                // 5. Configura o Formulário de Delete do novo card
                clone.querySelector('input[name="birthdateId"]').value = result.birthdate._id;

                // 6. Insere o card na tela (antes do primeiro irmão)
                this.parentNode.insertBefore(clone, this.nextElementSibling);

                // 7. Reseta e esconde o formulário
                this.reset();
                this.classList.add('hidden');
                document.getElementById("show-form").innerHTML = "+";

            } else {
                showToast(result.error || "Erro ao adicionar", "error");
            }
        } catch (error) {
            showToast("Erro de comunicação com o servidor", "error");
        }
    });

    // Lógica para mostrar/ocultar o card form inline
    document.getElementById("show-form").addEventListener("click", function (e) {
        e.preventDefault();

        const formCard = document.getElementById("inline-add-form");
        const button = document.getElementById("show-form");
        const nameInput = document.getElementById("new-name");

        // Toggle de visibilidade usando classList
        if (formCard.classList.contains("hidden")) {
            formCard.classList.remove("hidden"); // Mostra o card
            button.innerHTML = "✘";

            // UX Avançada: Coloca o cursor de digitação direto no campo de nome
            setTimeout(() => nameInput.focus(), 50);
        } else {
            formCard.classList.add("hidden"); // Oculta o card
            button.innerHTML = "+";
        }
    });

    // Lógica para o botão interno de "Cancelar" fechar o card e limpar os dados
    document.getElementById("cancel-add").addEventListener("click", function () {
        const formCard = document.getElementById("inline-add-form");
        const button = document.getElementById("show-form");

        formCard.classList.add("hidden");
        button.innerHTML = "+";
        formCard.reset(); // Limpa o que o usuário havia digitado caso tenha desistido
    });

    //lógica de ordenação das divs de aniversários
    // Variáveis de estado fora do evento para manter a "memória" entre os cliques
    let currentSortType = "";
    let isAscending = true;

    document.getElementById("sort-btn").addEventListener("click", function () {
        const sortType = document.getElementById("sort-select").value;
        const container = document.querySelector(".pessoas");
        const elements = Array.from(container.querySelectorAll(".pessoa:not(#inline-add-form)"));
        const btn = document.getElementById("sort-btn");

        // Lógica de alternância (Toggle)
        if (sortType === currentSortType) {
            isAscending = !isAscending;
        } else {
            isAscending = true;
            currentSortType = sortType;
        }

        // Ordenação
        elements.sort((a, b) => {
            let comparison = 0;

            if (sortType === "name") {
                const nameA = a.getAttribute("data-name").toLowerCase();
                const nameB = b.getAttribute("data-name").toLowerCase();
                comparison = nameA.localeCompare(nameB);

            } else if (sortType === "age") {
                // Ordena pelo timestamp completo (quem nasceu antes vem primeiro)
                const ageA = parseInt(a.getAttribute("data-age"));
                const ageB = parseInt(b.getAttribute("data-age"));
                comparison = ageA - ageB;

            } else if (sortType === "calendar") {
                // Ordena apenas por Mês e Dia (formato MMDD)
                const calA = parseInt(a.getAttribute("data-calendar"));
                const calB = parseInt(b.getAttribute("data-calendar"));
                comparison = calA - calB;
            }

            // Retorna a comparação normal (crescente) ou invertida (decrescente)
            return isAscending ? comparison : (comparison * -1);
        });

        // Reanexa os elementos na nova ordem
        elements.forEach((el) => container.appendChild(el));
    });

    // Lógica da Barra de Pesquisa (Filtro em tempo real)
    document.getElementById("search-input").addEventListener("input", function (e) {
        // Pega o que foi digitado, remove espaços extras e converte para minúsculas
        const searchTerm = e.target.value.trim().toLowerCase();

        // Pega todas as divs de pessoas
        const pessoas = document.querySelectorAll(".pessoa:not(#inline-add-form)");

        pessoas.forEach((pessoa) => {
            // Lê o nome que salvamos no data-attribute
            const name = pessoa.getAttribute("data-name").toLowerCase();

            // Verifica se o nome digitado está contido no nome da pessoa
            if (name.includes(searchTerm)) {
                // Se encontrar o texto, remove a classe hidden
                pessoa.classList.remove("hidden");
            } else {
                // Se não encontrar, oculta a div
                pessoa.classList.add("hidden");
            }
        });
    });
});