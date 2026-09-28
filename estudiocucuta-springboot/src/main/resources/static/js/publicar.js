/* ==========================================================================
   publicar.js — formulario para crear o editar un anuncio (publicar.html).
   Las fotos se comprimen en el navegador y se envían al servidor como
   archivos, junto con los datos del anuncio. Debe cargarse después de
   datos.js y proteger.js.
   ========================================================================== */

(function (EC) {
  var ANCHO_MAXIMO_FOTO = 900;
  var TAMANO_MAXIMO_ARCHIVO = 8 * 1024 * 1024;

  /* Fotos del formulario, en orden: { url, archivo }. Las que ya estaban
     guardadas en el servidor solo tienen url; las nuevas traen además el
     archivo comprimido (Blob) y su url es temporal, solo para la vista previa. */
  var fotosActuales = [];
  var anuncioExistente = null;
  var listo = false;

  function mostrarError(mensaje) {
    var el = document.getElementById('mensaje-error');
    el.textContent = mensaje;
    el.hidden = false;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function ocultarError() {
    document.getElementById('mensaje-error').hidden = true;
  }

  /* Reduce la foto a 900 px de ancho y la convierte a JPEG. */
  function procesarImagen(archivo) {
    return new Promise(function (resolve, reject) {
      if (archivo.size > TAMANO_MAXIMO_ARCHIVO) {
        reject(new Error('"' + archivo.name + '" no debe superar 8 MB.'));
        return;
      }

      var lector = new FileReader();
      lector.onload = function () {
        var imagen = new Image();
        imagen.onload = function () {
          var escala = Math.min(1, ANCHO_MAXIMO_FOTO / imagen.width);
          var canvas = document.createElement('canvas');
          canvas.width = Math.round(imagen.width * escala);
          canvas.height = Math.round(imagen.height * escala);
          canvas.getContext('2d').drawImage(imagen, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(function (blob) {
            if (blob) {
              resolve({ url: URL.createObjectURL(blob), archivo: blob });
            } else {
              reject(new Error('No se pudo procesar la imagen "' + archivo.name + '".'));
            }
          }, 'image/jpeg', 0.82);
        };
        imagen.onerror = function () { reject(new Error('No se pudo leer la imagen "' + archivo.name + '".')); };
        imagen.src = lector.result;
      };
      lector.onerror = function () { reject(new Error('No se pudo leer el archivo "' + archivo.name + '".')); };
      lector.readAsDataURL(archivo);
    });
  }

  function renderizarVistaPrevia() {
    var contenedor = document.getElementById('vista-previa');
    var lista = document.getElementById('vista-previa-lista');
    var contador = document.getElementById('vista-previa-contador');

    lista.innerHTML = '';

    if (fotosActuales.length === 0) {
      contenedor.hidden = true;
      return;
    }
    contenedor.hidden = false;
    contador.textContent = fotosActuales.length + ' / ' + EC.util.MAXIMO_FOTOS + ' fotos';

    fotosActuales.forEach(function (foto, indice) {
      var li = document.createElement('li');
      li.className = 'vista-previa__item';

      var img = document.createElement('img');
      img.src = foto.url;
      img.alt = 'Foto ' + (indice + 1) + ' del anuncio';
      li.appendChild(img);

      var quitar = document.createElement('button');
      quitar.type = 'button';
      quitar.className = 'vista-previa__quitar';
      quitar.setAttribute('aria-label', 'Quitar esta foto');
      quitar.textContent = '×';
      quitar.addEventListener('click', function () {
        if (foto.archivo) URL.revokeObjectURL(foto.url);
        fotosActuales.splice(indice, 1);
        renderizarVistaPrevia();
      });
      li.appendChild(quitar);

      lista.appendChild(li);
    });
  }

  function leerNumeroOpcional(id) {
    var valor = document.getElementById(id).value;
    return valor === '' ? null : Number(valor);
  }

  /* "true" / "false" del <select>, o null si quedó en "No especificado". */
  function leerSiNo(id) {
    var valor = document.getElementById(id).value;
    if (valor === 'true') return true;
    if (valor === 'false') return false;
    return null;
  }

  function valorSiNo(valor) {
    if (valor === true) return 'true';
    if (valor === false) return 'false';
    return '';
  }

  function leerFormulario() {
    return {
      titulo: document.getElementById('titulo').value.trim(),
      tipo: document.getElementById('tipo').value,
      precio: Number(document.getElementById('precio').value),
      ciudad: document.getElementById('ciudad').value,
      barrio: document.getElementById('barrio').value.trim(),
      estado: document.getElementById('estado').value,
      telefono: document.getElementById('telefono').value.trim(),
      descripcion: document.getElementById('descripcion').value.trim(),
      area: leerNumeroOpcional('area'),
      amoblado: leerSiNo('amoblado'),
      generoPermitido: document.getElementById('genero-permitido').value,
      mascotas: leerSiNo('mascotas')
    };
  }

  function validar(datos) {
    if (datos.titulo.length < 3) return 'Escribe un título de al menos 3 caracteres.';
    if (!datos.tipo) return 'Selecciona el tipo de inmueble.';
    if (!datos.precio || datos.precio <= 0) return 'Escribe un precio válido.';
    if (!datos.ciudad) return 'Selecciona la ciudad.';
    if (!datos.barrio) return 'Escribe el barrio.';
    if (!datos.descripcion || datos.descripcion.length < 10) return 'Escribe una descripción de al menos 10 caracteres.';
    return null;
  }

  function precargarFormulario(anuncio) {
    document.getElementById('titulo').value = anuncio.titulo;
    document.getElementById('tipo').value = anuncio.tipo;
    document.getElementById('precio').value = anuncio.precio;
    document.getElementById('ciudad').value = anuncio.ciudad;
    document.getElementById('barrio').value = anuncio.barrio;
    document.getElementById('estado').value = anuncio.estado;
    document.getElementById('telefono').value = anuncio.telefono || '';
    document.getElementById('descripcion').value = anuncio.descripcion;
    document.getElementById('area').value = anuncio.area != null ? anuncio.area : '';
    document.getElementById('amoblado').value = valorSiNo(anuncio.amoblado);
    document.getElementById('genero-permitido').value = anuncio.generoPermitido || 'todos';
    document.getElementById('mascotas').value = valorSiNo(anuncio.mascotas);
    fotosActuales = EC.util.obtenerFotos(anuncio).map(function (url) {
      return { url: url, archivo: null };
    });
    renderizarVistaPrevia();
  }

  function agregarFotos(evento) {
    var archivos = Array.prototype.slice.call(evento.target.files);
    evento.target.value = '';
    if (archivos.length === 0) return;

    ocultarError();

    var espacioDisponible = EC.util.MAXIMO_FOTOS - fotosActuales.length;
    if (espacioDisponible <= 0) {
      mostrarError('Ya tienes el máximo de ' + EC.util.MAXIMO_FOTOS + ' fotos.');
      return;
    }
    if (archivos.length > espacioDisponible) {
      mostrarError('Solo puedes agregar ' + espacioDisponible + ' foto(s) más (máximo ' + EC.util.MAXIMO_FOTOS + ').');
      archivos = archivos.slice(0, espacioDisponible);
    }

    Promise.all(archivos.map(procesarImagen)).then(function (fotos) {
      fotosActuales = fotosActuales.concat(fotos);
      renderizarVistaPrevia();
    }).catch(function (error) {
      mostrarError(error.message);
    });
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (!listo) return;
    ocultarError();

    var datos = leerFormulario();
    var error = validar(datos);
    if (error) {
      mostrarError(error);
      return;
    }

    datos.fotosConservadas = fotosActuales
      .filter(function (foto) { return !foto.archivo; })
      .map(function (foto) { return foto.url; });
    var fotosNuevas = fotosActuales
      .filter(function (foto) { return foto.archivo; })
      .map(function (foto) { return foto.archivo; });

    var boton = document.getElementById('boton-enviar');
    boton.disabled = true;
    try {
      var guardado = anuncioExistente
        ? await EC.datos.actualizarAnuncio(anuncioExistente.id, datos, fotosNuevas)
        : await EC.datos.crearAnuncio(datos, fotosNuevas);
      window.location.href = 'anuncio.html?id=' + encodeURIComponent(guardado.id);
    } catch (fallo) {
      mostrarError(fallo.message);
      boton.disabled = false;
    }
  }

  async function iniciar() {
    document.getElementById('form-publicar').addEventListener('submit', enviar);
    document.getElementById('foto').addEventListener('change', agregarFotos);

    var usuario = await EC.proteger.requerirSesion();
    if (!usuario) return;

    var idEdicion = new URLSearchParams(window.location.search).get('id');

    if (!idEdicion && usuario.rol === 'administrador') {
      window.location.href = 'index.html';
      return;
    }

    if (idEdicion) {
      try {
        anuncioExistente = await EC.datos.obtenerAnuncio(idEdicion);
      } catch (fallo) {
        anuncioExistente = null;
      }
      var puedeEditar = !!anuncioExistente && !!anuncioExistente.propietario &&
        anuncioExistente.propietario.id === usuario.id;
      if (!puedeEditar) {
        window.location.href = 'index.html';
        return;
      }
      document.getElementById('titulo-publicar').textContent = 'Editar anuncio';
      document.getElementById('boton-enviar').textContent = 'Guardar cambios';
      precargarFormulario(anuncioExistente);
    }

    listo = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})(window.EC);
