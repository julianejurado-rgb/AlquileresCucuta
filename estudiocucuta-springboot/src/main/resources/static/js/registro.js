/* ==========================================================================
   registro.js — maneja el formulario de creación de cuenta (registro.html).
   Las validaciones de aquí son para avisar rápido; el servidor las vuelve
   a revisar. Debe cargarse después de datos.js.
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
    var formulario = document.getElementById('form-registro');
    if (!formulario) return;

    formulario.addEventListener('submit', async function (evento) {
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

      var boton = formulario.querySelector('button[type="submit"]');
      boton.disabled = true;
      try {
        await EC.datos.registrar({ nombre: nombre, correo: correo, contrasena: contrasena, genero: genero });
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
