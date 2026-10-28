/* ==========================================================================
   anuncio-detalle.js — renderiza el detalle de un anuncio (anuncio.html)
   según el parámetro ?id= de la URL. Debe cargarse después de datos.js
   y favoritos.js.
   ========================================================================== */

(function (EC) {
  function obtenerParametroId() {
    var params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  /* Enlace para escribir por WhatsApp con un mensaje ya escrito. Solo para
     celulares de Colombia (10 dígitos que empiezan por 3, con o sin el 57
     adelante): un teléfono fijo no tiene WhatsApp, así que devuelve null. */
  function crearUrlWhatsApp(telefono, titulo) {
    var digitos = telefono.replace(/\D/g, '');
    if (digitos.length === 12 && digitos.indexOf('57') === 0) digitos = digitos.slice(2);
    if (digitos.length !== 10 || digitos.charAt(0) !== '3') return null;

    var mensaje = 'Hola, vi tu anuncio "' + titulo + '" en EstudioCúcuta y me interesa.';
    return 'https://wa.me/57' + digitos + '?text=' + encodeURIComponent(mensaje);
  }

  function pintarContacto(anuncio) {
    var propietario = anuncio.propietario;
    var contacto = document.getElementById('pub-contacto');
    contacto.innerHTML = '';

    if (!propietario) {
      contacto.textContent = 'El propietario de este anuncio ya no está disponible.';
      return;
    }

    var linea1 = document.createElement('span');
    linea1.textContent = 'Propietario: ';
    var enlacePropietario = document.createElement('a');
    enlacePropietario.href = 'propietario.html?id=' + encodeURIComponent(propietario.id);
    enlacePropietario.textContent = propietario.nombre;
    linea1.appendChild(enlacePropietario);
    if (propietario.verificado) linea1.appendChild(EC.util.crearInsigniaVerificado());
    contacto.appendChild(linea1);

    var linea2 = document.createElement('span');
    linea2.textContent = 'Correo: ';
    var enlaceCorreo = document.createElement('a');
    enlaceCorreo.href = 'mailto:' + propietario.correo;
    enlaceCorreo.textContent = propietario.correo;
    linea2.appendChild(enlaceCorreo);
    contacto.appendChild(linea2);

    if (anuncio.telefono) {
      var linea3 = document.createElement('span');
      linea3.textContent = 'Teléfono: ';
      var enlaceTel = document.createElement('a');
      enlaceTel.href = 'tel:' + anuncio.telefono;
      enlaceTel.textContent = anuncio.telefono;
      linea3.appendChild(enlaceTel);
      contacto.appendChild(linea3);

      var urlWhatsApp = crearUrlWhatsApp(anuncio.telefono, anuncio.titulo);
      if (urlWhatsApp) {
        var enlaceWhatsApp = document.createElement('a');
        enlaceWhatsApp.href = urlWhatsApp;
        enlaceWhatsApp.target = '_blank';
        enlaceWhatsApp.rel = 'noopener';
        enlaceWhatsApp.className = 'contacto__whatsapp';
        enlaceWhatsApp.textContent = 'Escribir por WhatsApp';
        contacto.appendChild(enlaceWhatsApp);
      }
    }
  }

  function pintarAcciones(anuncio, usuarioActual) {
    if (!usuarioActual) return;

    var esDueno = !!anuncio.propietario && usuarioActual.id === anuncio.propietario.id;
    var esAdmin = usuarioActual.rol === 'administrador';
    if (!esDueno && !esAdmin) return;

    document.getElementById('acciones-propietario').hidden = false;

    var botonEditar = document.getElementById('pub-editar');
    if (esDueno) {
      botonEditar.hidden = false;
      botonEditar.href = 'publicar.html?id=' + encodeURIComponent(anuncio.id);
    } else {
      botonEditar.hidden = true;
    }

    document.getElementById('pub-eliminar').addEventListener('click', async function () {
      if (!window.confirm('¿Eliminar este anuncio? Esta acción no se puede deshacer.')) return;
      try {
        await EC.datos.eliminarAnuncio(anuncio.id);
        window.location.href = 'index.html';
      } catch (error) {
        window.alert(error.message);
      }
    });
  }

  function pintarGaleria(anuncio) {
    var contenedor = document.getElementById('pub-foto-contenedor');
    var fotoPrincipal = document.getElementById('pub-foto');
    var miniaturas = document.getElementById('pub-galeria-miniaturas');
    var fotos = EC.util.obtenerFotos(anuncio);

    miniaturas.innerHTML = '';

    if (fotos.length === 0) {
      contenedor.hidden = true;
      return;
    }
    contenedor.hidden = false;

    fotoPrincipal.src = fotos[0];
    fotoPrincipal.alt = anuncio.titulo;

    if (fotos.length === 1) return;

    fotos.forEach(function (foto, indice) {
      var li = document.createElement('li');
      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'miniatura' + (indice === 0 ? ' miniatura--activa' : '');

      var img = document.createElement('img');
      img.src = foto;
      img.alt = 'Foto ' + (indice + 1) + ' de ' + anuncio.titulo;
      boton.appendChild(img);

      boton.addEventListener('click', function () {
        fotoPrincipal.src = foto;
        miniaturas.querySelectorAll('.miniatura').forEach(function (m) {
          m.classList.remove('miniatura--activa');
        });
        boton.classList.add('miniatura--activa');
      });

      li.appendChild(boton);
      miniaturas.appendChild(li);
    });
  }

  function mostrarFilaOpcional(idFila, idValor, valor, textoSingular, textoPlural) {
    var fila = document.getElementById(idFila);
    if (valor === undefined || valor === null || valor === '') {
      fila.hidden = true;
      return;
    }
    fila.hidden = false;
    var sufijo = Number(valor) === 1 ? textoSingular : textoPlural;
    document.getElementById(idValor).textContent = valor + (sufijo || '');
  }

  /* amoblado y mascotas: true / false, o null si no se especificaron. */
  function mostrarFilaSiNo(idFila, idValor, valor, textoFn) {
    var fila = document.getElementById(idFila);
    if (typeof valor === 'boolean') {
      fila.hidden = false;
      document.getElementById(idValor).textContent = textoFn(valor);
    } else {
      fila.hidden = true;
    }
  }

  function pintarFichaOpcional(anuncio) {
    mostrarFilaOpcional('fila-area', 'pub-area', anuncio.area, ' m²', ' m²');
    mostrarFilaSiNo('fila-amoblado', 'pub-amoblado', anuncio.amoblado, EC.util.textoAmoblado);
    document.getElementById('pub-genero').textContent = EC.util.textoGeneroPermitido(anuncio.generoPermitido);
    mostrarFilaSiNo('fila-mascotas', 'pub-mascotas', anuncio.mascotas, EC.util.textoMascotas);

    document.getElementById('pub-visualizaciones').textContent = anuncio.visitas || 0;
  }

  function pintarReportar(anuncio, usuarioActual) {
    var boton = document.getElementById('pub-reportar-boton');
    var mensaje = document.getElementById('pub-reportar-mensaje');
    var formulario = document.getElementById('form-reportar');

    if (!usuarioActual || (anuncio.propietario && usuarioActual.id === anuncio.propietario.id)) return;

    if (anuncio.reportadoPorMi) {
      mensaje.textContent = 'Ya reportaste este anuncio. Está pendiente de revisión.';
      mensaje.hidden = false;
      return;
    }

    boton.hidden = false;
    boton.addEventListener('click', function () {
      boton.hidden = true;
      formulario.hidden = false;
    });

    document.getElementById('reportar-cancelar').addEventListener('click', function () {
      formulario.hidden = true;
      boton.hidden = false;
    });

    formulario.addEventListener('submit', async function (evento) {
      evento.preventDefault();
      var motivo = document.getElementById('reportar-motivo').value;
      var descripcion = document.getElementById('reportar-descripcion').value;
      if (!motivo) return;

      try {
        await EC.datos.reportarAnuncio(anuncio.id, motivo, descripcion);
        mensaje.textContent = 'Gracias, recibimos tu reporte. Un administrador lo va a revisar.';
      } catch (error) {
        mensaje.textContent = error.message;
      }
      formulario.hidden = true;
      mensaje.hidden = false;
    });
  }

  function pintarContactar(anuncio, usuarioActual) {
    var boton = document.getElementById('pub-contactar');
    var ayuda = document.getElementById('pub-contactar-ayuda');

    if (!usuarioActual) {
      ayuda.hidden = false;
      return;
    }
    if (anuncio.propietario && usuarioActual.id === anuncio.propietario.id) return;

    boton.hidden = false;
    boton.addEventListener('click', async function () {
      try {
        var conversacion = await EC.datos.obtenerOCrearConversacion(anuncio.id);
        if (EC.chat) EC.chat.abrirConversacion(conversacion.id);
      } catch (error) {
        window.alert(error.message);
      }
    });
  }

  function pintar(anuncio, usuarioActual) {
    document.title = anuncio.titulo + ' — EstudioCúcuta';

    document.getElementById('pub-titulo').textContent = anuncio.titulo;
    document.getElementById('pub-precio').textContent = EC.util.formatearPrecio(anuncio.precio);

    var estadoEl = document.getElementById('pub-estado');
    estadoEl.textContent = EC.util.textoEstado(anuncio.estado);
    estadoEl.className = 'estado estado--' + anuncio.estado;

    document.getElementById('pub-favorito').setAttribute('data-id', anuncio.id);

    pintarGaleria(anuncio);

    document.getElementById('pub-descripcion').textContent = anuncio.descripcion;
    document.getElementById('pub-tipo').textContent = EC.util.textoTipo(anuncio.tipo);
    document.getElementById('pub-ciudad').textContent = EC.util.textoCiudad(anuncio.ciudad);
    document.getElementById('pub-barrio').textContent = anuncio.barrio;

    var fecha = new Date(anuncio.fechaPublicacion);
    document.getElementById('pub-fecha').textContent = fecha.toLocaleDateString('es-CO', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    pintarFichaOpcional(anuncio);

    pintarContacto(anuncio);
    pintarAcciones(anuncio, usuarioActual);
    pintarContactar(anuncio, usuarioActual);
    pintarReportar(anuncio, usuarioActual);

    /* El servidor decide si cuenta la visita (no cuenta las del propietario). */
    EC.datos.registrarVisita(anuncio.id).catch(function () { /* no es grave si falla */ });
  }

  async function iniciar() {
    var id = obtenerParametroId();
    var anuncio = null;
    if (id) {
      try {
        anuncio = await EC.datos.obtenerAnuncio(id);
      } catch (error) {
        anuncio = null;
      }
    }

    if (!anuncio) {
      document.getElementById('no-encontrado').hidden = false;
      return;
    }

    var usuarioActual = await EC.datos.obtenerUsuarioActual();
    document.getElementById('publicacion').hidden = false;
    pintar(anuncio, usuarioActual);
    if (EC.favoritos) EC.favoritos.iniciar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})(window.EC);
