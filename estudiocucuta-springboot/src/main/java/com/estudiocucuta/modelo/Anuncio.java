package com.estudiocucuta.modelo;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * Inmueble publicado en arriendo.
 *
 * Getters (@Getter) y setters (@Setter) generados por Lombok. id,
 * fechaPublicacion y fotos solo tienen getter: el id lo asigna la base de
 * datos, fechaPublicacion se fija sola al guardar (alPublicar) y fotos se
 * administra con agregarFoto(), no con un setter.
 *
 * Los largos de los textos coinciden con los límites de AnuncioRequest; los
 * de los enums, con el nombre más largo de cada uno (se guardan como texto).
 */
@Entity
@Table(name = "anuncios")
@Getter
public class Anuncio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Setter
    @Column(nullable = false, length = 80)
    private String titulo;

    @Setter
    @Column(nullable = false, length = 800)
    private String descripcion;

    /** El más largo es APARTAESTUDIO (13). */
    @Setter
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 13)
    private TipoInmueble tipo;

    /** Canon mensual en pesos colombianos (sin centavos). */
    @Setter
    @Column(nullable = false, precision = 12, scale = 0)
    private BigDecimal precio;

    /** El más largo es VILLA_DEL_ROSARIO (17). */
    @Setter
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 17)
    private Ciudad ciudad;

    @Setter
    @Column(nullable = false, length = 60)
    private String barrio;

    /** El más largo es DISPONIBLE (10). */
    @Setter
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private EstadoAnuncio estado = EstadoAnuncio.DISPONIBLE;

    @Setter
    @Column(length = 20)
    private String telefono;

    /** Área en m²; vacía si el propietario no la indicó. */
    @Setter
    private Integer area;

    /** true / false, o vacío (null) cuando no se especificó. */
    @Setter
    private Boolean amoblado;

    /** true / false, o vacío (null) cuando no se especificó. */
    @Setter
    private Boolean mascotas;

    /** HOMBRES y MUJERES son los más largos (7). */
    @Setter
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 7)
    private GeneroPermitido generoPermitido = GeneroPermitido.TODOS;

    @Setter
    @Column(nullable = false)
    private int visitas;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaPublicacion;

    @Setter
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "propietario_id", nullable = false)
    private Usuario propietario;

    /** Máximo 10. La de orden 0 es la portada. */
    @OneToMany(mappedBy = "anuncio", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orden ASC")
    private List<FotoAnuncio> fotos = new ArrayList<>();

    @PrePersist
    void alPublicar() {
        if (fechaPublicacion == null) {
            fechaPublicacion = LocalDateTime.now().withNano(0);
        }
    }

    public void agregarFoto(String url, int orden) {
        fotos.add(new FotoAnuncio(this, url, orden));
    }
}
