package com.estudiocucuta.repositorio;

import com.estudiocucuta.modelo.Anuncio;
import com.estudiocucuta.modelo.Ciudad;
import com.estudiocucuta.modelo.Favorito;
import com.estudiocucuta.modelo.GeneroPermitido;
import com.estudiocucuta.modelo.TipoInmueble;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import org.springframework.data.jpa.domain.Specification;

/**
 * Filtros del buscador de anuncios de la página principal.
 * Cada método devuelve una condición; si el filtro viene vacío, la condición
 * devuelve null y Spring Data simplemente la ignora.
 */
public final class AnuncioSpecs {

    private AnuncioSpecs() {
    }

    /** Oculta los anuncios de usuarios bloqueados. */
    public static Specification<Anuncio> propietarioActivo() {
        return (raiz, consulta, cb) -> cb.isFalse(raiz.get("propietario").<Boolean>get("bloqueado"));
    }

    /** Busca en título, barrio y descripción, y también en el nombre del tipo y de la ciudad. */
    public static Specification<Anuncio> contieneTexto(String texto) {
        return (raiz, consulta, cb) -> {
            if (texto == null || texto.isBlank()) {
                return null;
            }
            String buscado = texto.trim().toLowerCase(Locale.ROOT);
            String patron = "%" + buscado + "%";

            List<Predicate> opciones = new ArrayList<>();
            opciones.add(cb.like(cb.lower(raiz.<String>get("titulo")), patron));
            opciones.add(cb.like(cb.lower(raiz.<String>get("barrio")), patron));
            opciones.add(cb.like(cb.lower(raiz.<String>get("descripcion")), patron));

            List<TipoInmueble> tipos = Arrays.stream(TipoInmueble.values())
                    .filter(tipo -> coincide(tipo.getEtiqueta(), tipo.getValor(), buscado))
                    .toList();
            if (!tipos.isEmpty()) {
                opciones.add(raiz.get("tipo").in(tipos));
            }

            List<Ciudad> ciudades = Arrays.stream(Ciudad.values())
                    .filter(ciudad -> coincide(ciudad.getEtiqueta(), ciudad.getValor(), buscado))
                    .toList();
            if (!ciudades.isEmpty()) {
                opciones.add(raiz.get("ciudad").in(ciudades));
            }

            return cb.or(opciones.toArray(new Predicate[0]));
        };
    }

    public static Specification<Anuncio> enCiudad(Ciudad ciudad) {
        return (raiz, consulta, cb) -> ciudad == null ? null : cb.equal(raiz.get("ciudad"), ciudad);
    }

    public static Specification<Anuncio> precioHasta(BigDecimal precioMaximo) {
        return (raiz, consulta, cb) -> precioMaximo == null ? null
                : cb.lessThanOrEqualTo(raiz.<BigDecimal>get("precio"), precioMaximo);
    }

    public static Specification<Anuncio> deTipo(TipoInmueble tipo) {
        return (raiz, consulta, cb) -> tipo == null ? null : cb.equal(raiz.get("tipo"), tipo);
    }

    /** Un anuncio para "todos los géneros" también aparece al filtrar por hombres o por mujeres. */
    public static Specification<Anuncio> admiteGenero(GeneroPermitido genero) {
        return (raiz, consulta, cb) -> genero == null || genero == GeneroPermitido.TODOS ? null
                : raiz.get("generoPermitido").in(genero, GeneroPermitido.TODOS);
    }

    public static Specification<Anuncio> conMascotas(Boolean mascotas) {
        return (raiz, consulta, cb) -> mascotas == null ? null : cb.equal(raiz.get("mascotas"), mascotas);
    }

    public static Specification<Anuncio> amoblado(Boolean amoblado) {
        return (raiz, consulta, cb) -> amoblado == null ? null : cb.equal(raiz.get("amoblado"), amoblado);
    }

    /** Solo los anuncios que ese usuario guardó en favoritos. */
    public static Specification<Anuncio> favoritosDe(Long usuarioId) {
        return (raiz, consulta, cb) -> {
            if (usuarioId == null) {
                return null;
            }
            Subquery<Long> favoritos = consulta.subquery(Long.class);
            Root<Favorito> favorito = favoritos.from(Favorito.class);
            favoritos.select(favorito.get("anuncio").<Long>get("id"))
                    .where(cb.equal(favorito.get("usuario").get("id"), usuarioId));
            return raiz.get("id").in(favoritos);
        };
    }

    private static boolean coincide(String etiqueta, String valor, String buscado) {
        return etiqueta.toLowerCase(Locale.ROOT).contains(buscado) || valor.contains(buscado);
    }
}
