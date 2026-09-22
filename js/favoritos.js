/* ==========================================================================
   favoritos.js — guarda anuncios favoritos en localStorage y actualiza
   los botones de corazón y el contador. No decide qué tarjetas se
   muestran: eso lo hace index.js, que combina favoritos con los demás
   filtros. EC.favoritos.iniciar() se puede volver a llamar después de
   renderizar tarjetas de forma dinámica.
   ========================================================================== */

window.EC = window.EC || {};

(function (EC) {
  var STORAGE_KEY = 'ec_favoritos';

  function obtenerFavoritos() {
    try {
      var datos = localStorage.getItem(STORAGE_KEY);
      return datos ? JSON.parse(datos) : [];
    } catch (error) {
      return [];
    }
  }

  function guardarFavoritos(favoritos) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritos));
    } catch (error) {
      /* localStorage no disponible (p. ej. modo privado) */
    }
  }

  function esFavorito(id, favoritos) {
    return (favoritos || obtenerFavoritos()).indexOf(id) !== -1;
  }

  function alternarFavorito(id) {
    var favoritos = obtenerFavoritos();
    var indice = favoritos.indexOf(id);
    if (indice === -1) {
      favoritos.push(id);
    } else {
      favoritos.splice(indice, 1);
    }
    guardarFavoritos(favoritos);
    return favoritos;
  }

  function actualizarBoton(boton, activo) {
    boton.setAttribute('aria-pressed', String(activo));
    boton.classList.toggle('favorito-btn--activo', activo);

    var icono = boton.querySelector('.favorito-btn__icono');
    if (icono) {
      icono.textContent = activo ? '♥' : '♡';
    }

    var texto = boton.querySelector('.favorito-btn__texto');
    if (texto) {
      texto.textContent = activo ? 'Guardado en favoritos' : 'Guardar en favoritos';
    } else {
      boton.setAttribute('aria-label', activo ? 'Quitar de favoritos' : 'Guardar en favoritos');
    }
  }

  function actualizarContador(favoritos) {
    var contador = document.getElementById('favoritos-contador');
    if (!contador) return;
    var n = favoritos.length;
    contador.textContent = n === 1 ? '1 anuncio guardado' : n + ' anuncios guardados';
  }

  function iniciar() {
    var favoritos = obtenerFavoritos();
    var botones = document.querySelectorAll('.favorito-btn');

    botones.forEach(function (boton) {
      var id = boton.getAttribute('data-id');

      var clon = boton.cloneNode(true);
      boton.parentNode.replaceChild(clon, boton);
      boton = clon;

      actualizarBoton(boton, esFavorito(id, favoritos));

      boton.addEventListener('click', function (evento) {
        evento.preventDefault();
        evento.stopPropagation();

        var nuevosFavoritos = alternarFavorito(id);
        actualizarBoton(boton, esFavorito(id, nuevosFavoritos));
        actualizarContador(nuevosFavoritos);

        if (typeof EC.favoritos.alCambiar === 'function') {
          EC.favoritos.alCambiar();
        }
      });
    });

    actualizarContador(favoritos);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  EC.favoritos = {
    iniciar: iniciar,
    esFavorito: esFavorito,
    obtenerFavoritos: obtenerFavoritos,
    alCambiar: null
  };
})(window.EC);
