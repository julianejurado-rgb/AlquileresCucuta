/* ==========================================================================
   nav.js — pinta la barra de navegación según haya o no sesión iniciada,
   y según el rol del usuario. Debe cargarse después de datos.js.
   ========================================================================== */

window.EC = window.EC || {};

(function (EC) {
  function marcarPaginaActiva(nav) {
    var actual = window.location.pathname.split('/').pop() || 'index.html';
    nav.querySelectorAll('a[href]').forEach(function (enlace) {
      var href = enlace.getAttribute('href').split('?')[0];
      if (href === actual) {
        enlace.classList.add('main-nav__activo');
        enlace.setAttribute('aria-current', 'page');
      }
    });
  }

  function iniciar() {
    var nav = document.getElementById('main-nav');
    if (!nav) return;

    var usuario = EC.datos.obtenerUsuarioActual();
    var html = '<a href="index.html">Anuncios</a>';

    if (usuario) {
      if (usuario.rol !== 'administrador') {
        html += '<a href="publicar.html">Publicar anuncio</a>';
      }
      html += '<a href="mis-publicaciones.html">Mis publicaciones</a>';

      if (usuario.rol === 'administrador') {
        var pendientesAdmin = EC.datos.contarReportesPendientes() + EC.datos.contarSolicitudesVerificacionPendientes();
        html += '<a href="admin.html">Panel admin';
        if (pendientesAdmin > 0) {
          html += ' <span class="main-nav__badge">' + pendientesAdmin + '</span>';
        }
        html += '</a>';
      }
      html += '<a href="perfil.html" class="main-nav__usuario">Hola, ' + EC.util.escaparHtml(usuario.nombre) + '</a>';
      html += '<button type="button" id="cerrar-sesion" class="main-nav__salir">Cerrar sesión</button>';
    } else {
      html += '<a href="acceder.html">Iniciar sesión</a>';
      html += '<a href="registro.html">Registrarse</a>';
    }

    nav.innerHTML = html;
    marcarPaginaActiva(nav);

    var botonSalir = document.getElementById('cerrar-sesion');
    if (botonSalir) {
      botonSalir.addEventListener('click', function () {
        EC.datos.cerrarSesion();
        window.location.href = 'index.html';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  EC.nav = { iniciar: iniciar };
})(window.EC);
