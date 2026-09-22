/* ==========================================================================
   index.js — renderiza el listado de anuncios (index.html) a partir de
   los anuncios guardados en localStorage, y aplica los filtros de
   búsqueda (palabra clave, ciudad, precio máximo, tipo) combinados con
   el toggle "ver solo mis favoritos". Debe cargarse después de
   datos.js y favoritos.js.
   ========================================================================== */

(function (EC) {
  var TODOS_LOS_ANUNCIOS = [];
  var TEMPORIZADOR_BUSQUEDA = null;

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

    var propietario = EC.datos.obtenerUsuarioPorId(anuncio.propietarioId);
    var autor = document.createElement('p');
    autor.className = 'anuncio__autor';
    if (propietario) {
      autor.textContent = 'Publicado por ';
      var enlaceAutor = document.createElement('a');
      enlaceAutor.href = 'propietario.html?id=' + encodeURIComponent(propietario.id);
      enlaceAutor.textContent = propietario.nombre;
      autor.appendChild(enlaceAutor);
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
      q: document.getElementById('q').value.trim().toLowerCase(),
      ciudad: document.getElementById('ciudad').value,
      precioMax: document.getElementById('precio').value ? Number(document.getElementById('precio').value) : null,
      tipo: document.getElementById('tipo').value,
      soloFavoritos: toggleFavoritosActivo()
    };
  }

  function coincideConCriterios(anuncio, criterios) {
    if (criterios.ciudad && anuncio.ciudad !== criterios.ciudad) return false;
    if (criterios.tipo && anuncio.tipo !== criterios.tipo) return false;
    if (criterios.precioMax !== null && Number(anuncio.precio) > criterios.precioMax) return false;
    if (criterios.soloFavoritos && !EC.favoritos.esFavorito(anuncio.id)) return false;

    if (criterios.q) {
      var texto = [
        anuncio.titulo,
        anuncio.barrio,
        anuncio.descripcion,
        EC.util.textoTipo(anuncio.tipo),
        EC.util.textoCiudad(anuncio.ciudad)
      ].join(' ').toLowerCase();
      if (texto.indexOf(criterios.q) === -1) return false;
    }

    return true;
  }

  function ordenarAnuncios(lista, orden) {
    var copia = lista.slice();
    if (orden === 'precio-asc') {
      copia.sort(function (a, b) { return Number(a.precio) - Number(b.precio); });
    } else if (orden === 'precio-desc') {
      copia.sort(function (a, b) { return Number(b.precio) - Number(a.precio); });
    } else if (orden === 'antiguos') {
      copia.sort(function (a, b) { return new Date(a.fechaPublicacion) - new Date(b.fechaPublicacion); });
    } else {
      copia.sort(function (a, b) { return new Date(b.fechaPublicacion) - new Date(a.fechaPublicacion); });
    }
    return copia;
  }

  function actualizarContadorResultados(mostrados, total) {
    var contador = document.getElementById('resultados-contador');
    if (!contador) return;
    contador.textContent = total === 0 ? '' : 'Mostrando ' + mostrados + ' de ' + total + ' anuncios';
  }

  function pintar(anuncios) {
    var contenedor = document.getElementById('grid-anuncios');
    var vacio = document.getElementById('sin-anuncios');
    var sinResultados = document.getElementById('sin-resultados');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (TODOS_LOS_ANUNCIOS.length === 0) {
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
    actualizarContadorResultados(anuncios.length, TODOS_LOS_ANUNCIOS.length);
  }

  function aplicarFiltros() {
    var criterios = leerCriterios();
    var filtrados = TODOS_LOS_ANUNCIOS.filter(function (anuncio) {
      return coincideConCriterios(anuncio, criterios);
    });
    var orden = document.getElementById('orden');
    pintar(ordenarAnuncios(filtrados, orden ? orden.value : ''));
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

    ['ciudad', 'precio', 'tipo', 'orden'].forEach(function (id) {
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
    TODOS_LOS_ANUNCIOS = EC.datos.obtenerAnunciosPublicos();
    inicializarFormulario();
    aplicarFiltros();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})(window.EC);
