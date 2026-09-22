/* ==========================================================================
   chat-widget.js — burbuja de chat flotante (abajo a la derecha, en todas
   las páginas) para ver conversaciones y responder sin salir de la
   página, en vez de una página de mensajes aparte. Solo se muestra si
   hay una sesión iniciada. Debe cargarse después de datos.js y nav.js.
   ========================================================================== */

window.EC = window.EC || {};

(function (EC) {
  var usuarioActual = null;
  var conversacionAbiertaId = null;

  var ICONO_CHAT = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  var ICONO_ENVIAR = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>';

  function crearWidget() {
    var contenedor = document.createElement('div');
    contenedor.className = 'chat-widget';
    contenedor.id = 'chat-widget';
    contenedor.innerHTML =
      '<button type="button" class="chat-widget__burbuja" id="chat-widget-burbuja" aria-label="Abrir mensajes">' +
        '<span class="chat-widget__icono" aria-hidden="true">' + ICONO_CHAT + '</span>' +
        '<span class="chat-widget__badge" id="chat-widget-badge" hidden></span>' +
      '</button>' +
      '<div class="chat-widget__panel" id="chat-widget-panel" hidden>' +
        '<div class="chat-widget__vista" id="chat-widget-lista">' +
          '<div class="chat-widget__cabecera">' +
            '<h2>Mensajes</h2>' +
            '<button type="button" class="chat-widget__cerrar" id="chat-widget-cerrar" aria-label="Cerrar mensajes">&times;</button>' +
          '</div>' +
          '<p class="chat-widget__vacio" id="chat-widget-vacio" hidden>Todavía no tienes conversaciones. Contacta al propietario de un anuncio desde su página de detalle para empezar una.</p>' +
          '<ul class="chat-widget__conversaciones" id="chat-widget-conversaciones"></ul>' +
        '</div>' +
        '<div class="chat-widget__vista" id="chat-widget-hilo" hidden>' +
          '<div class="chat-widget__cabecera">' +
            '<button type="button" class="chat-widget__volver" id="chat-widget-volver" aria-label="Volver a la lista">&larr;</button>' +
            '<div class="chat-widget__hilo-info">' +
              '<strong id="chat-widget-hilo-nombre"></strong>' +
              '<span id="chat-widget-hilo-anuncio"></span>' +
            '</div>' +
            '<button type="button" class="chat-widget__cerrar" id="chat-widget-cerrar-hilo" aria-label="Cerrar mensajes">&times;</button>' +
          '</div>' +
          '<ul class="chat-widget__mensajes" id="chat-widget-mensajes"></ul>' +
          '<form id="chat-widget-form">' +
            '<textarea id="chat-widget-texto" rows="1" maxlength="1000" placeholder="Escribe un mensaje..." required></textarea>' +
            '<button type="submit" class="chat-widget__enviar" aria-label="Enviar">' + ICONO_ENVIAR + '</button>' +
          '</form>' +
        '</div>' +
      '</div>';
    document.body.appendChild(contenedor);
  }

  function pintarBadge() {
    var badge = document.getElementById('chat-widget-badge');
    if (!badge) return;
    var noLeidos = EC.datos.contarConversacionesConNoLeidos(usuarioActual.id);
    if (noLeidos > 0) {
      badge.textContent = noLeidos;
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  function otraPersona(conversacion) {
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

  function crearFilaConversacion(conversacion) {
    var li = document.createElement('li');

    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'chat-widget__conversacion';

    var otro = otraPersona(conversacion);
    var anuncio = EC.datos.obtenerAnuncioPorId(conversacion.anuncioId);
    var mensajes = EC.datos.obtenerMensajesDeConversacion(conversacion.id);
    var ultimoMensaje = mensajes[mensajes.length - 1];
    var hayNoLeidos = mensajes.some(function (mensaje) {
      return mensaje.deId !== usuarioActual.id && !mensaje.leido;
    });

    var cabecera = document.createElement('div');
    cabecera.className = 'chat-widget__conversacion-cabecera';

    var nombre = document.createElement('span');
    nombre.className = 'chat-widget__conversacion-nombre';
    nombre.textContent = otro ? otro.nombre : 'Usuario eliminado';
    cabecera.appendChild(nombre);

    if (hayNoLeidos) {
      var punto = document.createElement('span');
      punto.className = 'chat-widget__conversacion-punto';
      punto.setAttribute('aria-label', 'Tiene mensajes sin leer');
      cabecera.appendChild(punto);
    }
    boton.appendChild(cabecera);

    var tituloAnuncio = document.createElement('span');
    tituloAnuncio.className = 'chat-widget__conversacion-anuncio';
    tituloAnuncio.textContent = anuncio ? anuncio.titulo : 'Anuncio eliminado';
    boton.appendChild(tituloAnuncio);

    var previa = document.createElement('span');
    previa.className = 'chat-widget__conversacion-previa';
    previa.textContent = ultimoMensaje ? ultimoMensaje.texto : 'Todavía no hay mensajes.';
    boton.appendChild(previa);

    boton.addEventListener('click', function () { abrirHilo(conversacion.id); });

    li.appendChild(boton);
    return li;
  }

  function pintarLista() {
    var lista = document.getElementById('chat-widget-conversaciones');
    var vacio = document.getElementById('chat-widget-vacio');

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
      lista.appendChild(crearFilaConversacion(conversacion));
    });
  }

  function pintarMensajes(conversacionId) {
    var lista = document.getElementById('chat-widget-mensajes');
    lista.innerHTML = '';

    EC.datos.obtenerMensajesDeConversacion(conversacionId).forEach(function (mensaje) {
      var li = document.createElement('li');
      li.className = 'chat-widget__mensaje ' +
        (mensaje.deId === usuarioActual.id ? 'chat-widget__mensaje--propio' : 'chat-widget__mensaje--ajeno');

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

  function mostrarVista(vista) {
    document.getElementById('chat-widget-lista').hidden = vista !== 'lista';
    document.getElementById('chat-widget-hilo').hidden = vista !== 'hilo';
  }

  function abrirPanel() {
    document.getElementById('chat-widget-panel').hidden = false;
  }

  function cerrarPanel() {
    document.getElementById('chat-widget-panel').hidden = true;
  }

  function abrirLista() {
    conversacionAbiertaId = null;
    pintarLista();
    mostrarVista('lista');
    abrirPanel();
  }

  function abrirHilo(conversacionId) {
    var conversacion = EC.datos.obtenerConversacionPorId(conversacionId);
    var pertenece = !!conversacion &&
      (conversacion.propietarioId === usuarioActual.id || conversacion.interesadoId === usuarioActual.id);
    if (!pertenece) return;

    conversacionAbiertaId = conversacionId;

    var otro = otraPersona(conversacion);
    var anuncio = EC.datos.obtenerAnuncioPorId(conversacion.anuncioId);
    document.getElementById('chat-widget-hilo-nombre').textContent = otro ? otro.nombre : 'Usuario eliminado';
    document.getElementById('chat-widget-hilo-anuncio').textContent = anuncio ? anuncio.titulo : 'Anuncio eliminado';

    EC.datos.marcarConversacionLeida(conversacionId, usuarioActual.id);
    pintarBadge();
    pintarMensajes(conversacionId);

    mostrarVista('hilo');
    abrirPanel();

    document.getElementById('chat-widget-texto').focus();
  }

  function enviarMensajeActual(evento) {
    evento.preventDefault();
    if (!conversacionAbiertaId) return;

    var campo = document.getElementById('chat-widget-texto');
    var texto = campo.value.trim();
    if (!texto) return;

    EC.datos.enviarMensaje(conversacionAbiertaId, usuarioActual.id, texto);
    campo.value = '';
    pintarMensajes(conversacionAbiertaId);
  }

  function inicializarEventos() {
    document.getElementById('chat-widget-burbuja').addEventListener('click', function () {
      var panel = document.getElementById('chat-widget-panel');
      if (!panel.hidden) {
        cerrarPanel();
        return;
      }
      if (conversacionAbiertaId) {
        abrirHilo(conversacionAbiertaId);
      } else {
        abrirLista();
      }
    });

    document.getElementById('chat-widget-cerrar').addEventListener('click', cerrarPanel);
    document.getElementById('chat-widget-cerrar-hilo').addEventListener('click', cerrarPanel);
    document.getElementById('chat-widget-volver').addEventListener('click', abrirLista);
    document.getElementById('chat-widget-form').addEventListener('submit', enviarMensajeActual);
  }

  function iniciar() {
    usuarioActual = EC.datos.obtenerUsuarioActual();
    if (!usuarioActual || document.getElementById('chat-widget')) return;

    crearWidget();
    inicializarEventos();
    pintarBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  /* API pública: abre directamente el hilo de una conversación, para que
     por ejemplo el botón "Contactar por chat" del detalle de un anuncio
     abra el widget en vez de navegar a una página de mensajes aparte. */
  EC.chat = {
    abrirConversacion: function (conversacionId) {
      if (!usuarioActual) return;
      abrirHilo(conversacionId);
    }
  };
})(window.EC);
