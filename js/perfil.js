/* ==========================================================================
   perfil.js — gestión de la cuenta del usuario con sesión iniciada
   (perfil.html): editar nombre/correo, cambiar contraseña y eliminar
   la cuenta. Debe cargarse después de datos.js y proteger.js.
   ========================================================================== */

(function (EC) {
  var usuarioActual = null;

  function mostrarMensaje(elementoId, texto, tipo) {
    var el = document.getElementById(elementoId);
    el.textContent = texto;
    el.className = 'mensaje mensaje--' + tipo;
    el.hidden = false;
  }

  function ocultarMensaje(elementoId) {
    document.getElementById(elementoId).hidden = true;
  }

  function pintarDatos() {
    document.getElementById('nombre').value = usuarioActual.nombre;
    document.getElementById('correo').value = usuarioActual.correo;

    if (usuarioActual.rol !== 'administrador') {
      document.getElementById('campo-genero').hidden = false;
      document.getElementById('genero').value = usuarioActual.genero || '';
    }

    var insignia = document.getElementById('perfil-rol');
    insignia.textContent = usuarioActual.rol === 'administrador' ? 'Administrador' : 'Usuario';
    insignia.className = 'insignia-rol insignia-rol--' + usuarioActual.rol;
  }

  function inicializarFormularioDatos() {
    document.getElementById('form-datos').addEventListener('submit', function (evento) {
      evento.preventDefault();
      ocultarMensaje('mensaje-datos');

      var nombre = document.getElementById('nombre').value.trim();
      var correo = document.getElementById('correo').value.trim();
      var esAdmin = usuarioActual.rol === 'administrador';
      var genero = esAdmin ? usuarioActual.genero : document.getElementById('genero').value;

      if (nombre.length < 2) {
        mostrarMensaje('mensaje-datos', 'Escribe tu nombre completo.', 'error');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        mostrarMensaje('mensaje-datos', 'Escribe un correo electrónico válido.', 'error');
        return;
      }
      if (!esAdmin && !genero) {
        mostrarMensaje('mensaje-datos', 'Selecciona tu género.', 'error');
        return;
      }

      var otroConEseCorreo = EC.datos.obtenerUsuarioPorCorreo(correo);
      if (otroConEseCorreo && otroConEseCorreo.id !== usuarioActual.id) {
        mostrarMensaje('mensaje-datos', 'Ya existe otra cuenta registrada con ese correo.', 'error');
        return;
      }

      EC.datos.actualizarUsuario(usuarioActual.id, { nombre: nombre, correo: correo.toLowerCase(), genero: genero });
      usuarioActual = EC.datos.obtenerUsuarioPorId(usuarioActual.id);

      mostrarMensaje('mensaje-datos', 'Datos actualizados correctamente.', 'exito');
      if (EC.nav) EC.nav.iniciar();
    });
  }

  function inicializarFormularioContrasena() {
    document.getElementById('form-contrasena').addEventListener('submit', function (evento) {
      evento.preventDefault();
      ocultarMensaje('mensaje-contrasena');

      var actual = document.getElementById('contrasena-actual').value;
      var nueva = document.getElementById('contrasena-nueva').value;
      var confirmar = document.getElementById('contrasena-confirmar').value;

      if (!actual || !nueva || !confirmar) {
        mostrarMensaje('mensaje-contrasena', 'Completa los tres campos para cambiar la contraseña.', 'error');
        return;
      }
      if (!EC.datos.validarCredenciales(usuarioActual.correo, actual)) {
        mostrarMensaje('mensaje-contrasena', 'La contraseña actual no es correcta.', 'error');
        return;
      }
      if (nueva.length < 6) {
        mostrarMensaje('mensaje-contrasena', 'La contraseña nueva debe tener al menos 6 caracteres.', 'error');
        return;
      }
      if (nueva !== confirmar) {
        mostrarMensaje('mensaje-contrasena', 'Las contraseñas nuevas no coinciden.', 'error');
        return;
      }

      EC.datos.cambiarContrasena(usuarioActual.id, nueva);
      document.getElementById('form-contrasena').reset();
      mostrarMensaje('mensaje-contrasena', 'Contraseña actualizada correctamente.', 'exito');
    });
  }

  function inicializarZonaPeligro() {
    var boton = document.getElementById('eliminar-cuenta');

    if (usuarioActual.rol === 'administrador') {
      boton.disabled = true;
      document.getElementById('nota-admin').hidden = false;
      return;
    }

    boton.addEventListener('click', function () {
      var confirmacion = window.confirm(
        '¿Eliminar tu cuenta "' + usuarioActual.nombre + '"? También se eliminarán todos tus anuncios. Esta acción no se puede deshacer.'
      );
      if (!confirmacion) return;

      EC.datos.eliminarUsuario(usuarioActual.id);
      EC.datos.cerrarSesion();
      window.location.href = 'index.html';
    });
  }

  function iniciar() {
    usuarioActual = EC.proteger.requerirSesion();
    if (!usuarioActual) return;

    pintarDatos();
    inicializarFormularioDatos();
    inicializarFormularioContrasena();
    inicializarZonaPeligro();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})(window.EC);
