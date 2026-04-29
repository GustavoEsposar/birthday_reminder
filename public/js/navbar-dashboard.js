// Lógica para mostrar/ocultar o menu dropdown
document.getElementById("menu-icon")
    .addEventListener("click", function () {
        const menu = document.getElementById(
            "menu-options",
        );

        if (menu.classList.contains("menu-hidde")) {
            menu.classList.remove("menu-hidde");
            menu.classList.add("menu-show");
        } else {
            menu.classList.remove("menu-show");
            menu.classList.add("menu-hidde");
        }
    });