/* ==========================================================================
   datos.js — cliente de la API REST del backend en Spring Boot.
   Antes esta capa simulaba una base de datos con localStorage; ahora cada
   función de EC.datos hace una petición HTTP al servidor y devuelve una
   Promesa. La sesión la maneja el servidor con una cookie, así que en el
   navegador no se guarda nada.
   ========================================================================== */

window.EC = window.EC || {};

(function (EC) {
  var MAXIMO_FOTOS = 10;
  var promesaSesion = null;

  var MENSAJES_POR_ESTADO = {
    401: 'Tu sesión terminó. Inicia sesión de nuevo.',
    403: 'No tienes permiso para hacer esto.',
    404: 'No se encontró lo que buscabas.',
    413: 'Las fotos son demasiado pesadas.'
  };

  /* Hace una petición a la API y devuelve el JSON de la respuesta (o null
     si no trae cuerpo). Si el servidor responde con error, lanza un Error
     con el mensaje que mandó ({ "error": "..." }) y el código en .status. */
  async function peticion(metodo, url, cuerpo) {
    var opciones = { method: metodo, headers: { Accept: 'application/json' } };
    if (cuerpo instanceof FormData) {
      opciones.body = cuerpo;
    } else if (cuerpo !== undefined) {
      opciones.headers['Content-Type'] = 'application/json';
      opciones.body = JSON.stringify(cuerpo);
    }

    var respuesta = await fetch(url, opciones);
    var datos = null;
    if (respuesta.status !== 204) {
      try {
        datos = await respuesta.json();
      } catch (error) {
        datos = null;
      }
    }

    if (!respuesta.ok) {
      var fallo = new Error(
        (datos && datos.error) || MENSAJES_POR_ESTADO[respuesta.status] || 'Ocurrió un error. Intenta de nuevo.'
      );
      fallo.status = respuesta.status;
      throw fallo;
    }
    return datos;
  }

  /* ===== Utilidades compartidas ===== */

  function escaparHtml(texto) {
    var div = document.createElement('div');
    div.textContent = texto === null || texto === undefined ? '' : String(texto);
    return div.innerHTML;
  }

  var ICONOS_SPECS = {
    area: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
    genero: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>',
    mascota: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="9.5" r="1.8"/><circle cx="10.5" cy="5.5" r="1.8"/><circle cx="15.5" cy="5.5" r="1.8"/><circle cx="19.5" cy="10.5" r="1.8"/><path d="M6 21c-1.5 0-2.5-1.4-2-2.8.8-2.3 3.1-5.2 8-5.2s7.2 2.9 8 5.2c.5 1.4-.5 2.8-2 2.8-2 0-3-1-6-1s-4 1-6 1z"/></svg>',
    amoblado: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4H4z"/><path d="M2 12.5V16a1 1 0 0 0 1 1h1"/><path d="M22 12.5V16a1 1 0 0 1-1 1h-1"/><path d="M4 17v3"/><path d="M20 17v3"/></svg>'
  };

  var TEXTO_GENERO_PERMITIDO = {
    hombres: 'Solo hombres',
    mujeres: 'Solo mujeres',
    todos: 'Todos los géneros'
  };

  function textoGeneroPermitido(valor) { return TEXTO_GENERO_PERMITIDO[valor] || TEXTO_GENERO_PERMITIDO.todos; }

  /* amoblado y mascotas llegan como true / false, o null si no se especificaron. */
  function textoMascotas(valor) {
    if (valor === true) return 'Admite mascotas';
    if (valor === false) return 'No admite mascotas';
    return '';
  }

  function textoAmoblado(valor) {
    if (valor === true) return 'Amoblado';
    if (valor === false) return 'No amoblado';
    return '';
  }

  /* Fila compacta de specs con ícono (m², género permitido, mascotas,
     amoblado) para las tarjetas de anuncio. Devuelve null si el anuncio
     no tiene ninguno de esos datos "notables" (son todos opcionales u
     omiten valores neutros como "todos los géneros"). Los íconos son
     SVG fijos definidos aquí mismo, nunca texto del usuario, así que
     innerHTML es seguro; los valores del anuncio van por textContent. */
  function crearFilaSpecs(anuncio) {
    var specs = [];

    if (anuncio.area !== undefined && anuncio.area !== null && anuncio.area !== '') {
      specs.push({ icono: ICONOS_SPECS.area, texto: anuncio.area + ' m²' });
    }
    if (anuncio.generoPermitido === 'hombres' || anuncio.generoPermitido === 'mujeres') {
      specs.push({ icono: ICONOS_SPECS.genero, texto: textoGeneroPermitido(anuncio.generoPermitido) });
    }
    if (typeof anuncio.mascotas === 'boolean') {
      specs.push({ icono: ICONOS_SPECS.mascota, texto: textoMascotas(anuncio.mascotas) });
    }
    if (typeof anuncio.amoblado === 'boolean') {
      specs.push({ icono: ICONOS_SPECS.amoblado, texto: textoAmoblado(anuncio.amoblado) });
    }

    if (specs.length === 0) return null;

    var contenedor = document.createElement('p');
    contenedor.className = 'anuncio__specs';

    specs.forEach(function (spec) {
      var item = document.createElement('span');
      item.className = 'anuncio__specs-item';

      var icono = document.createElement('span');
      icono.className = 'anuncio__specs-icono';
      icono.setAttribute('aria-hidden', 'true');
      icono.innerHTML = spec.icono;
      item.appendChild(icono);

      var texto = document.createElement('span');
      texto.textContent = spec.texto;
      item.appendChild(texto);

      contenedor.appendChild(item);
    });

    return contenedor;
  }

  var ICONO_VERIFICADO = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><circle cx="12" cy="12" r="10"/><path d="M8 12.3l2.6 2.6L16 9.3" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* Chulito de "usuario verificado" para poner junto a un nombre.
     Ícono SVG fijo definido aquí, nunca texto del usuario. */
  function crearInsigniaVerificado() {
    var span = document.createElement('span');
    span.className = 'insignia-verificado';
    span.setAttribute('aria-label', 'Usuario verificado');
    span.title = 'Usuario verificado';
    span.innerHTML = ICONO_VERIFICADO;
    return span;
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

  var TEXTO_MOTIVO_REPORTE = {
    fraudulento: 'Anuncio fraudulento',
    'informacion-falsa': 'Información falsa',
    'contenido-inapropiado': 'Contenido inapropiado',
    'precio-enganoso': 'Precio engañoso',
    otro: 'Otro motivo'
  };

  function textoTipo(valor) { return TEXTO_TIPO[valor] || valor; }
  function textoCiudad(valor) { return TEXTO_CIUDAD[valor] || valor; }
  function textoEstado(valor) { return TEXTO_ESTADO[valor] || valor; }
  function textoMotivoReporte(valor) { return TEXTO_MOTIVO_REPORTE[valor] || valor; }

  /* URLs de las fotos del anuncio, la portada primero. */
  function obtenerFotos(anuncio) {
    return anuncio.fotos || [];
  }

  /* ===== Sesión y cuenta ===== */

  /* Usuario con sesión iniciada, o null. Se le pregunta al servidor una
     sola vez por página; olvidarSesion() obliga a preguntar de nuevo. */
  function obtenerUsuarioActual() {
    if (!promesaSesion) {
      promesaSesion = peticion('GET', '/api/auth/sesion').catch(function () { return null; });
    }
    return promesaSesion;
  }

  function olvidarSesion() {
    promesaSesion = null;
  }

  function registrar(datos) {
    olvidarSesion();
    return peticion('POST', '/api/auth/registro', datos);
  }

  function acceder(correo, contrasena) {
    olvidarSesion();
    return peticion('POST', '/api/auth/acceder', { correo: correo, contrasena: contrasena });
  }

  function cerrarSesion() {
    olvidarSesion();
    return peticion('POST', '/api/auth/salir');
  }

  function actualizarCuenta(datos) {
    olvidarSesion();
    return peticion('PUT', '/api/cuenta', datos);
  }

  function cambiarContrasena(actual, nueva) {
    return peticion('PUT', '/api/cuenta/contrasena', { actual: actual, nueva: nueva });
  }

  function eliminarCuenta() {
    olvidarSesion();
    return peticion('DELETE', '/api/cuenta');
  }

  function solicitarVerificacion() {
    olvidarSesion();
    return peticion('POST', '/api/cuenta/verificacion');
  }

  function obtenerMisAnuncios() {
    return peticion('GET', '/api/cuenta/anuncios');
  }

  /* ===== Anuncios ===== */

  /* criterios: { q, ciudad, precioMax, tipo, genero, mascotas, amoblado,
     soloFavoritos, orden }. Los que vienen vacíos no se envían.
     Devuelve { total, anuncios }. */
  function buscarAnuncios(criterios) {
    var parametros = new URLSearchParams();
    Object.keys(criterios).forEach(function (clave) {
      var valor = criterios[clave];
      if (valor !== '' && valor !== null && valor !== undefined && valor !== false) {
        parametros.set(clave, String(valor));
      }
    });
    var consulta = parametros.toString();
    return peticion('GET', '/api/anuncios' + (consulta ? '?' + consulta : ''));
  }

  function obtenerAnuncio(id) {
    return peticion('GET', '/api/anuncios/' + encodeURIComponent(id));
  }

  /* Los datos van como JSON en la parte "datos" y las fotos nuevas como
     archivos en la parte "fotos" (multipart/form-data). */
  function formularioAnuncio(datos, fotosNuevas) {
    var formulario = new FormData();
    formulario.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }));
    (fotosNuevas || []).forEach(function (foto, indice) {
      formulario.append('fotos', foto, 'foto-' + (indice + 1) + '.jpg');
    });
    return formulario;
  }

  function crearAnuncio(datos, fotosNuevas) {
    return peticion('POST', '/api/anuncios', formularioAnuncio(datos, fotosNuevas));
  }

  function actualizarAnuncio(id, datos, fotosNuevas) {
    return peticion('PUT', '/api/anuncios/' + encodeURIComponent(id), formularioAnuncio(datos, fotosNuevas));
  }

  function eliminarAnuncio(id) {
    return peticion('DELETE', '/api/anuncios/' + encodeURIComponent(id));
  }

  /* El servidor no cuenta las visitas del propio propietario. */
  function registrarVisita(id) {
    return peticion('POST', '/api/anuncios/' + encodeURIComponent(id) + '/visitas');
  }

  function reportarAnuncio(id, motivo, descripcion) {
    return peticion('POST', '/api/anuncios/' + encodeURIComponent(id) + '/reportes', {
      motivo: motivo,
      descripcion: descripcion
    });
  }

  /* ===== Perfil público ===== */

  function obtenerUsuarioPublico(id) {
    return peticion('GET', '/api/usuarios/' + encodeURIComponent(id));
  }

  function obtenerAnunciosDeUsuario(id) {
    return peticion('GET', '/api/usuarios/' + encodeURIComponent(id) + '/anuncios');
  }

  /* ===== Favoritos (por usuario, requieren sesión) ===== */

  function obtenerFavoritos() {
    return peticion('GET', '/api/favoritos');
  }

  function agregarFavorito(anuncioId) {
    return peticion('PUT', '/api/favoritos/' + encodeURIComponent(anuncioId));
  }

  function quitarFavorito(anuncioId) {
    return peticion('DELETE', '/api/favoritos/' + encodeURIComponent(anuncioId));
  }

  /* ===== Conversaciones y mensajes =====
     La conversación es entre el propietario y el interesado, no por anuncio:
     si el interesado ya le escribió a ese propietario (aunque fuera desde
     otro anuncio suyo), contactar de nuevo la reabre. */

  function obtenerConversaciones() {
    return peticion('GET', '/api/conversaciones');
  }

  function obtenerConversacion(id) {
    return peticion('GET', '/api/conversaciones/' + encodeURIComponent(id));
  }

  function obtenerOCrearConversacion(anuncioId) {
    return peticion('POST', '/api/conversaciones', { anuncioId: anuncioId });
  }

  function obtenerMensajes(conversacionId) {
    return peticion('GET', '/api/conversaciones/' + encodeURIComponent(conversacionId) + '/mensajes');
  }

  function enviarMensaje(conversacionId, texto) {
    return peticion('POST', '/api/conversaciones/' + encodeURIComponent(conversacionId) + '/mensajes', { texto: texto });
  }

  function marcarConversacionLeida(conversacionId) {
    return peticion('PUT', '/api/conversaciones/' + encodeURIComponent(conversacionId) + '/leida');
  }

  function contarConversacionesNoLeidas() {
    return peticion('GET', '/api/conversaciones/no-leidas').then(function (resultado) {
      return resultado.total;
    });
  }

  /* ===== Panel admin ===== */

  var admin = {
    contarPendientes: function () {
      return peticion('GET', '/api/admin/pendientes');
    },
    obtenerAnuncios: function () {
      return peticion('GET', '/api/admin/anuncios');
    },
    obtenerUsuarios: function () {
      return peticion('GET', '/api/admin/usuarios');
    },
    cambiarBloqueo: function (id, bloqueado) {
      return peticion('PUT', '/api/admin/usuarios/' + encodeURIComponent(id) + '/bloqueo', { bloqueado: bloqueado });
    },
    eliminarUsuario: function (id) {
      return peticion('DELETE', '/api/admin/usuarios/' + encodeURIComponent(id));
    },
    obtenerReportes: function () {
      return peticion('GET', '/api/admin/reportes');
    },
    marcarReporteResuelto: function (id) {
      return peticion('PUT', '/api/admin/reportes/' + encodeURIComponent(id) + '/resuelto');
    },
    obtenerVerificaciones: function () {
      return peticion('GET', '/api/admin/verificaciones');
    },
    resolverVerificacion: function (id, aprobar) {
      return peticion('POST', '/api/admin/verificaciones/' + encodeURIComponent(id) + (aprobar ? '/aprobar' : '/rechazar'));
    }
  };

  EC.util = {
    escaparHtml: escaparHtml,
    formatearPrecio: formatearPrecio,
    textoTipo: textoTipo,
    textoCiudad: textoCiudad,
    textoEstado: textoEstado,
    textoMotivoReporte: textoMotivoReporte,
    textoGeneroPermitido: textoGeneroPermitido,
    textoMascotas: textoMascotas,
    textoAmoblado: textoAmoblado,
    obtenerFotos: obtenerFotos,
    crearFilaSpecs: crearFilaSpecs,
    crearInsigniaVerificado: crearInsigniaVerificado,
    MAXIMO_FOTOS: MAXIMO_FOTOS
  };

  EC.datos = {
    obtenerUsuarioActual: obtenerUsuarioActual,
    olvidarSesion: olvidarSesion,
    registrar: registrar,
    acceder: acceder,
    cerrarSesion: cerrarSesion,
    actualizarCuenta: actualizarCuenta,
    cambiarContrasena: cambiarContrasena,
    eliminarCuenta: eliminarCuenta,
    solicitarVerificacion: solicitarVerificacion,
    obtenerMisAnuncios: obtenerMisAnuncios,
    buscarAnuncios: buscarAnuncios,
    obtenerAnuncio: obtenerAnuncio,
    crearAnuncio: crearAnuncio,
    actualizarAnuncio: actualizarAnuncio,
    eliminarAnuncio: eliminarAnuncio,
    registrarVisita: registrarVisita,
    reportarAnuncio: reportarAnuncio,
    obtenerUsuarioPublico: obtenerUsuarioPublico,
    obtenerAnunciosDeUsuario: obtenerAnunciosDeUsuario,
    obtenerFavoritos: obtenerFavoritos,
    agregarFavorito: agregarFavorito,
    quitarFavorito: quitarFavorito,
    obtenerConversaciones: obtenerConversaciones,
    obtenerConversacion: obtenerConversacion,
    obtenerOCrearConversacion: obtenerOCrearConversacion,
    obtenerMensajes: obtenerMensajes,
    enviarMensaje: enviarMensaje,
    marcarConversacionLeida: marcarConversacionLeida,
    contarConversacionesNoLeidas: contarConversacionesNoLeidas,
    admin: admin
  };
})(window.EC);
