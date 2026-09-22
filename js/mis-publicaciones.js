/* ==========================================================================
   mis-publicaciones.js — lista y gestiona los anuncios del usuario
   con sesión iniciada (mis-publicaciones.html). Debe cargarse después
   de datos.js y proteger.js.
   ========================================================================== */

(function (EC) {
  function crearTarjeta(anuncio) {
    var li = document.createElement('li');
    var articulo = document.createElement('article');
    articulo.className = 'anuncio';

    var figura = document.createElement('figure');
    figura.className = 'anuncio__foto';
    if (anuncio.foto) {
      var img = document.createElement('img');
      img.src = anuncio.foto;
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

    var estadoParrafo = document.createElement('p');
    var badge = document.createElement('span');
    badge.className = 'estado estado--' + anuncio.estado;
    badge.textContent = EC.util.textoEstado(anuncio.estado);
    estadoParrafo.appendChild(badge);
    cuerpo.appendChild(estadoParrafo);

    var acciones = document.createElement('div');
    acciones.className = 'anuncio__acciones';

    var editar = document.createElement('a');
    editar.href = 'publicar.html?id=' + encodeURIComponent(anuncio.id);
    editar.className = 'boton boton--secundario boton--pequeno';
    editar.textContent = 'Editar';
    acciones.appendChild(editar);

    var eliminar = document.createElement('button');
    eliminar.type = 'button';
    eliminar.className = 'boton boton--peligro boton--pequeno';
    eliminar.textContent = 'Eliminar';
    eliminar.addEventListener('click', function () {
      if (window.confirm('¿Eliminar "' + anuncio.titulo + '"? Esta acción no se puede deshacer.')) {
        EC.datos.eliminarAnuncio(anuncio.id);
        renderizar();
      }
    });
    acciones.appendChild(eliminar);

    cuerpo.appendChild(acciones);
    articulo.appendChild(cuerpo);
    li.appendChild(articulo);
    return li;
  }

  function renderizar() {
    var usuario = EC.proteger.requerirSesion();
    if (!usuario) return;

    var esAdmin = usuario.rol === 'administrador';

    var botonPublicar = document.getElementById('boton-publicar-nuevo');
    if (botonPublicar) botonPublicar.hidden = esAdmin;

    var textoSinAnuncios = document.getElementById('texto-sin-anuncios');
    if (textoSinAnuncios && esAdmin) {
      textoSinAnuncios.textContent = 'No tienes anuncios publicados.';
    }

    var contenedor = document.getElementById('grid-mis-anuncios');
    var vacio = document.getElementById('sin-anuncios');
    if (!contenedor) return;

    var misAnuncios = EC.datos.obtenerAnuncios().filter(function (anuncio) {
      return anuncio.propietarioId === usuario.id;
    });

    contenedor.innerHTML = '';
    if (misAnuncios.length === 0) {
      if (vacio) vacio.hidden = false;
    } else {
      if (vacio) vacio.hidden = true;
      misAnuncios.forEach(function (anuncio) {
        contenedor.appendChild(crearTarjeta(anuncio));
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderizar);
  } else {
    renderizar();
  }
})(window.EC);
