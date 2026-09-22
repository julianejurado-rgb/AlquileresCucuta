/* ==========================================================================
   registro.js — maneja el formulario de creación de cuenta (registro.html).
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

    var formulario = document.getElementById('form-registro');
    if (!formulario) return;

    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      ocultarError();

      var nombre = document.getElementById('nombre').value.trim();
      var correo = document.getElementById('correo').value.trim();
      var contrasena = document.getElementById('contrasena').value;
      var confirmar = document.getElementById('confirmar').value;
      var genero = document.getElementById('genero').value;

      if (nombre.length < 2) {
        mostrarError('Escribe tu nombre completo.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        mostrarError('Escribe un correo electrónico válido.');
        return;
      }
      if (contrasena.length < 6) {
        mostrarError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (contrasena !== confirmar) {
        mostrarError('Las contraseñas no coinciden.');
        return;
      }
      if (!genero) {
        mostrarError('Selecciona tu género.');
        return;
      }

      var resultado = EC.datos.crearUsuario(nombre, correo, contrasena, genero);
      if (!resultado.ok) {
        mostrarError(resultado.error);
        return;
      }

      EC.datos.iniciarSesion(resultado.usuario.id);
      window.location.href = 'index.html';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})(window.EC);
