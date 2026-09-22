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
    linea1.textContent = 'Propietario: ';
    var enlacePropietario = document.createElement('a');
    enlacePropietario.href = 'propietario.html?id=' + encodeURIComponent(propietario.id);
    enlacePropietario.textContent = propietario.nombre;
    linea1.appendChild(enlacePropietario);
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

  function pintarGaleria(anuncio) {
    var contenedor = document.getElementById('pub-foto-contenedor');
    var fotoPrincipal = document.getElementById('pub-foto');
    var miniaturas = document.getElementById('pub-galeria-miniaturas');
    var fotos = EC.util.obtenerFotos(anuncio);

    miniaturas.innerHTML = '';

    if (fotos.length === 0) {
      contenedor.hidden = true;
      return;
    }
    contenedor.hidden = false;

    fotoPrincipal.src = fotos[0];
    fotoPrincipal.alt = anuncio.titulo;

    if (fotos.length === 1) return;

    fotos.forEach(function (foto, indice) {
      var li = document.createElement('li');
      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'miniatura' + (indice === 0 ? ' miniatura--activa' : '');

      var img = document.createElement('img');
      img.src = foto;
      img.alt = 'Foto ' + (indice + 1) + ' de ' + anuncio.titulo;
      boton.appendChild(img);

      boton.addEventListener('click', function () {
        fotoPrincipal.src = foto;
        miniaturas.querySelectorAll('.miniatura').forEach(function (m) {
          m.classList.remove('miniatura--activa');
        });
        boton.classList.add('miniatura--activa');
      });

      li.appendChild(boton);
      miniaturas.appendChild(li);
    });
  }

  function pintarEstadisticas(anuncio, usuarioActual) {
    if (!usuarioActual || usuarioActual.id !== anuncio.propietarioId) return;

    document.getElementById('seccion-estadisticas').hidden = false;
    document.getElementById('stat-visitas').textContent = anuncio.visitas || 0;

    var contactos = EC.datos.obtenerConversacionesDeAnuncio(anuncio.id).length;
    document.getElementById('stat-contactos').textContent = contactos;
  }

  function pintarReportar(anuncio, usuarioActual) {
    var boton = document.getElementById('pub-reportar-boton');
    var mensaje = document.getElementById('pub-reportar-mensaje');
    var formulario = document.getElementById('form-reportar');

    if (!usuarioActual || usuarioActual.id === anuncio.propietarioId) return;

    if (EC.datos.yaReportado(anuncio.id, usuarioActual.id)) {
      mensaje.textContent = 'Ya reportaste este anuncio. Está pendiente de revisión.';
      mensaje.hidden = false;
      return;
    }

    boton.hidden = false;
    boton.addEventListener('click', function () {
      boton.hidden = true;
      formulario.hidden = false;
    });

    document.getElementById('reportar-cancelar').addEventListener('click', function () {
      formulario.hidden = true;
      boton.hidden = false;
    });

    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      var motivo = document.getElementById('reportar-motivo').value;
      var descripcion = document.getElementById('reportar-descripcion').value;
      if (!motivo) return;

      var resultado = EC.datos.crearReporte(anuncio.id, usuarioActual.id, motivo, descripcion);
      formulario.hidden = true;
      mensaje.textContent = resultado.ok
        ? 'Gracias, recibimos tu reporte. Un administrador lo va a revisar.'
        : resultado.error;
      mensaje.hidden = false;
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

    pintarGaleria(anuncio);

    document.getElementById('pub-descripcion').textContent = anuncio.descripcion;
    document.getElementById('pub-tipo').textContent = EC.util.textoTipo(anuncio.tipo);
    document.getElementById('pub-ciudad').textContent = EC.util.textoCiudad(anuncio.ciudad);
    document.getElementById('pub-barrio').textContent = anuncio.barrio;

    var fecha = new Date(anuncio.fechaPublicacion);
    document.getElementById('pub-fecha').textContent = fecha.toLocaleDateString('es-CO', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    var usuarioActual = EC.datos.obtenerUsuarioActual();

    pintarContacto(anuncio);
    pintarAcciones(anuncio);
    pintarContactar(anuncio);
    pintarEstadisticas(anuncio, usuarioActual);
    pintarReportar(anuncio, usuarioActual);

    if (!usuarioActual || usuarioActual.id !== anuncio.propietarioId) {
      EC.datos.registrarVisita(anuncio.id);
    }
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
