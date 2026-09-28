/* ==========================================================================
   admin.js — panel de administración (admin.html): modera cualquier
   anuncio y gestiona usuarios, reportes y verificaciones. Debe cargarse
   después de datos.js y proteger.js. Solo accesible para el rol
   "administrador" (el servidor también lo exige en /api/admin).
   ========================================================================== */

(function (EC) {
  var usuarioActual = null;

  function crearCelda(texto) {
    var td = document.createElement('td');
    td.textContent = texto;
    return td;
  }

  function formatearFecha(texto) {
    return new Date(texto).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /* Ejecuta una acción del panel, avisa si falla y vuelve a pintar las
     tablas indicadas para que muestren lo que quedó en el servidor. */
  async function ejecutar(accion, recargas) {
    try {
      await accion();
    } catch (error) {
      window.alert(error.message);
    }
    recargas.forEach(function (recargar) {
      recargar().catch(function (error) { console.error(error); });
    });
  }

  async function renderizarAnuncios() {
    var cuerpo = document.getElementById('cuerpo-tabla-anuncios');
    var vacio = document.getElementById('sin-anuncios-admin');
    var anuncios = await EC.datos.admin.obtenerAnuncios();

    document.getElementById('conteo-anuncios').textContent = anuncios.length;
    cuerpo.innerHTML = '';

    if (anuncios.length === 0) {
      vacio.hidden = false;
      return;
    }
    vacio.hidden = true;

    anuncios.forEach(function (anuncio) {
      var propietario = anuncio.propietario;
      var fila = document.createElement('tr');

      var celdaTitulo = document.createElement('td');
      var enlaceTitulo = document.createElement('a');
      enlaceTitulo.href = 'anuncio.html?id=' + encodeURIComponent(anuncio.id);
      enlaceTitulo.textContent = anuncio.titulo;
      celdaTitulo.appendChild(enlaceTitulo);
      fila.appendChild(celdaTitulo);

      var celdaPropietario = document.createElement('td');
      if (propietario) {
        var enlacePropietario = document.createElement('a');
        enlacePropietario.href = 'propietario.html?id=' + encodeURIComponent(propietario.id);
        enlacePropietario.textContent = propietario.nombre;
        celdaPropietario.appendChild(enlacePropietario);
      } else {
        celdaPropietario.textContent = '(usuario eliminado)';
      }
      fila.appendChild(celdaPropietario);

      fila.appendChild(crearCelda(EC.util.formatearPrecio(anuncio.precio)));

      var celdaEstado = document.createElement('td');
      var badge = document.createElement('span');
      badge.className = 'estado estado--' + anuncio.estado;
      badge.textContent = EC.util.textoEstado(anuncio.estado);
      celdaEstado.appendChild(badge);
      fila.appendChild(celdaEstado);

      var celdaAcciones = document.createElement('td');
      celdaAcciones.className = 'tabla__acciones';

      var eliminar = document.createElement('button');
      eliminar.type = 'button';
      eliminar.className = 'boton boton--peligro boton--pequeno';
      eliminar.textContent = 'Eliminar';
      eliminar.addEventListener('click', function () {
        if (window.confirm('¿Eliminar el anuncio "' + anuncio.titulo + '"?')) {
          ejecutar(function () { return EC.datos.eliminarAnuncio(anuncio.id); }, [renderizarAnuncios, renderizarReportes]);
        }
      });
      celdaAcciones.appendChild(eliminar);

      fila.appendChild(celdaAcciones);
      cuerpo.appendChild(fila);
    });
  }

  async function renderizarUsuarios() {
    var cuerpo = document.getElementById('cuerpo-tabla-usuarios');
    var usuarios = await EC.datos.admin.obtenerUsuarios();

    document.getElementById('conteo-usuarios').textContent = usuarios.length;
    cuerpo.innerHTML = '';

    usuarios.forEach(function (usuario) {
      var esUsuarioActual = usuario.id === usuarioActual.id;
      var fila = document.createElement('tr');

      fila.appendChild(crearCelda(usuario.nombre));
      fila.appendChild(crearCelda(usuario.correo));
      fila.appendChild(crearCelda(usuario.rol === 'administrador' ? 'Administrador' : 'Usuario'));

      var celdaEstado = document.createElement('td');
      var badgeEstado = document.createElement('span');
      badgeEstado.className = 'estado ' + (usuario.bloqueado ? 'estado--alquilado' : 'estado--disponible');
      badgeEstado.textContent = usuario.bloqueado ? 'Bloqueado' : 'Activo';
      celdaEstado.appendChild(badgeEstado);
      fila.appendChild(celdaEstado);

      var celdaAcciones = document.createElement('td');
      celdaAcciones.className = 'tabla__acciones';

      if (esUsuarioActual) {
        var nota = document.createElement('span');
        nota.className = 'tabla__nota';
        nota.textContent = 'Tu cuenta';
        celdaAcciones.appendChild(nota);
      } else {
        var botonBloqueo = document.createElement('button');
        botonBloqueo.type = 'button';
        botonBloqueo.className = 'boton boton--secundario boton--pequeno';
        botonBloqueo.textContent = usuario.bloqueado ? 'Desbloquear' : 'Bloquear';
        botonBloqueo.addEventListener('click', function () {
          var accion = usuario.bloqueado ? 'desbloquear' : 'bloquear';
          if (window.confirm('¿Seguro que quieres ' + accion + ' la cuenta de "' + usuario.nombre + '"?')) {
            ejecutar(function () {
              return EC.datos.admin.cambiarBloqueo(usuario.id, !usuario.bloqueado);
            }, [renderizarUsuarios]);
          }
        });
        celdaAcciones.appendChild(botonBloqueo);

        var eliminar = document.createElement('button');
        eliminar.type = 'button';
        eliminar.className = 'boton boton--peligro boton--pequeno';
        eliminar.textContent = 'Eliminar cuenta';
        eliminar.addEventListener('click', function () {
          if (window.confirm('¿Eliminar la cuenta de "' + usuario.nombre + '"? También se eliminarán sus anuncios.')) {
            ejecutar(function () {
              return EC.datos.admin.eliminarUsuario(usuario.id);
            }, [renderizarUsuarios, renderizarAnuncios, renderizarReportes, renderizarVerificaciones]);
          }
        });
        celdaAcciones.appendChild(eliminar);
      }

      fila.appendChild(celdaAcciones);
      cuerpo.appendChild(fila);
    });
  }

  async function renderizarReportes() {
    var cuerpo = document.getElementById('cuerpo-tabla-reportes');
    var vacio = document.getElementById('sin-reportes');
    var reportes = await EC.datos.admin.obtenerReportes();

    document.getElementById('conteo-reportes').textContent = reportes.length;
    cuerpo.innerHTML = '';

    if (reportes.length === 0) {
      vacio.hidden = false;
      return;
    }
    vacio.hidden = true;

    reportes.forEach(function (reporte) {
      var anuncio = reporte.anuncio;
      var reportadoPor = reporte.reportadoPor;
      var fila = document.createElement('tr');

      var celdaAnuncio = document.createElement('td');
      if (anuncio) {
        var enlaceAnuncio = document.createElement('a');
        enlaceAnuncio.href = 'anuncio.html?id=' + encodeURIComponent(anuncio.id);
        enlaceAnuncio.textContent = anuncio.titulo;
        celdaAnuncio.appendChild(enlaceAnuncio);
      } else {
        celdaAnuncio.textContent = '(anuncio eliminado)';
      }
      fila.appendChild(celdaAnuncio);

      fila.appendChild(crearCelda(EC.util.textoMotivoReporte(reporte.motivo)));
      fila.appendChild(crearCelda(reporte.descripcion || '—'));
      fila.appendChild(crearCelda(reportadoPor ? reportadoPor.nombre : '(usuario eliminado)'));
      fila.appendChild(crearCelda(formatearFecha(reporte.fecha)));

      var celdaAcciones = document.createElement('td');
      celdaAcciones.className = 'tabla__acciones';

      var resolver = document.createElement('button');
      resolver.type = 'button';
      resolver.className = 'boton boton--secundario boton--pequeno';
      resolver.textContent = 'Marcar como resuelto';
      resolver.addEventListener('click', function () {
        ejecutar(function () { return EC.datos.admin.marcarReporteResuelto(reporte.id); }, [renderizarReportes]);
      });
      celdaAcciones.appendChild(resolver);

      if (anuncio) {
        var eliminarAnuncio = document.createElement('button');
        eliminarAnuncio.type = 'button';
        eliminarAnuncio.className = 'boton boton--peligro boton--pequeno';
        eliminarAnuncio.textContent = 'Eliminar anuncio';
        eliminarAnuncio.addEventListener('click', function () {
          if (window.confirm('¿Eliminar el anuncio "' + anuncio.titulo + '"? Esta acción no se puede deshacer.')) {
            ejecutar(function () { return EC.datos.eliminarAnuncio(anuncio.id); }, [renderizarReportes, renderizarAnuncios]);
          }
        });
        celdaAcciones.appendChild(eliminarAnuncio);
      }

      fila.appendChild(celdaAcciones);
      cuerpo.appendChild(fila);
    });
  }

  async function renderizarVerificaciones() {
    var cuerpo = document.getElementById('cuerpo-tabla-verificaciones');
    var vacio = document.getElementById('sin-verificaciones');
    var solicitudes = await EC.datos.admin.obtenerVerificaciones();

    document.getElementById('conteo-verificaciones').textContent = solicitudes.length;
    cuerpo.innerHTML = '';

    if (solicitudes.length === 0) {
      vacio.hidden = false;
      return;
    }
    vacio.hidden = true;

    solicitudes.forEach(function (solicitud) {
      var solicitante = solicitud.usuario;
      var fila = document.createElement('tr');

      var celdaUsuario = document.createElement('td');
      if (solicitante) {
        var enlaceUsuario = document.createElement('a');
        enlaceUsuario.href = 'propietario.html?id=' + encodeURIComponent(solicitante.id);
        enlaceUsuario.textContent = solicitante.nombre;
        celdaUsuario.appendChild(enlaceUsuario);
      } else {
        celdaUsuario.textContent = '(usuario eliminado)';
      }
      fila.appendChild(celdaUsuario);

      fila.appendChild(crearCelda(solicitante ? solicitante.correo : '—'));
      fila.appendChild(crearCelda(formatearFecha(solicitud.fecha)));

      var celdaAcciones = document.createElement('td');
      celdaAcciones.className = 'tabla__acciones';

      var aceptar = document.createElement('button');
      aceptar.type = 'button';
      aceptar.className = 'boton boton--secundario boton--pequeno';
      aceptar.textContent = 'Aceptar';
      aceptar.addEventListener('click', function () {
        ejecutar(function () { return EC.datos.admin.resolverVerificacion(solicitud.id, true); }, [renderizarVerificaciones]);
      });
      celdaAcciones.appendChild(aceptar);

      var rechazar = document.createElement('button');
      rechazar.type = 'button';
      rechazar.className = 'boton boton--peligro boton--pequeno';
      rechazar.textContent = 'Rechazar';
      rechazar.addEventListener('click', function () {
        ejecutar(function () { return EC.datos.admin.resolverVerificacion(solicitud.id, false); }, [renderizarVerificaciones]);
      });
      celdaAcciones.appendChild(rechazar);

      fila.appendChild(celdaAcciones);
      cuerpo.appendChild(fila);
    });
  }

  function activarPestana(nombre) {
    ['anuncios', 'usuarios', 'reportes', 'verificaciones'].forEach(function (clave) {
      document.getElementById('tab-' + clave).hidden = clave !== nombre;
      document.getElementById('pestana-' + clave).classList.toggle('panel__tab--activo', clave === nombre);
    });
  }

  async function iniciar() {
    usuarioActual = await EC.proteger.requerirAdmin();
    if (!usuarioActual) return;

    document.querySelectorAll('.panel__tab').forEach(function (boton) {
      boton.addEventListener('click', function () {
        activarPestana(boton.getAttribute('data-tab'));
      });
    });

    try {
      await Promise.all([renderizarAnuncios(), renderizarUsuarios(), renderizarReportes(), renderizarVerificaciones()]);
    } catch (error) {
      window.alert('No se pudo cargar el panel: ' + error.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})(window.EC);
