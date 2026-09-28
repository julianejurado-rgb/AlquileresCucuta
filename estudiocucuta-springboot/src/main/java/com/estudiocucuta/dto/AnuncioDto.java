package com.estudiocucuta.dto;

import com.estudiocucuta.modelo.Anuncio;
import com.estudiocucuta.modelo.Ciudad;
import com.estudiocucuta.modelo.EstadoAnuncio;
import com.estudiocucuta.modelo.FotoAnuncio;
import com.estudiocucuta.modelo.GeneroPermitido;
import com.estudiocucuta.modelo.TipoInmueble;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/**
 * Anuncio tal como lo recibe el frontend.
 * contactos solo viene en "Mis publicaciones" y reportadoPorMi solo en el detalle.
 */
public record AnuncioDto(
        Long id,
        String titulo,
        String descripcion,
        TipoInmueble tipo,
        BigDecimal precio,
        Ciudad ciudad,
        String barrio,
        EstadoAnuncio estado,
        String telefono,
        Integer area,
        Boolean amoblado,
        Boolean mascotas,
        GeneroPermitido generoPermitido,
        int visitas,
        LocalDateTime fechaPublicacion,
        List<String> fotos,
        UsuarioPublicoDto propietario,
        Long contactos,
        Boolean reportadoPorMi) {

    /** Para las tarjetas del listado, el perfil público y el panel admin. */
    public static AnuncioDto resumen(Anuncio anuncio) {
        return crear(anuncio, UsuarioPublicoDto.de(anuncio.getPropietario()), null, null);
    }

    /** Para la página de detalle: incluye el correo del propietario. */
    public static AnuncioDto detalle(Anuncio anuncio, boolean reportadoPorMi) {
        return crear(anuncio, UsuarioPublicoDto.conCorreo(anuncio.getPropietario()), null, reportadoPorMi);
    }

    /** Para "Mis publicaciones": incluye cuántas personas escribieron por el anuncio. */
    public static AnuncioDto conContactos(Anuncio anuncio, long contactos) {
        return crear(anuncio, UsuarioPublicoDto.de(anuncio.getPropietario()), contactos, null);
    }

    private static AnuncioDto crear(Anuncio anuncio, UsuarioPublicoDto propietario, Long contactos, Boolean reportadoPorMi) {
        List<String> fotos = anuncio.getFotos().stream()
                .sorted(Comparator.comparingInt(FotoAnuncio::getOrden))
                .map(FotoAnuncio::getUrl)
                .toList();
        return new AnuncioDto(
                anuncio.getId(),
                anuncio.getTitulo(),
                anuncio.getDescripcion(),
                anuncio.getTipo(),
                anuncio.getPrecio(),
                anuncio.getCiudad(),
                anuncio.getBarrio(),
                anuncio.getEstado(),
                anuncio.getTelefono(),
                anuncio.getArea(),
                anuncio.getAmoblado(),
                anuncio.getMascotas(),
                anuncio.getGeneroPermitido(),
                anuncio.getVisitas(),
                anuncio.getFechaPublicacion(),
                fotos,
                propietario,
                contactos,
                reportadoPorMi);
    }
}
