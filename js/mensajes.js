/* ==========================================================================
   mensajes.js — bandeja y conversación de chat (mensajes.html). Sin
   parámetro ?id= muestra la lista de conversaciones del usuario; con
   ?id= muestra ese hilo. Debe cargarse después de datos.js y
   proteger.js.
   ========================================================================== */

(function (EC) {
  function obtenerParametroId() {
    var params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  function otraPersona(conversacion, usuarioActual) {
    var otroId = conversacion.propietarioId === usuarioActual.id
      ? conversacion.interesadoId
      : conversacion.propietarioId;
    return EC.datos.obtenerUsuarioPorId(otroId);
  }

  function ultimaFecha(conversacion) {
    var mensajes = EC.datos.obtenerMensajesDeConversacion(conversacion.id);
    if (mensajes.length === 0) return new Date(conversacion.creada);
    return new Date(mensajes[mensajes.length - 1].fecha);
  }

  function crearFilaConversacion(conversacion, usuarioActual) {
    var li = document.createElement('li');

    var enlace = document.createElement('a');
    enlace.className = 'conversacion';
    enlace.href = 'mensajes.html?id=' + encodeURIComponent(conversacion.id);

    var otro = otraPersona(conversacion, usuarioActual);
    var anuncio = EC.datos.obtenerAnuncioPorId(conversacion.anuncioId);
    var mensajes = EC.datos.obtenerMensajesDeConversacion(conversacion.id);
    var ultimoMensaje = mensajes[mensajes.length - 1];
    var hayNoLeidos = mensajes.some(function (mensaje) {
      return mensaje.deId !== usuarioActual.id && !mensaje.leido;
    });

    var cabecera = document.createElement('div');
    cabecera.className = 'conversacion__cabecera';

    var nombre = document.createElement('span');
    nombre.className = 'conversacion__nombre';
    nombre.textContent = otro ? otro.nombre : 'Usuario eliminado';
    cabecera.appendChild(nombre);

    if (hayNoLeidos) {
      var punto = document.createElement('span');
      punto.className = 'conversacion__punto';
      punto.setAttribute('aria-label', 'Tiene mensajes sin leer');
      cabecera.appendChild(punto);
    }

    enlace.appendChild(cabecera);

    var tituloAnuncio = document.createElement('span');
    tituloAnuncio.className = 'conversacion__anuncio';
    tituloAnuncio.textContent = anuncio ? anuncio.titulo : 'Anuncio eliminado';
    enlace.appendChild(tituloAnuncio);

    var previa = document.createElement('span');
    previa.className = 'conversacion__previa';
    previa.textContent = ultimoMensaje ? ultimoMensaje.texto : 'Todavía no hay mensajes.';
    enlace.appendChild(previa);

    li.appendChild(enlace);
    return li;
  }

  function renderizarLista(usuarioActual) {
    document.getElementById('vista-lista').hidden = false;
    document.getElementById('vista-hilo').hidden = true;

    var lista = document.getElementById('lista-conversaciones');
    var vacio = document.getElementById('sin-conversaciones');

    var conversaciones = EC.datos.obtenerConversacionesDeUsuario(usuarioActual.id)
      .slice()
      .sort(function (a, b) { return ultimaFecha(b) - ultimaFecha(a); });

    lista.innerHTML = '';

    if (conversaciones.length === 0) {
      vacio.hidden = false;
      return;
    }
    vacio.hidden = true;

    conversaciones.forEach(function (conversacion) {
      lista.appendChild(crearFilaConversacion(conversacion, usuarioActual));
    });
  }

  function pintarMensajes(conversacion, usuarioActual) {
    var lista = document.getElementById('hilo-mensajes');
    lista.innerHTML = '';

    EC.datos.obtenerMensajesDeConversacion(conversacion.id).forEach(function (mensaje) {
      var li = document.createElement('li');
      li.className = 'burbuja ' + (mensaje.deId === usuarioActual.id ? 'burbuja--propia' : 'burbuja--ajena');

      var texto = document.createElement('p');
      texto.textContent = mensaje.texto;
      li.appendChild(texto);

      var hora = document.createElement('time');
      hora.textContent = new Date(mensaje.fecha).toLocaleString('es-CO', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      });
      li.appendChild(hora);

      lista.appendChild(li);
    });

    lista.scrollTop = lista.scrollHeight;
  }

  function renderizarHilo(conversacion, usuarioActual) {
    document.getElementById('vista-lista').hidden = true;
    document.getElementById('vista-hilo').hidden = false;

    var otro = otraPersona(conversacion, usuarioActual);
    var anuncio = EC.datos.obtenerAnuncioPorId(conversacion.anuncioId);

    document.getElementById('hilo-titulo').textContent = otro ? otro.nombre : 'Usuario eliminado';
    document.getElementById('hilo-meta').textContent = 'Sobre: ' + (anuncio ? anuncio.titulo : 'anuncio eliminado');

    EC.datos.marcarConversacionLeida(conversacion.id, usuarioActual.id);
    if (EC.nav) EC.nav.iniciar();
    pintarMensajes(conversacion, usuarioActual);

    var formulario = document.getElementById('form-mensaje');
    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      var campo = document.getElementById('texto-mensaje');
      var texto = campo.value.trim();
      if (!texto) return;

      EC.datos.enviarMensaje(conversacion.id, usuarioActual.id, texto);
      campo.value = '';
      campo.focus();
      pintarMensajes(conversacion, usuarioActual);
    });
  }

  function iniciar() {
    var usuarioActual = EC.proteger.requerirSesion();
    if (!usuarioActual) return;

    var id = obtenerParametroId();
    if (!id) {
      renderizarLista(usuarioActual);
      return;
    }

    var conversacion = EC.datos.obtenerConversacionPorId(id);
    var perteneceAlUsuario = !!conversacion &&
      (conversacion.propietarioId === usuarioActual.id || conversacion.interesadoId === usuarioActual.id);

    if (!perteneceAlUsuario) {
      window.location.href = 'mensajes.html';
      return;
    }

    renderizarHilo(conversacion, usuarioActual);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})(window.EC);
