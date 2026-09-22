/* ==========================================================================
   admin.js — panel de administración (admin.html): modera cualquier
   anuncio y gestiona usuarios. Debe cargarse después de datos.js
   y proteger.js. Solo accesible para el rol "administrador".
   ========================================================================== */

(function (EC) {
  var usuarioActual = null;

  function crearCelda(texto) {
    var td = document.createElement('td');
    td.textContent = texto;
    return td;
  }

  function renderizarAnuncios() {
    var cuerpo = document.getElementById('cuerpo-tabla-anuncios');
    var vacio = document.getElementById('sin-anuncios-admin');
    var anuncios = EC.datos.obtenerAnuncios();

    document.getElementById('conteo-anuncios').textContent = anuncios.length;
    cuerpo.innerHTML = '';

    if (anuncios.length === 0) {
      vacio.hidden = false;
      return;
    }
    vacio.hidden = true;

    anuncios.forEach(function (anuncio) {
      var propietario = EC.datos.obtenerUsuarioPorId(anuncio.propietarioId);
      var fila = document.createElement('tr');

      var celdaTitulo = document.createElement('td');
      var enlaceTitulo = document.createElement('a');
      enlaceTitulo.href = 'anuncio.html?id=' + encodeURIComponent(anuncio.id);
      enlaceTitulo.textContent = anuncio.titulo;
      celdaTitulo.appendChild(enlaceTitulo);
      fila.appendChild(celdaTitulo);

      fila.appendChild(crearCelda(propietario ? propietario.nombre : '(usuario eliminado)'));
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
          EC.datos.eliminarAnuncio(anuncio.id);
          renderizarAnuncios();
        }
      });
      celdaAcciones.appendChild(eliminar);

      fila.appendChild(celdaAcciones);
      cuerpo.appendChild(fila);
    });
  }

  function renderizarUsuarios() {
    var cuerpo = document.getElementById('cuerpo-tabla-usuarios');
    var usuarios = EC.datos.obtenerUsuarios();

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
            EC.datos.actualizarUsuario(usuario.id, { bloqueado: !usuario.bloqueado });
            renderizarUsuarios();
          }
        });
        celdaAcciones.appendChild(botonBloqueo);

        var eliminar = document.createElement('button');
        eliminar.type = 'button';
        eliminar.className = 'boton boton--peligro boton--pequeno';
        eliminar.textContent = 'Eliminar cuenta';
        eliminar.addEventListener('click', function () {
          if (window.confirm('¿Eliminar la cuenta de "' + usuario.nombre + '"? También se eliminarán sus anuncios.')) {
            EC.datos.eliminarUsuario(usuario.id);
            renderizarUsuarios();
            renderizarAnuncios();
          }
        });
        celdaAcciones.appendChild(eliminar);
      }

      fila.appendChild(celdaAcciones);
      cuerpo.appendChild(fila);
    });
  }

  function activarPestana(nombre) {
    ['anuncios', 'usuarios'].forEach(function (clave) {
      document.getElementById('tab-' + clave).hidden = clave !== nombre;
      document.getElementById('pestana-' + clave).classList.toggle('panel__tab--activo', clave === nombre);
    });
  }

  function iniciar() {
    usuarioActual = EC.proteger.requerirAdmin();
    if (!usuarioActual) return;

    renderizarAnuncios();
    renderizarUsuarios();

    document.querySelectorAll('.panel__tab').forEach(function (boton) {
      boton.addEventListener('click', function () {
        activarPestana(boton.getAttribute('data-tab'));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})(window.EC);
