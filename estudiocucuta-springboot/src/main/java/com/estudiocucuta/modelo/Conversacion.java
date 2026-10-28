package com.estudiocucuta.modelo;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Chat entre quien publicó un anuncio (propietario) y quien le escribió
 * porque lo quiere arrendar (interesado).
 *
 * Hay una sola conversación por propietario e interesado: si el interesado
 * vuelve a escribir desde otro anuncio del mismo propietario, se reabre la
 * misma. Si los papeles se invierten (el propietario se interesa en un
 * anuncio de la otra persona), es otra conversación, con los papeles al revés.
 *
 * Getters generados por Lombok. propietario e interesado no tienen setter:
 * se fijan en el constructor y solo se vacían con quitarParticipante()
 * cuando esa persona elimina su cuenta.
 */
@Entity
@Table(name = "conversaciones", uniqueConstraints = @UniqueConstraint(columnNames = {"propietario_id", "interesado_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Conversacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Quien publicó el anuncio. Queda vacío si elimina su cuenta; el interesado conserva el chat. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "propietario_id")
    private Usuario propietario;

    /** Quien escribió desde el anuncio. Queda vacío si elimina su cuenta; el propietario conserva el chat. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interesado_id")
    private Usuario interesado;

    /** Anuncio desde el que empezó el chat; vacío si después se eliminó. */
    @Setter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anuncio_origen_id")
    private Anuncio anuncioOrigen;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @OneToMany(mappedBy = "conversacion", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("fecha ASC, id ASC")
    private List<Mensaje> mensajes = new ArrayList<>();

    public Conversacion(Usuario propietario, Usuario interesado, Anuncio anuncioOrigen) {
        this.propietario = propietario;
        this.interesado = interesado;
        this.anuncioOrigen = anuncioOrigen;
    }

    @PrePersist
    void alCrear() {
        if (fechaCreacion == null) {
            fechaCreacion = LocalDateTime.now().withNano(0);
        }
    }

    public boolean participa(Long usuarioId) {
        return esUsuario(propietario, usuarioId) || esUsuario(interesado, usuarioId);
    }

    /** La otra persona del chat, o null si eliminó su cuenta. */
    public Usuario otroParticipante(Long usuarioId) {
        return esUsuario(propietario, usuarioId) ? interesado : propietario;
    }

    /** Vacía el lado de quien elimina su cuenta, sea el propietario o el interesado. */
    public void quitarParticipante(Long usuarioId) {
        if (esUsuario(propietario, usuarioId)) {
            propietario = null;
        }
        if (esUsuario(interesado, usuarioId)) {
            interesado = null;
        }
    }

    private static boolean esUsuario(Usuario usuario, Long usuarioId) {
        return usuario != null && usuario.getId().equals(usuarioId);
    }
}
