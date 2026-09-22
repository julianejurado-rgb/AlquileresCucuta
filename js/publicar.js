/* ==========================================================================
   publicar.js — formulario para crear o editar un anuncio (publicar.html).
   Debe cargarse después de datos.js y proteger.js.
   ========================================================================== */

(function (EC) {
  var ANCHO_MAXIMO_FOTO = 900;
  var TAMANO_MAXIMO_ARCHIVO = 8 * 1024 * 1024;

  var fotoActual = null;   // dataURL de la foto nueva, o null si no ha cambiado
  var fotoEliminada = false;

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
        reject(new Error('La imagen no debe superar 8 MB.'));
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
        imagen.onerror = function () { reject(new Error('No se pudo leer la imagen seleccionada.')); };
        imagen.src = lector.result;
      };
      lector.onerror = function () { reject(new Error('No se pudo leer el archivo seleccionado.')); };
      lector.readAsDataURL(archivo);
    });
  }

  function mostrarVistaPrevia(dataUrl) {
    var contenedor = document.getElementById('vista-previa');
    var img = document.getElementById('vista-previa-img');
    img.src = dataUrl;
    contenedor.hidden = false;
  }

  function ocultarVistaPrevia() {
    document.getElementById('vista-previa').hidden = true;
    document.getElementById('vista-previa-img').src = '';
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
    if (anuncio.foto) mostrarVistaPrevia(anuncio.foto);
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
      var archivo = evento.target.files[0];
      if (!archivo) return;

      ocultarError();
      procesarImagen(archivo).then(function (dataUrl) {
        fotoActual = dataUrl;
        fotoEliminada = false;
        mostrarVistaPrevia(dataUrl);
      }).catch(function (error) {
        mostrarError(error.message);
        evento.target.value = '';
      });
    });

    document.getElementById('quitar-foto').addEventListener('click', function () {
      fotoActual = null;
      fotoEliminada = true;
      document.getElementById('foto').value = '';
      ocultarVistaPrevia();
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

      if (fotoActual) {
        datos.foto = fotoActual;
      } else if (fotoEliminada) {
        datos.foto = '';
      } else if (anuncioExistente) {
        datos.foto = anuncioExistente.foto || '';
      } else {
        datos.foto = '';
      }

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
