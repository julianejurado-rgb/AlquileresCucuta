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
 * Chat entre dos personas. Hay una sola conversación por pareja, sin
 * importar desde qué anuncio se contactaron: el id menor siempre va en
 * usuario1, así la restricción única impide duplicados (antes lo hacía
 * fusionarConversacionesDuplicadas en datos.js).
 *
 * Getters generados por Lombok. usuario1/usuario2 no tienen setter: se
 * fijan en el constructor y solo se vacían con quitarParticipante(), que
 * no es un setter cualquiera (decide cuál de los dos hay que vaciar).
 */
@Entity
@Table(name = "conversaciones", uniqueConstraints = @UniqueConstraint(columnNames = {"usuario1_id", "usuario2_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Conversacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Queda vacío si ese usuario elimina su cuenta; la otra persona conserva el chat. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario1_id")
    private Usuario usuario1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario2_id")
    private Usuario usuario2;

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

    public Conversacion(Usuario a, Usuario b, Anuncio anuncioOrigen) {
        boolean aPrimero = a.getId() < b.getId();
        this.usuario1 = aPrimero ? a : b;
        this.usuario2 = aPrimero ? b : a;
        this.anuncioOrigen = anuncioOrigen;
    }

    @PrePersist
    void alCrear() {
        if (fechaCreacion == null) {
            fechaCreacion = LocalDateTime.now().withNano(0);
        }
    }

    public boolean participa(Long usuarioId) {
        return esUsuario(usuario1, usuarioId) || esUsuario(usuario2, usuarioId);
    }

    /** La otra persona del chat, o null si eliminó su cuenta. */
    public Usuario otroParticipante(Long usuarioId) {
        return esUsuario(usuario1, usuarioId) ? usuario2 : usuario1;
    }

    public void quitarParticipante(Long usuarioId) {
        if (esUsuario(usuario1, usuarioId)) {
            usuario1 = null;
        }
        if (esUsuario(usuario2, usuarioId)) {
            usuario2 = null;
        }
    }

    private static boolean esUsuario(Usuario usuario, Long usuarioId) {
        return usuario != null && usuario.getId().equals(usuarioId);
    }
}
