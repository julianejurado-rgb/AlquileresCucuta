/* ==========================================================================
   publicar.js — formulario para crear o editar un anuncio (publicar.html).
   Debe cargarse después de datos.js y proteger.js.
   ========================================================================== */

(function (EC) {
  var ANCHO_MAXIMO_FOTO = 900;
  var TAMANO_MAXIMO_ARCHIVO = 8 * 1024 * 1024;

  var fotosActuales = [];   // dataURLs de las fotos del anuncio (hasta MAXIMO_FOTOS)

  function mostrarError(mensaje) {
    var el = document.getElementById('mensaje-error');
    el.textContent = mensaje;
    el.hidden = false;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function ocultarError() {
    document.getElementById('mensaje-error').hidden = true;
  }

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
          var ctx = canvas.getContext('2d');
          ctx.drawImage(imagen, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
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

    fotosActuales.forEach(function (dataUrl, indice) {
      var li = document.createElement('li');
      li.className = 'vista-previa__item';

      var img = document.createElement('img');
      img.src = dataUrl;
      img.alt = 'Foto ' + (indice + 1) + ' del anuncio';
      li.appendChild(img);

      var quitar = document.createElement('button');
      quitar.type = 'button';
      quitar.className = 'vista-previa__quitar';
      quitar.setAttribute('aria-label', 'Quitar esta foto');
      quitar.textContent = '×';
      quitar.addEventListener('click', function () {
        fotosActuales.splice(indice, 1);
        renderizarVistaPrevia();
      });
      li.appendChild(quitar);

      lista.appendChild(li);
    });
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
      descripcion: document.getElementById('descripcion').value.trim()
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
    fotosActuales = EC.util.obtenerFotos(anuncio).slice();
    renderizarVistaPrevia();
  }

  function iniciar() {
    var usuario = EC.proteger.requerirSesion();
    if (!usuario) return;

    var params = new URLSearchParams(window.location.search);
    var idEdicion = params.get('id');
    var anuncioExistente = idEdicion ? EC.datos.obtenerAnuncioPorId(idEdicion) : null;

    if (!idEdicion && usuario.rol === 'administrador') {
      window.location.href = 'index.html';
      return;
    }

    if (idEdicion) {
      var puedeEditar = anuncioExistente && anuncioExistente.propietarioId === usuario.id;
      if (!puedeEditar) {
        window.location.href = 'index.html';
        return;
      }
      document.getElementById('titulo-publicar').textContent = 'Editar anuncio';
      document.getElementById('boton-enviar').textContent = 'Guardar cambios';
      precargarFormulario(anuncioExistente);
    }

    document.getElementById('foto').addEventListener('change', function (evento) {
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

      Promise.all(archivos.map(procesarImagen)).then(function (dataUrls) {
        fotosActuales = fotosActuales.concat(dataUrls);
        renderizarVistaPrevia();
      }).catch(function (error) {
        mostrarError(error.message);
      });
    });

    document.getElementById('form-publicar').addEventListener('submit', function (evento) {
      evento.preventDefault();
      ocultarError();

      var datos = leerFormulario();
      var error = validar(datos);
      if (error) {
        mostrarError(error);
        return;
      }

      datos.fotos = fotosActuales;

      if (anuncioExistente) {
        EC.datos.actualizarAnuncio(anuncioExistente.id, datos);
        window.location.href = 'anuncio.html?id=' + encodeURIComponent(anuncioExistente.id);
      } else {
        datos.propietarioId = usuario.id;
        var creado = EC.datos.crearAnuncio(datos);
        window.location.href = 'anuncio.html?id=' + encodeURIComponent(creado.id);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})(window.EC);
