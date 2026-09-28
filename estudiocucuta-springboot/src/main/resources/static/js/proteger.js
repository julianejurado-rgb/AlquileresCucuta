/* ==========================================================================
   proteger.js — funciones de guardia para páginas que requieren sesión
   iniciada o rol de administrador. Solo redirigen: la protección real la
   hace el servidor, que rechaza las peticiones sin permiso.
   Debe cargarse después de datos.js.
   ========================================================================== */

window.EC = window.EC || {};

(function (EC) {
  async function requerirSesion() {
    var usuario = await EC.datos.obtenerUsuarioActual();
    if (!usuario) {
      window.location.href = 'acceder.html';
      return null;
    }
    return usuario;
  }

  async function requerirAdmin() {
    var usuario = await requerirSesion();
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
