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
  var CLAVE_REPORTES = 'ec_reportes';
  var MAXIMO_FOTOS = 10;

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

  var ICONOS_SPECS = {
    area: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
    genero: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>',
    mascota: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="9.5" r="1.8"/><circle cx="10.5" cy="5.5" r="1.8"/><circle cx="15.5" cy="5.5" r="1.8"/><circle cx="19.5" cy="10.5" r="1.8"/><path d="M6 21c-1.5 0-2.5-1.4-2-2.8.8-2.3 3.1-5.2 8-5.2s7.2 2.9 8 5.2c.5 1.4-.5 2.8-2 2.8-2 0-3-1-6-1s-4 1-6 1z"/></svg>'
  };

  var TEXTO_GENERO_PERMITIDO = {
    hombres: 'Solo hombres',
    mujeres: 'Solo mujeres',
    todos: 'Todos los géneros'
  };

  var TEXTO_MASCOTAS = {
    si: 'Admite mascotas',
    no: 'No admite mascotas'
  };

  function textoGeneroPermitido(valor) { return TEXTO_GENERO_PERMITIDO[valor] || TEXTO_GENERO_PERMITIDO.todos; }
  function textoMascotas(valor) { return TEXTO_MASCOTAS[valor] || ''; }

  /* Fila compacta de specs con ícono (m², género permitido, mascotas)
     para las tarjetas de anuncio. Devuelve null si el anuncio no tiene
     ninguno de esos datos "notables" (son todos opcionales u omiten
     valores neutros como "todos los géneros"). Los íconos son SVG fijos
     definidos aquí mismo, nunca texto del usuario, así que innerHTML
     es seguro; los valores del anuncio van por textContent. */
  function crearFilaSpecs(anuncio) {
    var specs = [];

    if (anuncio.area !== undefined && anuncio.area !== null && anuncio.area !== '') {
      specs.push({ icono: ICONOS_SPECS.area, texto: anuncio.area + ' m²' });
    }
    if (anuncio.generoPermitido === 'hombres' || anuncio.generoPermitido === 'mujeres') {
      specs.push({ icono: ICONOS_SPECS.genero, texto: textoGeneroPermitido(anuncio.generoPermitido) });
    }
    if (anuncio.mascotas === 'si' || anuncio.mascotas === 'no') {
      specs.push({ icono: ICONOS_SPECS.mascota, texto: textoMascotas(anuncio.mascotas) });
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

  /* Devuelve siempre un arreglo de fotos, sin importar si el anuncio
     todavía tiene el campo viejo "foto" (una sola) o el nuevo "fotos"
     (hasta 10). Así las páginas no necesitan saber cuál usa cada uno. */
  function obtenerFotos(anuncio) {
    if (anuncio.fotos && anuncio.fotos.length) return anuncio.fotos;
    if (anuncio.foto) return [anuncio.foto];
    return [];
  }

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

  function crearUsuario(nombre, correo, contrasena, genero) {
    if (obtenerUsuarioPorCorreo(correo)) {
      return { ok: false, error: 'Ya existe una cuenta registrada con ese correo.' };
    }
    var usuarios = obtenerUsuarios();
    var usuario = {
      id: generarId('usuario'),
      nombre: String(nombre).trim(),
      correo: String(correo).trim().toLowerCase(),
      contrasena: hashSimple(contrasena),
      genero: genero,
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
    var anunciosDelUsuario = obtenerAnuncios()
      .filter(function (anuncio) { return anuncio.propietarioId === id; })
      .map(function (anuncio) { return anuncio.id; });

    guardarUsuarios(obtenerUsuarios().filter(function (usuario) { return usuario.id !== id; }));
    guardarAnuncios(obtenerAnuncios().filter(function (anuncio) { return anuncio.propietarioId !== id; }));
    guardarReportes(obtenerReportes().filter(function (reporte) {
      return reporte.reportadoPorId !== id && anunciosDelUsuario.indexOf(reporte.anuncioId) === -1;
    }));
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

  function obtenerAnunciosDeUsuario(usuarioId) {
    return obtenerAnuncios().filter(function (anuncio) { return anuncio.propietarioId === usuarioId; });
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
    guardarReportes(obtenerReportes().filter(function (reporte) { return reporte.anuncioId !== id; }));
  }

  /* Suma una visita al contador del anuncio. Quien llama decide cuándo
     (por ejemplo, anuncio-detalle.js no cuenta las visitas del propio
     dueño para no inflar su propia estadística). */
  function registrarVisita(anuncioId) {
    var anuncios = obtenerAnuncios();
    var actualizado = false;
    anuncios = anuncios.map(function (anuncio) {
      if (anuncio.id !== anuncioId) return anuncio;
      actualizado = true;
      var copia = {};
      for (var clave in anuncio) copia[clave] = anuncio[clave];
      copia.visitas = (copia.visitas || 0) + 1;
      return copia;
    });
    if (actualizado) guardarAnuncios(anuncios);
  }

  /* ===== Conversaciones y mensajes =====
     Chat simulado con localStorage: solo funciona dentro de un mismo
     navegador (no hay servidor que reciba mensajes de otra persona en
     otro computador). La conversación es entre dos personas, no por
     anuncio: si ya existe una conversación entre ese mismo par de
     usuarios (sin importar desde qué anuncio se originó), contactar de
     nuevo reabre esa misma conversación en vez de crear una nueva.
     anuncioId solo queda guardado como referencia del anuncio con el
     que arrancó la conversación (para mostrar "Sobre: ..." y para el
     contador de contactos por anuncio). */

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

  /* Conversaciones que se originaron a partir de este anuncio en
     particular (se usa para el contador de "contactos" de ese anuncio
     en Mis publicaciones). Como ahora la conversación es por persona y
     no por anuncio, si dos personas ya se habían contactado antes por
     otro anuncio, ese contacto nuevo reabre la conversación vieja y no
     cuenta aquí; es una aproximación razonable, no un conteo exacto. */
  function obtenerConversacionesDeAnuncio(anuncioId) {
    return obtenerConversaciones().filter(function (conversacion) {
      return conversacion.anuncioId === anuncioId;
    });
  }

  function obtenerOCrearConversacion(anuncioId, interesadoId) {
    var anuncio = obtenerAnuncioPorId(anuncioId);
    if (!anuncio || anuncio.propietarioId === interesadoId) return null;

    var conversaciones = obtenerConversaciones();
    var existente = null;
    conversaciones.forEach(function (conversacion) {
      var mismaPareja =
        (conversacion.propietarioId === anuncio.propietarioId && conversacion.interesadoId === interesadoId) ||
        (conversacion.propietarioId === interesadoId && conversacion.interesadoId === anuncio.propietarioId);
      if (mismaPareja) existente = conversacion;
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

  /* Migración: fusiona conversaciones duplicadas entre el mismo par de
     personas que hayan quedado de antes de este cambio (cuando existía
     una conversación distinta por cada anuncio). Se ejecuta una vez al
     cargar la página; si no hay duplicados no hace nada. De cada grupo
     conserva la conversación más antigua y le reasigna los mensajes de
     las demás antes de eliminarlas. */
  function fusionarConversacionesDuplicadas() {
    var conversaciones = obtenerConversaciones();
    if (conversaciones.length < 2) return;

    var grupos = {};
    conversaciones.forEach(function (conversacion) {
      var par = [conversacion.propietarioId, conversacion.interesadoId].sort().join('|');
      if (!grupos[par]) grupos[par] = [];
      grupos[par].push(conversacion);
    });

    var mensajes = obtenerMensajes();
    var idsAEliminar = [];
    var huboFusion = false;

    Object.keys(grupos).forEach(function (par) {
      var grupo = grupos[par];
      if (grupo.length < 2) return;
      huboFusion = true;

      grupo.sort(function (a, b) { return new Date(a.creada) - new Date(b.creada); });
      var principal = grupo[0];

      grupo.slice(1).forEach(function (duplicada) {
        mensajes = mensajes.map(function (mensaje) {
          if (mensaje.conversacionId !== duplicada.id) return mensaje;
          var copia = {};
          for (var clave in mensaje) copia[clave] = mensaje[clave];
          copia.conversacionId = principal.id;
          return copia;
        });
        idsAEliminar.push(duplicada.id);
      });
    });

    if (!huboFusion) return;

    guardarConversaciones(conversaciones.filter(function (conversacion) {
      return idsAEliminar.indexOf(conversacion.id) === -1;
    }));
    guardarMensajes(mensajes);
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

  /* ===== Reportes =====
     Cuando un usuario reporta un anuncio, queda "pendiente" hasta que
     un administrador lo revise desde el panel admin. */

  function obtenerReportes() {
    return leer(CLAVE_REPORTES, []);
  }

  function guardarReportes(reportes) {
    guardar(CLAVE_REPORTES, reportes);
  }

  function obtenerReportePorId(id) {
    var encontrado = null;
    obtenerReportes().forEach(function (reporte) {
      if (reporte.id === id) encontrado = reporte;
    });
    return encontrado;
  }

  function obtenerReportesPendientes() {
    return obtenerReportes().filter(function (reporte) { return reporte.estado === 'pendiente'; });
  }

  function contarReportesPendientes() {
    return obtenerReportesPendientes().length;
  }

  function yaReportado(anuncioId, usuarioId) {
    return obtenerReportes().some(function (reporte) {
      return reporte.anuncioId === anuncioId && reporte.reportadoPorId === usuarioId && reporte.estado === 'pendiente';
    });
  }

  function crearReporte(anuncioId, reportadoPorId, motivo, descripcion) {
    if (yaReportado(anuncioId, reportadoPorId)) {
      return { ok: false, error: 'Ya reportaste este anuncio. Está pendiente de revisión.' };
    }
    var reportes = obtenerReportes();
    var reporte = {
      id: generarId('reporte'),
      anuncioId: anuncioId,
      reportadoPorId: reportadoPorId,
      motivo: motivo,
      descripcion: String(descripcion || '').trim(),
      fecha: new Date().toISOString(),
      estado: 'pendiente'
    };
    reportes.push(reporte);
    guardarReportes(reportes);
    return { ok: true, reporte: reporte };
  }

  function marcarReporteResuelto(id) {
    var reportes = obtenerReportes();
    var actualizado = false;
    reportes = reportes.map(function (reporte) {
      if (reporte.id !== id) return reporte;
      actualizado = true;
      var copia = {};
      for (var clave in reporte) copia[clave] = reporte[clave];
      copia.estado = 'resuelto';
      return copia;
    });
    if (actualizado) guardarReportes(reportes);
    return actualizado;
  }

  sembrarAdministrador();
  fusionarConversacionesDuplicadas();

  EC.util = {
    escaparHtml: escaparHtml,
    formatearPrecio: formatearPrecio,
    textoTipo: textoTipo,
    textoCiudad: textoCiudad,
    textoEstado: textoEstado,
    textoMotivoReporte: textoMotivoReporte,
    textoGeneroPermitido: textoGeneroPermitido,
    textoMascotas: textoMascotas,
    obtenerFotos: obtenerFotos,
    crearFilaSpecs: crearFilaSpecs,
    MAXIMO_FOTOS: MAXIMO_FOTOS
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
    obtenerAnunciosDeUsuario: obtenerAnunciosDeUsuario,
    obtenerAnuncioPorId: obtenerAnuncioPorId,
    crearAnuncio: crearAnuncio,
    actualizarAnuncio: actualizarAnuncio,
    eliminarAnuncio: eliminarAnuncio,
    registrarVisita: registrarVisita,
    obtenerConversacionPorId: obtenerConversacionPorId,
    obtenerConversacionesDeUsuario: obtenerConversacionesDeUsuario,
    obtenerConversacionesDeAnuncio: obtenerConversacionesDeAnuncio,
    obtenerOCrearConversacion: obtenerOCrearConversacion,
    obtenerMensajesDeConversacion: obtenerMensajesDeConversacion,
    enviarMensaje: enviarMensaje,
    marcarConversacionLeida: marcarConversacionLeida,
    contarConversacionesConNoLeidos: contarConversacionesConNoLeidos,
    obtenerReportes: obtenerReportes,
    obtenerReportePorId: obtenerReportePorId,
    obtenerReportesPendientes: obtenerReportesPendientes,
    contarReportesPendientes: contarReportesPendientes,
    yaReportado: yaReportado,
    crearReporte: crearReporte,
    marcarReporteResuelto: marcarReporteResuelto
  };
})(window.EC);
