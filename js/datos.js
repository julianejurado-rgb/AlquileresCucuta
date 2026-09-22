/* ==========================================================================
   datos.js — capa de datos del sitio (usuarios, sesión y anuncios).
   Simula una base de datos y un backend usando localStorage, ya que el
   proyecto no tiene servidor. No es seguro para producción real: en un
   backend real las contraseñas se validan y se hashean en el servidor.
   ========================================================================== */

window.EC = window.EC || {};

(function (EC) {
  var CLAVE_USUARIOS = 'ec_usuarios';
  var CLAVE_ANUNCIOS = 'ec_anuncios';
  var CLAVE_SESION = 'ec_sesion_id';
  var CLAVE_CONVERSACIONES = 'ec_conversaciones';
  var CLAVE_MENSAJES = 'ec_mensajes';

  function leer(clave, porDefecto) {
    try {
      var datos = localStorage.getItem(clave);
      return datos ? JSON.parse(datos) : porDefecto;
    } catch (error) {
      return porDefecto;
    }
  }

  function guardar(clave, valor) {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
      return true;
    } catch (error) {
      return false;
    }
  }

  function generarId(prefijo) {
    return prefijo + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  /* Hash simple, solo para no guardar contraseñas en texto plano en la demo.
     No sustituye un hash criptográfico real (bcrypt, etc. en un backend). */
  function hashSimple(texto) {
    var hash = 0;
    for (var i = 0; i < texto.length; i++) {
      hash = (hash << 5) - hash + texto.charCodeAt(i);
      hash |= 0;
    }
    return 'h' + Math.abs(hash).toString(36);
  }

  /* ===== Utilidades compartidas ===== */

  function escaparHtml(texto) {
    var div = document.createElement('div');
    div.textContent = texto === null || texto === undefined ? '' : String(texto);
    return div.innerHTML;
  }

  function formatearPrecio(numero) {
    var valor = Number(numero) || 0;
    return '$' + valor.toLocaleString('es-CO');
  }

  var TEXTO_TIPO = {
    apartaestudio: 'Apartaestudio',
    habitacion: 'Habitación',
    apartamento: 'Apartamento pequeño'
  };

  var TEXTO_CIUDAD = {
    cucuta: 'Cúcuta',
    'villa-del-rosario': 'Villa del Rosario',
    'los-patios': 'Los Patios'
  };

  var TEXTO_ESTADO = {
    disponible: 'Disponible',
    reservado: 'Reservado',
    alquilado: 'Alquilado'
  };

  function textoTipo(valor) { return TEXTO_TIPO[valor] || valor; }
  function textoCiudad(valor) { return TEXTO_CIUDAD[valor] || valor; }
  function textoEstado(valor) { return TEXTO_ESTADO[valor] || valor; }

  /* ===== Usuarios ===== */

  function obtenerUsuarios() {
    return leer(CLAVE_USUARIOS, null) || [];
  }

  function guardarUsuarios(usuarios) {
    guardar(CLAVE_USUARIOS, usuarios);
  }

  function sembrarAdministrador() {
    var existentes = leer(CLAVE_USUARIOS, null);
    if (existentes !== null) return;

    var admin = {
      id: generarId('usuario'),
      nombre: 'Administrador',
      correo: 'admin@estudiocucuta.com',
      contrasena: hashSimple('admin123'),
      rol: 'administrador',
      bloqueado: false
    };
    guardarUsuarios([admin]);
  }

  function obtenerUsuarioPorCorreo(correo) {
    var buscado = String(correo || '').trim().toLowerCase();
    var encontrado = null;
    obtenerUsuarios().forEach(function (usuario) {
      if (usuario.correo.toLowerCase() === buscado) encontrado = usuario;
    });
    return encontrado;
  }

  function obtenerUsuarioPorId(id) {
    var encontrado = null;
    obtenerUsuarios().forEach(function (usuario) {
      if (usuario.id === id) encontrado = usuario;
    });
    return encontrado;
  }

  function crearUsuario(nombre, correo, contrasena) {
    if (obtenerUsuarioPorCorreo(correo)) {
      return { ok: false, error: 'Ya existe una cuenta registrada con ese correo.' };
    }
    var usuarios = obtenerUsuarios();
    var usuario = {
      id: generarId('usuario'),
      nombre: String(nombre).trim(),
      correo: String(correo).trim().toLowerCase(),
      contrasena: hashSimple(contrasena),
      rol: 'usuario',
      bloqueado: false
    };
    usuarios.push(usuario);
    guardarUsuarios(usuarios);
    return { ok: true, usuario: usuario };
  }

  function validarCredenciales(correo, contrasena) {
    var usuario = obtenerUsuarioPorCorreo(correo);
    if (!usuario || usuario.contrasena !== hashSimple(contrasena)) {
      return null;
    }
    return usuario;
  }

  function cambiarContrasena(id, nuevaContrasena) {
    return actualizarUsuario(id, { contrasena: hashSimple(nuevaContrasena) });
  }

  function actualizarUsuario(id, cambios) {
    var usuarios = obtenerUsuarios();
    var actualizado = false;
    usuarios = usuarios.map(function (usuario) {
      if (usuario.id !== id) return usuario;
      actualizado = true;
      var copia = {};
      for (var clave in usuario) copia[clave] = usuario[clave];
      for (var claveCambio in cambios) copia[claveCambio] = cambios[claveCambio];
      return copia;
    });
    if (actualizado) guardarUsuarios(usuarios);
    return actualizado;
  }

  function eliminarUsuario(id) {
    guardarUsuarios(obtenerUsuarios().filter(function (usuario) { return usuario.id !== id; }));
    guardarAnuncios(obtenerAnuncios().filter(function (anuncio) { return anuncio.propietarioId !== id; }));
  }

  /* ===== Sesión ===== */

  function iniciarSesion(usuarioId) {
    guardar(CLAVE_SESION, usuarioId);
  }

  function cerrarSesion() {
    try { localStorage.removeItem(CLAVE_SESION); } catch (error) { /* nada que hacer */ }
  }

  function obtenerUsuarioActual() {
    var id = leer(CLAVE_SESION, null);
    if (!id) return null;
    var usuario = obtenerUsuarioPorId(id);
    if (usuario && usuario.bloqueado) return null;
    return usuario;
  }

  /* ===== Anuncios ===== */

  function obtenerAnuncios() {
    return leer(CLAVE_ANUNCIOS, []);
  }

  /* Igual que obtenerAnuncios(), pero sin los anuncios de usuarios
     bloqueados. Es lo que deben usar las vistas públicas (listado y
     detalle); el panel admin usa obtenerAnuncios() para poder seguir
     moderando esos anuncios. */
  function obtenerAnunciosPublicos() {
    return obtenerAnuncios().filter(function (anuncio) {
      var propietario = obtenerUsuarioPorId(anuncio.propietarioId);
      return !!propietario && !propietario.bloqueado;
    });
  }

  function guardarAnuncios(anuncios) {
    guardar(CLAVE_ANUNCIOS, anuncios);
  }

  function obtenerAnuncioPorId(id) {
    var encontrado = null;
    obtenerAnuncios().forEach(function (anuncio) {
      if (anuncio.id === id) encontrado = anuncio;
    });
    return encontrado;
  }

  function crearAnuncio(datos) {
    var anuncios = obtenerAnuncios();
    var anuncio = {
      id: generarId('anuncio'),
      fechaPublicacion: new Date().toISOString()
    };
    for (var clave in datos) anuncio[clave] = datos[clave];
    anuncios.unshift(anuncio);
    guardarAnuncios(anuncios);
    return anuncio;
  }

  function actualizarAnuncio(id, cambios) {
    var anuncios = obtenerAnuncios();
    var actualizado = false;
    anuncios = anuncios.map(function (anuncio) {
      if (anuncio.id !== id) return anuncio;
      actualizado = true;
      var copia = {};
      for (var clave in anuncio) copia[clave] = anuncio[clave];
      for (var claveCambio in cambios) copia[claveCambio] = cambios[claveCambio];
      return copia;
    });
    if (actualizado) guardarAnuncios(anuncios);
    return actualizado;
  }

  function eliminarAnuncio(id) {
    guardarAnuncios(obtenerAnuncios().filter(function (anuncio) { return anuncio.id !== id; }));
  }

  /* ===== Conversaciones y mensajes =====
     Chat simulado con localStorage: solo funciona dentro de un mismo
     navegador (no hay servidor que reciba mensajes de otra persona en
     otro computador). Cada conversación queda ligada a un anuncio y
     al usuario interesado; el otro participante siempre es el dueño
     del anuncio en ese momento. */

  function obtenerConversaciones() {
    return leer(CLAVE_CONVERSACIONES, []);
  }

  function guardarConversaciones(conversaciones) {
    guardar(CLAVE_CONVERSACIONES, conversaciones);
  }

  function obtenerConversacionPorId(id) {
    var encontrada = null;
    obtenerConversaciones().forEach(function (conversacion) {
      if (conversacion.id === id) encontrada = conversacion;
    });
    return encontrada;
  }

  function obtenerConversacionesDeUsuario(usuarioId) {
    return obtenerConversaciones().filter(function (conversacion) {
      return conversacion.propietarioId === usuarioId || conversacion.interesadoId === usuarioId;
    });
  }

  function obtenerOCrearConversacion(anuncioId, interesadoId) {
    var anuncio = obtenerAnuncioPorId(anuncioId);
    if (!anuncio || anuncio.propietarioId === interesadoId) return null;

    var conversaciones = obtenerConversaciones();
    var existente = null;
    conversaciones.forEach(function (conversacion) {
      if (conversacion.anuncioId === anuncioId && conversacion.interesadoId === interesadoId) {
        existente = conversacion;
      }
    });
    if (existente) return existente;

    var nueva = {
      id: generarId('conversacion'),
      anuncioId: anuncioId,
      propietarioId: anuncio.propietarioId,
      interesadoId: interesadoId,
      creada: new Date().toISOString()
    };
    conversaciones.push(nueva);
    guardarConversaciones(conversaciones);
    return nueva;
  }

  function obtenerMensajes() {
    return leer(CLAVE_MENSAJES, []);
  }

  function guardarMensajes(mensajes) {
    guardar(CLAVE_MENSAJES, mensajes);
  }

  function obtenerMensajesDeConversacion(conversacionId) {
    return obtenerMensajes()
      .filter(function (mensaje) { return mensaje.conversacionId === conversacionId; })
      .sort(function (a, b) { return new Date(a.fecha) - new Date(b.fecha); });
  }

  function enviarMensaje(conversacionId, deId, texto) {
    var limpio = String(texto || '').trim();
    if (!limpio) return null;

    var mensajes = obtenerMensajes();
    var mensaje = {
      id: generarId('mensaje'),
      conversacionId: conversacionId,
      deId: deId,
      texto: limpio,
      fecha: new Date().toISOString(),
      leido: false
    };
    mensajes.push(mensaje);
    guardarMensajes(mensajes);
    return mensaje;
  }

  function marcarConversacionLeida(conversacionId, usuarioId) {
    var mensajes = obtenerMensajes();
    var cambio = false;
    mensajes = mensajes.map(function (mensaje) {
      if (mensaje.conversacionId !== conversacionId || mensaje.deId === usuarioId || mensaje.leido) {
        return mensaje;
      }
      cambio = true;
      var copia = {};
      for (var clave in mensaje) copia[clave] = mensaje[clave];
      copia.leido = true;
      return copia;
    });
    if (cambio) guardarMensajes(mensajes);
  }

  function contarConversacionesConNoLeidos(usuarioId) {
    var mensajes = obtenerMensajes();
    var contador = 0;
    obtenerConversacionesDeUsuario(usuarioId).forEach(function (conversacion) {
      var tieneNoLeido = mensajes.some(function (mensaje) {
        return mensaje.conversacionId === conversacion.id && mensaje.deId !== usuarioId && !mensaje.leido;
      });
      if (tieneNoLeido) contador++;
    });
    return contador;
  }

  sembrarAdministrador();

  EC.util = {
    escaparHtml: escaparHtml,
    formatearPrecio: formatearPrecio,
    textoTipo: textoTipo,
    textoCiudad: textoCiudad,
    textoEstado: textoEstado
  };

  EC.datos = {
    obtenerUsuarios: obtenerUsuarios,
    obtenerUsuarioPorCorreo: obtenerUsuarioPorCorreo,
    obtenerUsuarioPorId: obtenerUsuarioPorId,
    crearUsuario: crearUsuario,
    validarCredenciales: validarCredenciales,
    actualizarUsuario: actualizarUsuario,
    cambiarContrasena: cambiarContrasena,
    eliminarUsuario: eliminarUsuario,
    iniciarSesion: iniciarSesion,
    cerrarSesion: cerrarSesion,
    obtenerUsuarioActual: obtenerUsuarioActual,
    obtenerAnuncios: obtenerAnuncios,
    obtenerAnunciosPublicos: obtenerAnunciosPublicos,
    obtenerAnuncioPorId: obtenerAnuncioPorId,
    crearAnuncio: crearAnuncio,
    actualizarAnuncio: actualizarAnuncio,
    eliminarAnuncio: eliminarAnuncio,
    obtenerConversacionPorId: obtenerConversacionPorId,
    obtenerConversacionesDeUsuario: obtenerConversacionesDeUsuario,
    obtenerOCrearConversacion: obtenerOCrearConversacion,
    obtenerMensajesDeConversacion: obtenerMensajesDeConversacion,
    enviarMensaje: enviarMensaje,
    marcarConversacionLeida: marcarConversacionLeida,
    contarConversacionesConNoLeidos: contarConversacionesConNoLeidos
  };
})(window.EC);
