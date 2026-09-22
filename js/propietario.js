/* ==========================================================================
   propietario.js — perfil público de un usuario (propietario.html):
   muestra su nombre y los anuncios que ha publicado. Debe cargarse
   después de datos.js y favoritos.js.
   ========================================================================== */

(function (EC) {
  function obtenerParametroId() {
    var params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

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

  function iniciar() {
    var id = obtenerParametroId();
    var propietario = id ? EC.datos.obtenerUsuarioPorId(id) : null;

    var usuarioActual = EC.datos.obtenerUsuarioActual();
    var esAdmin = !!usuarioActual && usuarioActual.rol === 'administrador';

    if (propietario && propietario.bloqueado && !esAdmin) {
      propietario = null;
    }

    if (!propietario) {
      document.getElementById('no-encontrado').hidden = false;
      return;
    }

    document.title = propietario.nombre + ' — EstudioCúcuta';
    document.getElementById('perfil-usuario').hidden = false;
    document.getElementById('propietario-nombre').textContent = propietario.nombre;

    var anuncios = EC.datos.obtenerAnunciosDeUsuario(propietario.id);
    document.getElementById('propietario-meta').textContent =
      anuncios.length === 1 ? '1 anuncio publicado' : anuncios.length + ' anuncios publicados';

    var contenedor = document.getElementById('grid-anuncios-propietario');
    var vacio = document.getElementById('sin-anuncios-propietario');
    contenedor.innerHTML = '';

    if (anuncios.length === 0) {
      vacio.hidden = false;
    } else {
      vacio.hidden = true;
      anuncios.forEach(function (anuncio) {
        contenedor.appendChild(crearTarjeta(anuncio));
      });
    }

    if (EC.favoritos) EC.favoritos.iniciar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})(window.EC);
