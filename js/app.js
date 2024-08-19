function iniciarApp() {

    const resultado = document.querySelector('#resultado') // este es el elemento del HTML donde vamos a insertar el contenido, ya sea de favs o de consulta de la API

    const selectCategorias = document.querySelector('#categorias')
    if (selectCategorias) { // este if es xk en la pag de favoritos no está y da error
        selectCategorias.addEventListener('change', seleccionarCategoria)
        obtenerCategorias()
    }

    // PARA LA PAGINA de FAVORITOS
    const favoritosDiv = document.querySelector('.favoritos')
    if (favoritosDiv) {
        obtenerFavoritos()
    }

    //Instacia de una nueva modal de bootsrap. se hace así:;
    const modal = new bootstrap.Modal('#modal', {}) //esto viene del js de bootsrap. le decimos con qué info queremos que se monte la modal y le pasamos un objeto vacío en princiopoi

    function obtenerCategorias() {
        fetch('https://www.themealdb.com/api/json/v1/1/categories.php')
            .then(res => res.json())
            .then(data => mostrarCategorias(data.categories))
            .catch(error => {
                console.log(error)
            })
    }


    function mostrarCategorias(categorias = []) { // le decimos que las categorías son un array por defecto

        categorias.forEach(categoria => {
            const option = document.createElement('OPTION')//nos crea un option por cada cateforía para luego meter en select
            option.value = categoria.strCategory // le damos el valor a cada option con cada categoría
            option.textContent = categoria.strCategory

            selectCategorias.appendChild(option) //con esto agregamos las diferentes opciones al select

        })
    }

    function seleccionarCategoria(e) {
        const categoriaSeleccionada = e.target.value
        fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoriaSeleccionada}`)
            .then(res => res.json())
            .then(data => mostrarRecetas(data.meals))
            .catch(error => console.log(error))
    }

    function mostrarRecetas(recetas = []) {

        limpiarHTML(resultado)//primero limpiamos

        //montamos este heading por si no hay resultados
        const heading = document.createElement('H2')
        heading.classList.add('text-center', 'text-black', 'my-5')
        heading.textContent = recetas.length ? 'Resultados' : 'No hay resultados'
        resultado.appendChild(heading)

        recetas.forEach(receta => {

            const { idMeal, strMeal, strMealThumb } = receta // destructuramos receta

            //MONTAMOS TODO EL SCRIPTIN DE LO QUE VAMOS A QUERER POR CARA UNA DE LAS RECETAS
            const recetaContenedor = document.createElement('DIV') // creamos un contenedor para cada receta
            recetaContenedor.classList.add('col-md-4')

            const recetaCard = document.createElement('DIV')
            recetaCard.classList.add('card', 'mb-4')

            const recetaImg = document.createElement('IMG') // creamos una etiqueta para la imagen
            recetaImg.classList.add('card-img-top') // le agregamos las clases de boostrap
            recetaImg.alt = `Imagen de la receta ${strMeal}` // le agregmaos texto alternativo con el nombre de la receta
            recetaImg.src = strMealThumb ?? receta.img // le damos el src de la receta con srtMealThumb que es el enlace a la imagen. el receta.img es en caso de que sea para la pagina de favporitois y es consulta a localstorage no a la API

            const recetaCardBody = document.createElement('DIV')
            recetaCardBody.classList.add('card-body')

            const recetaHeading = document.createElement('H3')
            recetaHeading.classList.add('card-title', 'mb-3')
            recetaHeading.textContent = strMeal ?? receta.title //igual receta.title es para la pag de favoritos que se consulta al localstorage y no a la API

            const recetaBtn = document.createElement('BUTTON')
            recetaBtn.classList.add('btn', 'btn-danger', 'w-100')
            recetaBtn.textContent = 'Ver receta'

            recetaBtn.onclick = () => seleccionarReceta(idMeal ?? receta.id) //receta.id para los favoritos del localstorage no de la API

            // HACEMOS QUE SE RENDERICE EL SCRIPT EN EL HTML
            recetaCardBody.appendChild(recetaHeading)
            recetaCardBody.appendChild(recetaBtn)

            recetaCard.appendChild(recetaImg)
            recetaCard.appendChild(recetaCardBody)

            recetaContenedor.appendChild(recetaCard)


            resultado.appendChild(recetaContenedor)


        })
    }

    function seleccionarReceta(id) {
        fetch(`https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`)
            .then(res => res.json())
            .then(data => mostrarRecetaModal(data.meals[0]))
            .catch(error => console.log(error))
    }

    function mostrarRecetaModal(receta) {

        const { idMeal, strInstructions, strMeal, strMealThumb } = receta

        // AÑADIR CONTENIDO AL MODAL
        const modalTitle = document.querySelector('.modal .modal-title')
        modalTitle.textContent = strMeal

        const modalBody = document.querySelector('.modal .modal-body')
        modalBody.innerHTML = `
            <img class="img-fluid" src="${strMealThumb}" alt="receta ${strMeal}"/>
            <h3 class="my-3">Instrucciones</h3>
            <p>${strInstructions}</p>
            <h3 class="my-3">Ingredientes</h3>
        `
        //Vamos a mostrar los ingredientes y cantidades mapeandolos
        const listGroup = document.createElement('UL') // creamos una lista ordenada
        listGroup.classList.add('list-group')

        // recorremos los ingredientes (hay 20max)
        for (let i = 1; i < 20; i++) {

            if (receta[`strIngredient${i}`]) { //revisamos si existe el ingrediente o está en blanco en cada vuelta
                const ingrediente = receta[`strIngredient${i}`]
                const cantidad = receta[`strMeasure${i}`]

                const ingredienteLi = document.createElement('LI')
                ingredienteLi.classList.add('list-group-item')
                ingredienteLi.textContent = `${ingrediente} - ${cantidad}`

                listGroup.appendChild(ingredienteLi)
            }
        }

        //agregamos el listado de ingredeintes al body de la modal
        modalBody.appendChild(listGroup)


        // BOTONES DE CERRAR Y FAVORITO
        const modalFooter = document.querySelector('.modal-footer') // seleccionamos donde los vamos a poner
        limpiarHTML(modalFooter) //lo limpiamos antes de nada, ya que de lo contrario se van añadiendo hijos con el appendchild cada vez que se abre la modal

        const btnFav = document.createElement('BUTTON')
        if (existeIdEnFav(idMeal)) {
            btnFav.classList.add('btn', 'btn-danger', 'col')
            btnFav.textContent = 'Eliminar de favorito'
        } else {
            btnFav.classList.add('btn', 'btn-success', 'col')
            btnFav.textContent = 'Guardar en favorito'
        }


        modalFooter.appendChild(btnFav)


        const btnCerrar = document.createElement('BUTTON')
        btnCerrar.classList.add('btn', 'btn-dark', 'col')
        btnCerrar.textContent = 'Cerrar'
        btnCerrar.onclick = () => modal.hide()
        modalFooter.appendChild(btnCerrar)

        // ALMACENAR FAVORITOS EN LOCALSTORAGE
        btnFav.onclick = () => {
            if (existeIdEnFav(idMeal)) { //si existiese ya en favoritos con el return evitamos que se vuelta a agregar
                eliminarFavorito(idMeal)
                mostrarToast('Receta eliminada correcctamente')
                btnFav.textContent = 'Guardar en favorito'
                btnFav.classList.add('btn', 'btn-success', 'col')
                return
            }
            agregarFavorito({
                id: idMeal,
                title: strMeal,
                img: strMealThumb
            })
            mostrarToast('Receta agregada correcctamente')

            btnFav.textContent = 'Eliminar de favorito'
            btnFav.classList.add('btn', 'btn-danger', 'col')
        }

        //MOSTRAMOS LA MODAL 
        modal.show() //llamamos a la instacia de modal que hicmos al inicio del codigo y empleamos el metodo show que está en es clase
    }

    function agregarFavorito(recetaFav) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [] //llamamos al array favoritos de localstorage y si no existe, lo creamos
        localStorage.setItem('favoritos', JSON.stringify([...favoritos, recetaFav])) // añadmios el favorito creando una copia del que hay y agregando la receta fav
    }
    // comprobamos si existe ya en fav
    function existeIdEnFav(id) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [] // nos traemos el array de favoritos de localstorage
        return favoritos.some(favorito => favorito.id === id) //retorna true or false en función de si el id ya existía en el array de favoritos
    }

    function eliminarFavorito(id) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [] // nos traemos el array de favoritos de localstorage
        const nuevosFavoritos = favoritos.filter(favorito => favorito.id != id)
        localStorage.setItem('favoritos', JSON.stringify(nuevosFavoritos))
    }

    function mostrarToast(mensaje) {
        const toastDiv = document.querySelector('#toast')
        const toastBody = document.querySelector('.toast-body')
        const toast = new bootstrap.Toast(toastDiv)
        toastBody.textContent = mensaje

        toast.show()
    }

    function obtenerFavoritos() {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [] // nos traemos el array de favoritos de localstorage
        if (favoritos.length) {

            mostrarRecetas(favoritos)
        } else {
            const noHayFavoritos = document.createElement('P')
            noHayFavoritos.classList.add('fs-4', 'text-center', 'font-bold', 'mt-5')
            noHayFavoritos.textContent = "Todavía no tienes favoritos"
        }

    }

    function limpiarHTML(selector) {
        while (selector.firstChild) {
            selector.removeChild(selector.firstChild)
        }
    }
}

document.addEventListener('DOMContentLoaded', iniciarApp)
