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

  async function iniciar() {
    var formulario = document.getElementById('form-acceder');
    if (!formulario) return;

    formulario.addEventListener('submit', async function (evento) {
      evento.preventDefault();
      ocultarError();

      var correo = document.getElementById('correo').value.trim();
      var contrasena = document.getElementById('contrasena').value;

      if (!correo || !contrasena) {
        mostrarError('Escribe tu correo y tu contraseña.');
        return;
      }

      var boton = formulario.querySelector('button[type="submit"]');
      boton.disabled = true;
      try {
        await EC.datos.acceder(correo, contrasena);
        window.location.href = 'index.html';
      } catch (error) {
        mostrarError(error.message);
        boton.disabled = false;
      }
    });

    if (await EC.datos.obtenerUsuarioActual()) {
      window.location.href = 'index.html';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})(window.EC);
