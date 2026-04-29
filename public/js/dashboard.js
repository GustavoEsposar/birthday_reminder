document.addEventListener("DOMContentLoaded", () => {
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