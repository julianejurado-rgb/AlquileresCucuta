/* ==========================================================================
   index.js — renderiza el listado de anuncios (index.html). Los filtros
   (palabra clave, ciudad, precio máximo, tipo, género permitido, mascotas,
   amoblado, "ver solo mis favoritos") y el orden se envían a la API, que
   hace la búsqueda en la base de datos. Debe cargarse después de datos.js
   y favoritos.js.
   ========================================================================== */

(function (EC) {
  var TEMPORIZADOR_BUSQUEDA = null;
  var numeroBusqueda = 0;

  function crearTarjeta(anuncio) {
    var li = document.createElement('li');

    var articulo = document.createElement('article');
    articulo.className = 'anuncio';
    articulo.setAttribute('data-id', anuncio.id);

    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'favorito-btn';
    boton.setAttribute('data-id', anuncio.id);
    boton.setAttribute('aria-pressed', 'false');
    boton.setAttribute('aria-label', 'Guardar en favoritos');
    boton.innerHTML = '<span class="favorito-btn__icono" aria-hidden="true">&#9825;</span>';
    articulo.appendChild(boton);

    var figura = document.createElement('figure');
    figura.className = 'anuncio__foto';
    var fotos = EC.util.obtenerFotos(anuncio);
    if (fotos.length > 0) {
      var img = document.createElement('img');
      img.src = fotos[0];
      img.alt = anuncio.titulo;
      figura.appendChild(img);
    } else {
      figura.classList.add('anuncio__foto--vacio');
      figura.textContent = 'Sin foto';
    }
    articulo.appendChild(figura);

    var cuerpo = document.createElement('div');
    cuerpo.className = 'anuncio__cuerpo';

    var titulo = document.createElement('h3');
    titulo.className = 'anuncio__titulo';
    var enlace = document.createElement('a');
    enlace.href = 'anuncio.html?id=' + encodeURIComponent(anuncio.id);
    enlace.textContent = anuncio.titulo;
    titulo.appendChild(enlace);
    cuerpo.appendChild(titulo);

    var precio = document.createElement('p');
    precio.className = 'anuncio__precio';
    precio.innerHTML = '<strong>' + EC.util.escaparHtml(EC.util.formatearPrecio(anuncio.precio)) + '</strong> / mes';
    cuerpo.appendChild(precio);

    var meta = document.createElement('p');
    meta.className = 'anuncio__meta';
    meta.textContent = EC.util.textoTipo(anuncio.tipo) + ' · Barrio ' + anuncio.barrio + ', ' + EC.util.textoCiudad(anuncio.ciudad);
    cuerpo.appendChild(meta);

    var filaSpecs = EC.util.crearFilaSpecs(anuncio);
    if (filaSpecs) cuerpo.appendChild(filaSpecs);

    var propietario = anuncio.propietario;
    var autor = document.createElement('p');
    autor.className = 'anuncio__autor';
    if (propietario) {
      autor.appendChild(document.createTextNode('Publicado por '));
      var enlaceAutor = document.createElement('a');
      enlaceAutor.href = 'propietario.html?id=' + encodeURIComponent(propietario.id);
      enlaceAutor.textContent = propietario.nombre;
      autor.appendChild(enlaceAutor);
      if (propietario.verificado) autor.appendChild(EC.util.crearInsigniaVerificado());
    } else {
      autor.textContent = 'Publicado por un usuario eliminado';
    }
    cuerpo.appendChild(autor);

    var estado = document.createElement('p');
    estado.className = 'anuncio__estado';
    var badge = document.createElement('span');
    badge.className = 'estado estado--' + anuncio.estado;
    badge.textContent = EC.util.textoEstado(anuncio.estado);
    estado.appendChild(badge);
    cuerpo.appendChild(estado);

    articulo.appendChild(cuerpo);
    li.appendChild(articulo);
    return li;
  }

  /* ===== Filtros ===== */

  function toggleFavoritosActivo() {
    var toggle = document.getElementById('toggle-favoritos');
    return !!toggle && toggle.getAttribute('aria-pressed') === 'true';
  }

  function leerCriterios() {
    return {
      q: document.getElementById('q').value.trim(),
      ciudad: document.getElementById('ciudad').value,
      precioMax: document.getElementById('precio').value,
      tipo: document.getElementById('tipo').value,
      genero: document.getElementById('genero').value,
      mascotas: document.getElementById('mascotas').value,
      amoblado: document.getElementById('amoblado').value,
      soloFavoritos: toggleFavoritosActivo(),
      orden: document.getElementById('orden').value
    };
  }

  function actualizarContadorResultados(mostrados, total) {
    var contador = document.getElementById('resultados-contador');
    if (!contador) return;
    contador.textContent = total === 0 ? '' : 'Mostrando ' + mostrados + ' de ' + total + ' anuncios';
  }

  function pintar(anuncios, total) {
    var contenedor = document.getElementById('grid-anuncios');
    var vacio = document.getElementById('sin-anuncios');
    var sinResultados = document.getElementById('sin-resultados');
    var errorCarga = document.getElementById('error-carga');
    if (!contenedor) return;

    contenedor.innerHTML = '';
    if (errorCarga) errorCarga.hidden = true;

    if (total === 0) {
      if (vacio) vacio.hidden = false;
      if (sinResultados) sinResultados.hidden = true;
    } else if (anuncios.length === 0) {
      if (vacio) vacio.hidden = true;
      if (sinResultados) sinResultados.hidden = false;
    } else {
      if (vacio) vacio.hidden = true;
      if (sinResultados) sinResultados.hidden = true;
      anuncios.forEach(function (anuncio) {
        contenedor.appendChild(crearTarjeta(anuncio));
      });
    }

    if (EC.favoritos) EC.favoritos.iniciar();
    actualizarContadorResultados(anuncios.length, total);
  }

  function mostrarErrorCarga(mensaje) {
    var errorCarga = document.getElementById('error-carga');
    if (!errorCarga) return;
    errorCarga.textContent = 'No se pudieron cargar los anuncios: ' + mensaje;
    errorCarga.hidden = false;
  }

  async function aplicarFiltros() {
    var numero = ++numeroBusqueda;
    try {
      var resultado = await EC.datos.buscarAnuncios(leerCriterios());
      if (numero !== numeroBusqueda) return; // ya hay una búsqueda más nueva en camino
      pintar(resultado.anuncios, resultado.total);
    } catch (error) {
      if (numero === numeroBusqueda) mostrarErrorCarga(error.message);
    }
  }

  function limpiarFiltros() {
    var formulario = document.getElementById('form-filtros');
    if (formulario) formulario.reset();
    aplicarFiltros();
  }

  function inicializarFormulario() {
    var formulario = document.getElementById('form-filtros');
    if (!formulario) return;

    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      aplicarFiltros();
    });

    formulario.addEventListener('reset', function () {
      window.setTimeout(aplicarFiltros, 0);
    });

    document.getElementById('q').addEventListener('input', function () {
      window.clearTimeout(TEMPORIZADOR_BUSQUEDA);
      TEMPORIZADOR_BUSQUEDA = window.setTimeout(aplicarFiltros, 250);
    });

    ['ciudad', 'precio', 'tipo', 'genero', 'mascotas', 'amoblado', 'orden'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', aplicarFiltros);
    });

    var limpiarInline = document.getElementById('limpiar-filtros-inline');
    if (limpiarInline) limpiarInline.addEventListener('click', limpiarFiltros);

    var toggleFavoritos = document.getElementById('toggle-favoritos');
    if (toggleFavoritos) {
      toggleFavoritos.addEventListener('click', function () {
        var activo = toggleFavoritos.getAttribute('aria-pressed') !== 'true';
        toggleFavoritos.setAttribute('aria-pressed', String(activo));
        toggleFavoritos.classList.toggle('favoritos-bar__toggle--activo', activo);

        var textoToggle = toggleFavoritos.querySelector('.favoritos-bar__toggle-texto');
        if (textoToggle) {
          textoToggle.textContent = activo ? 'Ver todos los anuncios' : 'Ver solo mis favoritos';
        }

        aplicarFiltros();
      });
    }

    if (EC.favoritos) {
      EC.favoritos.alCambiar = function () {
        if (toggleFavoritosActivo()) aplicarFiltros();
      };
    }
  }

  function iniciar() {
    inicializarFormulario();
    aplicarFiltros();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})(window.EC);
