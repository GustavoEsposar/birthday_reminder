
document.getElementById('show-form').addEventListener('click', function() {
    const formContainer = document.getElementById('birthdate-form-container');
    const button = document.getElementById('show-form');
    if (formContainer.classList.contains('hidden')) {
        formContainer.classList.remove('hidden');
        formContainer.classList.add('visible');
        button.innerHTML = "✘";
    } else {
        formContainer.classList.remove('visible');
        formContainer.classList.add('hidden');
        button.innerHTML = "+";
    }
});

document.getElementById('menu-options').addEventListener('click', function() {
    const menu = document.getElementById('menu-options');

    if(menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        formContainer.classList.add('menu-visible');
    } else {
        menu.classList.remove('menu-visible');
        formContainer.classList.add('hidden');
    }
});
