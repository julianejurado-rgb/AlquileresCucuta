/* ==========================================================================
   favoritos.js — favoritos del usuario con sesión iniciada (se guardan en
   el servidor, antes era una sola lista en el localStorage del navegador).
   Actualiza los botones de corazón y el contador. Sin sesión, el corazón
   lleva a iniciar sesión y la barra "Ver solo mis favoritos" se oculta.
   No decide qué tarjetas se muestran: eso lo hace index.js.
   EC.favoritos.iniciar() se puede volver a llamar después de renderizar
   tarjetas de forma dinámica.
   ========================================================================== */

window.EC = window.EC || {};

(function (EC) {
  var favoritos = [];      // ids (números) de los anuncios guardados
  var hayUsuario = false;
  var promesaCarga = null;

  function cargar() {
    if (!promesaCarga) {
      promesaCarga = EC.datos.obtenerUsuarioActual()
        .then(function (usuario) {
          hayUsuario = !!usuario;
          return usuario ? EC.datos.obtenerFavoritos() : [];
        })
        .then(function (ids) {
          favoritos = ids || [];
        })
        .catch(function () {
          favoritos = [];
        });
    }
    return promesaCarga;
  }

  function esFavorito(id) {
    return favoritos.indexOf(Number(id)) !== -1;
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

  function actualizarContador() {
    var contador = document.getElementById('favoritos-contador');
    if (!contador) return;
    var n = favoritos.length;
    contador.textContent = n === 1 ? '1 anuncio guardado' : n + ' anuncios guardados';
  }

  async function alternar(id, boton) {
    var activo = esFavorito(id);
    boton.disabled = true;
    try {
      if (activo) {
        await EC.datos.quitarFavorito(id);
        favoritos = favoritos.filter(function (favorito) { return favorito !== id; });
      } else {
        await EC.datos.agregarFavorito(id);
        favoritos.push(id);
      }
      actualizarBoton(boton, !activo);
      actualizarContador();

      if (typeof EC.favoritos.alCambiar === 'function') {
        EC.favoritos.alCambiar();
      }
    } catch (error) {
      if (error.status === 401) {
        window.location.href = 'acceder.html';
        return;
      }
      window.alert(error.message);
    } finally {
      boton.disabled = false;
    }
  }

  async function iniciar() {
    await cargar();

    var barra = document.querySelector('.favoritos-bar');
    if (barra) barra.hidden = !hayUsuario;

    document.querySelectorAll('.favorito-btn').forEach(function (boton) {
      var id = Number(boton.getAttribute('data-id'));

      var clon = boton.cloneNode(true);
      boton.parentNode.replaceChild(clon, boton);
      boton = clon;

      actualizarBoton(boton, esFavorito(id));

      boton.addEventListener('click', function (evento) {
        evento.preventDefault();
        evento.stopPropagation();

        if (!hayUsuario) {
          window.location.href = 'acceder.html';
          return;
        }
        alternar(id, boton);
      });
    });

    actualizarContador();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  EC.favoritos = {
    iniciar: iniciar,
    esFavorito: esFavorito,
    alCambiar: null
  };
})(window.EC);
