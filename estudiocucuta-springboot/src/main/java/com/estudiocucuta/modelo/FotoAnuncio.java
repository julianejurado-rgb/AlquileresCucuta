package com.estudiocucuta.modelo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Foto de un anuncio. En la base de datos solo se guarda la ruta pública;
 * el archivo vive en disco (ver AlmacenFotos).
 *
 * Getters generados por Lombok; url y anuncio no tienen setter (solo se
 * fijan al crear la foto), orden sí porque cambia al reordenar fotos.
 */
@Entity
@Table(name = "fotos_anuncio")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FotoAnuncio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Por ejemplo /fotos/5f1c2a….jpg. La más larga posible es "/fotos/" (7)
     * + un UUID (36) + ".webp" (5) = 48 caracteres; ver AlmacenFotos.
     */
    @Column(nullable = false, length = 48)
    private String url;

    /** 0 es la portada. */
    @Setter
    @Column(nullable = false)
    private int orden;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "anuncio_id", nullable = false)
    private Anuncio anuncio;

    FotoAnuncio(Anuncio anuncio, String url, int orden) {
        this.anuncio = anuncio;
        this.url = url;
        this.orden = orden;
    }
}
