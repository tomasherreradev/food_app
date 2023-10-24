function iniciarApp() {
    const resultado = document.querySelector('#resultado');


    const selectCategorias = document.querySelector('#categorias');
    if(selectCategorias) {
        selectCategorias.addEventListener('change', seleccionarCategoria);
        obtenerCategorias();
    }

    const favoritosDiv = document.querySelector('.favoritos');
    if(favoritosDiv) {
        obtenerFavoritos();
    }

    const modal = new bootstrap.Modal('#modal', {});


    function obtenerCategorias() {
        const url = `https://www.themealdb.com/api/json/v1/1/categories.php`;
        fetch(url)
            .then(respuesta => respuesta.json())
            .then(categorias => mostrarCategorias(categorias.categories))
    }


    function mostrarCategorias(categorias = []) {
        categorias.forEach(categoria => {
            const option = document.createElement('OPTION');
            option.value = categoria.strCategory;
            option.textContent = categoria.strCategory;

            selectCategorias.appendChild(option);
        })
    }


    function seleccionarCategoria(e) {
        const categoria = e.target.value;
        const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`;
        fetch(url)
            .then(respuesta => respuesta.json())
            .then(resultado => mostrarRecetas(resultado.meals)) 
    }



    function mostrarRecetas(recetas = []) {
        limpiarHTML(resultado);

        const heading = document.createElement('H2');
        heading.classList.add('text-center', 'text-black', 'my-5');
        heading.textContent = recetas.length ? 'Resultados:' : 'No hat resultados.';
        resultado.appendChild(heading);
    

        //iterar los resultados
        recetas.forEach(receta => {
            const {idMeal, strMeal, strMealThumb} = receta;

            const recetaContainer = document.createElement('DIV');
            recetaContainer.classList.add('col-md-4');

            const recetaCard = document.createElement('DIV');
            recetaCard.classList.add('card', 'mb-4');

            const recetaImg = document.createElement('IMG');
            recetaImg.classList.add('card-img-top');
            recetaImg.alt = `Imagen de la receta ${strMeal ?? receta.titulo}`;
            recetaImg.src = strMealThumb ?? receta.img;

            const recetaBody = document.createElement('DIV');
            recetaBody.classList.add('card-body');

            const recetaHead = document.createElement('H3');
            recetaHead.classList.add('card-title', 'mb-3');
            recetaHead.textContent = strMeal ?? receta.titulo;

            const recetaBtn = document.createElement('BUTTON');
            recetaBtn.classList.add('btn', 'btn-danger', 'w-100');
            recetaBtn.textContent = 'Ver receta';
            recetaBtn.dataset.bsTarget = '#modal';
            recetaBtn.dataset.bsToggle = 'modal';
            recetaBtn.onclick = function() {
                seleccionarReceta(idMeal ?? receta.id)
            }

            //inyectar en el dom
            recetaBody.appendChild(recetaHead);
            recetaBody.appendChild(recetaBtn);

            recetaCard.appendChild(recetaImg);
            recetaCard.appendChild(recetaBody);

            recetaContainer.appendChild(recetaCard);

            resultado.appendChild(recetaContainer);
        })
    }



    function seleccionarReceta(id) {
        const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
        fetch(url)
            .then(respuesta => respuesta.json())
            .then(resultado => mostrarRecetaModal(resultado.meals[0]));
    }



    function mostrarRecetaModal(receta) {
        const {idMeal, strInstructions, strMeal, strMealThumb} = receta;

        const modalTittle = document.querySelector('.modal .modal-title');
        const modalBody = document.querySelector('.modal .modal-body');
        modalTittle.textContent = strMeal;
        modalBody.innerHTML = `
            <img class="img-fluid" src="${strMealThumb}" alt="receta ${strMeal}" />
            <h3 class="my-3">Instrucciones </h3>
            <p>${strInstructions}</p>
            <h3 class="my-3">Ingredientes y sus cantidades</h3>
        `;

        const listGroup = document.createElement('UL');
        listGroup.classList.add('list-group')
        //iterar cantidades e ingredientes
        for(let i = 1; i<=20; i++) {
            if(receta[`strIngredient${i}`]) {
                const ingrediente = receta[`strIngredient${i}`];
                const cantidad = receta[`strMeasure${i}`];

                const ingredienteLi = document.createElement('LI');
                ingredienteLi.classList.add('list-group-item');
                ingredienteLi.textContent = `${ingrediente} - ${cantidad}`;

                listGroup.appendChild(ingredienteLi);
            }
        }

        const btnFav = document.createElement('BUTTON');
        btnFav.classList.add('btn', 'btn-danger', 'col');
        btnFav.textContent = existeStorage(idMeal) ? 'Eliminar favorito' : 'Guardar favorito';

        //localStorage
        btnFav.onclick = function() {

            if(existeStorage(idMeal)) {
                eliminarFavorito(idMeal);
                btnFav.textContent = 'Guardar favorito';
                mostrarToast('Eliminado correctamente');

                if(favoritosDiv) {
                    obtenerFavoritos();
                    modal.hide();
                }

                return;
            }

            agregarFavorito({
                id: idMeal,
                titulo: strMeal,
                img: strMealThumb
            })
            btnFav.textContent = 'Eliminar favorito';
            mostrarToast('Agregado correctamente');
        }

        const btnCerrarModal = document.createElement('BUTTON');
        btnCerrarModal.classList.add('btn', 'btn-secondary', 'col');
        btnCerrarModal.textContent = 'Cerrar';
        btnCerrarModal.onclick = function() {
            modal.hide();
        }

        const modalFooter = document.querySelector('.modal-footer');
        limpiarHTML(modalFooter);
        modalFooter.appendChild(btnFav);
        modalFooter.appendChild(btnCerrarModal);

        modalBody.appendChild(listGroup);
        //muestra el modal
        modal.show();


    }



    function agregarFavorito(obj) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        localStorage.setItem('favoritos', JSON.stringify([...favoritos, obj]));
        
    }

    function eliminarFavorito(id){
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        const nuevosFavoritos = favoritos.filter( favorito => favorito.id !== id);
        localStorage.setItem('favoritos', JSON.stringify(nuevosFavoritos));
    }

    function existeStorage(id) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        return favoritos.some ( favorito => favorito.id === id);
    }



    function mostrarToast(mensaje) {
        const toastDiv = document.querySelector('#toast');
        const toastBody = document.querySelector('.toast-body');

        const toast = new bootstrap.Toast(toastDiv);
        toastBody.textContent = mensaje;

        toast.show();
    }



    function obtenerFavoritos() {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        if(favoritos.length) {
            mostrarRecetas(favoritos)

            return;
        }

        const ceroFavoritos = document.createElement('P');
        ceroFavoritos.textContent = 'No hay favoritos';
        ceroFavoritos.classList.add('fs-4', 'text-center', 'font-bold', 'mt-5');
        
        favoritosDiv.appendChild(ceroFavoritos);
    }


    function limpiarHTML(ref) {
        while(ref.firstChild){
            ref.removeChild(ref.firstChild);
        }
    }

}

document.addEventListener('DOMContentLoaded', iniciarApp);