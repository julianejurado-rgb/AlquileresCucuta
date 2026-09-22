/* ==========================================================================
   anuncio-detalle.js — renderiza el detalle de un anuncio (anuncio.html)
   según el parámetro ?id= de la URL. Debe cargarse después de datos.js
   y favoritos.js.
   ========================================================================== */

(function (EC) {
  function obtenerParametroId() {
    var params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  function pintarContacto(anuncio) {
    var propietario = EC.datos.obtenerUsuarioPorId(anuncio.propietarioId);
    var contacto = document.getElementById('pub-contacto');
    contacto.innerHTML = '';

    if (!propietario) {
      contacto.textContent = 'El propietario de este anuncio ya no está disponible.';
      return;
    }

    var linea1 = document.createElement('span');
    linea1.textContent = 'Propietario: ' + propietario.nombre;
    contacto.appendChild(linea1);

    var linea2 = document.createElement('span');
    linea2.textContent = 'Correo: ';
    var enlaceCorreo = document.createElement('a');
    enlaceCorreo.href = 'mailto:' + propietario.correo;
    enlaceCorreo.textContent = propietario.correo;
    linea2.appendChild(enlaceCorreo);
    contacto.appendChild(linea2);

    if (anuncio.telefono) {
      var linea3 = document.createElement('span');
      linea3.textContent = 'Teléfono: ';
      var enlaceTel = document.createElement('a');
      enlaceTel.href = 'tel:' + anuncio.telefono;
      enlaceTel.textContent = anuncio.telefono;
      linea3.appendChild(enlaceTel);
      contacto.appendChild(linea3);
    }
  }

  function pintarAcciones(anuncio) {
    var usuarioActual = EC.datos.obtenerUsuarioActual();
    if (!usuarioActual) return;

    var esDueno = usuarioActual.id === anuncio.propietarioId;
    var esAdmin = usuarioActual.rol === 'administrador';
    if (!esDueno && !esAdmin) return;

    document.getElementById('acciones-propietario').hidden = false;

    var botonEditar = document.getElementById('pub-editar');
    if (esDueno) {
      botonEditar.hidden = false;
      botonEditar.href = 'publicar.html?id=' + encodeURIComponent(anuncio.id);
    } else {
      botonEditar.hidden = true;
    }

    document.getElementById('pub-eliminar').addEventListener('click', function () {
      if (window.confirm('¿Eliminar este anuncio? Esta acción no se puede deshacer.')) {
        EC.datos.eliminarAnuncio(anuncio.id);
        window.location.href = 'index.html';
      }
    });
  }

  function pintarContactar(anuncio) {
    var usuarioActual = EC.datos.obtenerUsuarioActual();
    var boton = document.getElementById('pub-contactar');
    var ayuda = document.getElementById('pub-contactar-ayuda');

    if (!usuarioActual) {
      ayuda.hidden = false;
      return;
    }
    if (usuarioActual.id === anuncio.propietarioId) return;

    boton.hidden = false;
    boton.addEventListener('click', function () {
      var conversacion = EC.datos.obtenerOCrearConversacion(anuncio.id, usuarioActual.id);
      if (conversacion) {
        window.location.href = 'mensajes.html?id=' + encodeURIComponent(conversacion.id);
      }
    });
  }

  function pintar(anuncio) {
    document.title = anuncio.titulo + ' — EstudioCúcuta';

    document.getElementById('pub-titulo').textContent = anuncio.titulo;
    document.getElementById('pub-precio').textContent = EC.util.formatearPrecio(anuncio.precio);

    var estadoEl = document.getElementById('pub-estado');
    estadoEl.textContent = EC.util.textoEstado(anuncio.estado);
    estadoEl.className = 'estado estado--' + anuncio.estado;

    document.getElementById('pub-favorito').setAttribute('data-id', anuncio.id);

    var fotoContenedor = document.getElementById('pub-foto-contenedor');
    var fotoImg = document.getElementById('pub-foto');
    if (anuncio.foto) {
      fotoImg.src = anuncio.foto;
      fotoImg.alt = anuncio.titulo;
      fotoContenedor.hidden = false;
    } else {
      fotoContenedor.hidden = true;
    }

    document.getElementById('pub-descripcion').textContent = anuncio.descripcion;
    document.getElementById('pub-tipo').textContent = EC.util.textoTipo(anuncio.tipo);
    document.getElementById('pub-ciudad').textContent = EC.util.textoCiudad(anuncio.ciudad);
    document.getElementById('pub-barrio').textContent = anuncio.barrio;

    var fecha = new Date(anuncio.fechaPublicacion);
    document.getElementById('pub-fecha').textContent = fecha.toLocaleDateString('es-CO', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    pintarContacto(anuncio);
    pintarAcciones(anuncio);
    pintarContactar(anuncio);
  }

  function iniciar() {
    var id = obtenerParametroId();
    var anuncio = id ? EC.datos.obtenerAnuncioPorId(id) : null;

    if (anuncio) {
      var propietario = EC.datos.obtenerUsuarioPorId(anuncio.propietarioId);
      var usuarioActual = EC.datos.obtenerUsuarioActual();
      var esAdmin = !!usuarioActual && usuarioActual.rol === 'administrador';
      if (propietario && propietario.bloqueado && !esAdmin) {
        anuncio = null;
      }
    }

    if (!anuncio) {
      document.getElementById('no-encontrado').hidden = false;
      return;
    }

    document.getElementById('publicacion').hidden = false;
    pintar(anuncio);
    if (EC.favoritos) EC.favoritos.iniciar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})(window.EC);
