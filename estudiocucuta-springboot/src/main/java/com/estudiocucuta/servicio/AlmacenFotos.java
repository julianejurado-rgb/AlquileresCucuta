package com.estudiocucuta.servicio;

import com.estudiocucuta.excepcion.ApiException;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Guarda en disco las fotos que suben los usuarios y las publica en /fotos/…
 * (ver WebConfig). Antes se guardaban en base64 dentro del anuncio.
 */
@Service
public class AlmacenFotos {

    public static final String PREFIJO_URL = "/fotos/";

    private static final Map<String, String> EXTENSIONES = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif");

    private final Path directorio;

    public AlmacenFotos(@Value("${app.fotos.directorio:fotos-subidas}") String directorio) throws IOException {
        this.directorio = Paths.get(directorio).toAbsolutePath().normalize();
        Files.createDirectories(this.directorio);
    }

    public Path getDirectorio() {
        return directorio;
    }

    /** Guarda el archivo con un nombre aleatorio y devuelve su URL pública. */
    public String guardar(MultipartFile archivo) {
        String tipo = archivo.getContentType();
        String extension = tipo == null ? null : EXTENSIONES.get(tipo);
        if (extension == null) {
            throw ApiException.invalido("Solo se permiten fotos JPG, PNG, WEBP o GIF.");
        }

        String nombre = UUID.randomUUID() + extension;
        try (InputStream contenido = archivo.getInputStream()) {
            Files.copy(contenido, directorio.resolve(nombre));
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo guardar la foto " + nombre, e);
        }
        return PREFIJO_URL + nombre;
    }

    /** Borra el archivo de una foto subida. Las fotos de ejemplo (/img/…) no se tocan. */
    public void eliminar(String url) {
        if (url == null || !url.startsWith(PREFIJO_URL)) {
            return;
        }
        Path archivo = directorio.resolve(url.substring(PREFIJO_URL.length())).normalize();
        if (!archivo.startsWith(directorio)) {
            return;
        }
        try {
            Files.deleteIfExists(archivo);
        } catch (IOException e) {
            // Si no se puede borrar, solo queda un archivo huérfano en disco.
        }
    }
}
