package com.estudiocucuta.modelo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Getters generados por Lombok. Solo remitente tiene setter (se vacía
 * cuando esa persona elimina su cuenta); leido se cambia con una consulta
 * masiva en MensajeRepository, no con un setter en la entidad.
 */
@Entity
@Table(name = "mensajes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Mensaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversacion_id", nullable = false)
    private Conversacion conversacion;

    /** Vacío si quien lo envió eliminó su cuenta. */
    @Setter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "remitente_id")
    private Usuario remitente;

    /** Mismo límite que MensajeRequest. */
    @Column(nullable = false, length = 1000)
    private String texto;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fecha;

    /** Lo marca quien recibe el mensaje cuando abre la conversación. */
    @Column(nullable = false)
    private boolean leido;

    public Mensaje(Conversacion conversacion, Usuario remitente, String texto) {
        this.conversacion = conversacion;
        this.remitente = remitente;
        this.texto = texto;
    }

    @PrePersist
    void alEnviar() {
        if (fecha == null) {
            fecha = LocalDateTime.now().withNano(0);
        }
    }
}
