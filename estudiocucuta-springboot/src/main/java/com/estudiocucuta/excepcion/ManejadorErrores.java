package com.estudiocucuta.excepcion;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

/**
 * Convierte los errores en respuestas { "error": "mensaje" }, que el frontend
 * muestra directamente en sus avisos de error.
 */
@RestControllerAdvice
public class ManejadorErrores {

    public record RespuestaError(String error) {
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<RespuestaError> errorDeNegocio(ApiException excepcion) {
        return ResponseEntity.status(excepcion.getEstado()).body(new RespuestaError(excepcion.getMessage()));
    }

    /** Falló alguna validación (@NotBlank, @Size...): se muestra el primer mensaje. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<RespuestaError> datosNoValidos(MethodArgumentNotValidException excepcion) {
        String mensaje = excepcion.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .findFirst()
                .orElse("Revisa los datos del formulario.");
        return ResponseEntity.badRequest().body(new RespuestaError(mensaje));
    }

    /** JSON mal formado, un valor de enum que no existe, un id que no es número, etc. */
    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            MissingServletRequestPartException.class,
            IllegalArgumentException.class
    })
    public ResponseEntity<RespuestaError> peticionMalFormada(Exception excepcion) {
        return ResponseEntity.badRequest().body(new RespuestaError("Los datos enviados no son válidos."));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<RespuestaError> archivoMuyGrande(MaxUploadSizeExceededException excepcion) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(new RespuestaError("Las fotos son demasiado pesadas (máximo 5 MB cada una)."));
    }

    /** Por ejemplo, dos cuentas intentando quedarse con el mismo correo al mismo tiempo. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<RespuestaError> conflictoDeDatos(DataIntegrityViolationException excepcion) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new RespuestaError("No se pudo guardar porque los datos entran en conflicto. Intenta de nuevo."));
    }
}
