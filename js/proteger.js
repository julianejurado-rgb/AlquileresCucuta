/* ==========================================================================
   proteger.js — funciones de guardia para páginas que requieren sesión
   iniciada o rol de administrador. Debe cargarse después de datos.js.
   ========================================================================== */

window.EC = window.EC || {};

(function (EC) {
  function requerirSesion() {
    var usuario = EC.datos.obtenerUsuarioActual();
    if (!usuario) {
      window.location.href = 'acceder.html';
      return null;
    }
    return usuario;
  }

  function requerirAdmin() {
    var usuario = requerirSesion();
    if (usuario && usuario.rol !== 'administrador') {
      window.location.href = 'index.html';
      return null;
    }
    return usuario;
  }

  EC.proteger = {
    requerirSesion: requerirSesion,
    requerirAdmin: requerirAdmin
  };
})(window.EC);
