package com.estudiocucuta.modelo;

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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Pedido de un usuario para que un administrador verifique su cuenta.
 * Si se aprueba, el usuario queda con verificado = true.
 * Getters generados por Lombok; solo estado tiene setter.
 */
@Entity
@Table(name = "solicitudes_verificacion")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SolicitudVerificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fecha;

    /** PENDIENTE y RECHAZADA son los más largos (9). */
    @Setter
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 9)
    private EstadoVerificacion estado = EstadoVerificacion.PENDIENTE;

    public SolicitudVerificacion(Usuario usuario) {
        this.usuario = usuario;
    }

    @PrePersist
    void alSolicitar() {
        if (fecha == null) {
            fecha = LocalDateTime.now().withNano(0);
        }
    }
}
