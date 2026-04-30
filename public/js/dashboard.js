document.addEventListener("DOMContentLoaded", () => {
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

        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());

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
                this.style.display = 'none';
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

        // Toggle de visibilidade usando o estilo inline
        if (formCard.style.display === "none") {
            formCard.style.display = "flex"; // Mostra o card
            button.innerHTML = "✘";

            // UX Avançada: Coloca o cursor de digitação direto no campo de nome
            setTimeout(() => nameInput.focus(), 50);
        } else {
            formCard.style.display = "none"; // Oculta o card
            button.innerHTML = "+";
        }
    });

    // Lógica para o botão interno de "Cancelar" fechar o card e limpar os dados
    document.getElementById("cancel-add").addEventListener("click", function () {
        const formCard = document.getElementById("inline-add-form");
        const button = document.getElementById("show-form");

        formCard.style.display = "none";
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
        // Pega o que foi digitado e converte para minúsculas (insensitive case)
        const searchTerm = e.target.value.toLowerCase();

        // Pega todas as divs de pessoas
        const pessoas = document.querySelectorAll(".pessoa:not(#inline-add-form)");

        pessoas.forEach((pessoa) => {
            // Lê o nome que salvamos no data-attribute
            const name = pessoa.getAttribute("data-name").toLowerCase();

            // Verifica se o nome digitado está contido no nome da pessoa
            if (name.includes(searchTerm)) {
                // Se encontrar o texto, remove qualquer 'display: none' para mostrar a div
                pessoa.style.display = "";
            } else {
                // Se não encontrar, oculta a div
                pessoa.style.display = "none";
            }
        });
    });
});