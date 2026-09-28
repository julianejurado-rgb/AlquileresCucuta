/* ==========================================================================
   perfil.js — gestión de la cuenta del usuario con sesión iniciada
   (perfil.html): editar nombre/correo, cambiar contraseña, pedir la
   verificación y eliminar la cuenta. Debe cargarse después de datos.js
   y proteger.js.
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

  function pintarVerificacion() {
    if (usuarioActual.rol === 'administrador') return;

    var tarjeta = document.getElementById('tarjeta-verificacion');
    var estado = document.getElementById('verificacion-estado');
    var boton = document.getElementById('solicitar-verificacion');
    tarjeta.hidden = false;

    if (usuarioActual.verificado) {
      estado.innerHTML = '';
      estado.appendChild(document.createTextNode('Tu cuenta está verificada. '));
      estado.appendChild(EC.util.crearInsigniaVerificado());
      boton.hidden = true;
      return;
    }

    if (usuarioActual.verificacionPendiente) {
      estado.textContent = 'Tu solicitud está pendiente de revisión por un administrador.';
      boton.hidden = true;
      return;
    }

    estado.textContent = 'Aún no has solicitado la verificación de tu cuenta.';
    boton.hidden = false;
  }

  function inicializarVerificacion() {
    var boton = document.getElementById('solicitar-verificacion');
    boton.addEventListener('click', async function () {
      boton.disabled = true;
      try {
        await EC.datos.solicitarVerificacion();
        usuarioActual.verificacionPendiente = true;
        pintarVerificacion();
      } catch (error) {
        window.alert(error.message);
      } finally {
        boton.disabled = false;
      }
    });
  }

  function inicializarFormularioDatos() {
    document.getElementById('form-datos').addEventListener('submit', async function (evento) {
      evento.preventDefault();
      if (!usuarioActual) return;
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

      try {
        usuarioActual = await EC.datos.actualizarCuenta({ nombre: nombre, correo: correo, genero: genero || null });
        mostrarMensaje('mensaje-datos', 'Datos actualizados correctamente.', 'exito');
        if (EC.nav) EC.nav.iniciar();
      } catch (error) {
        mostrarMensaje('mensaje-datos', error.message, 'error');
      }
    });
  }

  function inicializarFormularioContrasena() {
    document.getElementById('form-contrasena').addEventListener('submit', async function (evento) {
      evento.preventDefault();
      if (!usuarioActual) return;
      ocultarMensaje('mensaje-contrasena');

      var actual = document.getElementById('contrasena-actual').value;
      var nueva = document.getElementById('contrasena-nueva').value;
      var confirmar = document.getElementById('contrasena-confirmar').value;

      if (!actual || !nueva || !confirmar) {
        mostrarMensaje('mensaje-contrasena', 'Completa los tres campos para cambiar la contraseña.', 'error');
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

      try {
        await EC.datos.cambiarContrasena(actual, nueva);
        document.getElementById('form-contrasena').reset();
        mostrarMensaje('mensaje-contrasena', 'Contraseña actualizada correctamente.', 'exito');
      } catch (error) {
        mostrarMensaje('mensaje-contrasena', error.message, 'error');
      }
    });
  }

  function inicializarZonaPeligro() {
    var boton = document.getElementById('eliminar-cuenta');

    if (usuarioActual.rol === 'administrador') {
      boton.disabled = true;
      document.getElementById('nota-admin').hidden = false;
      return;
    }

    boton.addEventListener('click', async function () {
      var confirmacion = window.confirm(
        '¿Eliminar tu cuenta "' + usuarioActual.nombre + '"? También se eliminarán todos tus anuncios. Esta acción no se puede deshacer.'
      );
      if (!confirmacion) return;

      try {
        await EC.datos.eliminarCuenta();
        window.location.href = 'index.html';
      } catch (error) {
        window.alert(error.message);
      }
    });
  }

  async function iniciar() {
    inicializarFormularioDatos();
    inicializarFormularioContrasena();
    inicializarVerificacion();

    usuarioActual = await EC.proteger.requerirSesion();
    if (!usuarioActual) return;

    pintarDatos();
    pintarVerificacion();
    inicializarZonaPeligro();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})(window.EC);
