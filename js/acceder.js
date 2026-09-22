/* ==========================================================================
   acceder.js — maneja el formulario de inicio de sesión (acceder.html).
   Debe cargarse después de datos.js.
   ========================================================================== */

(function (EC) {
  function mostrarError(mensaje) {
    var el = document.getElementById('mensaje-error');
    el.textContent = mensaje;
    el.hidden = false;
  }

  function ocultarError() {
    var el = document.getElementById('mensaje-error');
    el.hidden = true;
  }

  function iniciar() {
    if (EC.datos.obtenerUsuarioActual()) {
      window.location.href = 'index.html';
      return;
    }

    var formulario = document.getElementById('form-acceder');
    if (!formulario) return;

    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      ocultarError();

      var correo = document.getElementById('correo').value.trim();
      var contrasena = document.getElementById('contrasena').value;

      var usuario = EC.datos.validarCredenciales(correo, contrasena);
      if (!usuario) {
        mostrarError('Correo o contraseña incorrectos.');
        return;
      }
      if (usuario.bloqueado) {
        mostrarError('Tu cuenta ha sido bloqueada. Contacta al administrador.');
        return;
      }

      EC.datos.iniciarSesion(usuario.id);
      window.location.href = 'index.html';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})(window.EC);
