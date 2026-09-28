# EstudioCúcuta — versión Spring Boot

Alquiler de apartaestudios y habitaciones en Cúcuta, con backend en Java: la
"base de datos" que antes se simulaba con `localStorage` (`js/datos.js`) se
reemplazó por una API REST en Spring Boot, y el frontend (HTML, CSS y JS) la
consume con `fetch`. La versión anterior, solo con HTML y JS, quedó en el
historial de git (commit `1473780`).

El JavaScript que queda en `static/js` es necesario: el navegador no ejecuta
Java, así que las páginas siguen usando JS para mostrarse y para pedirle los
datos al servidor. Pero ya no guarda datos ni tiene reglas de negocio; eso
ahora está todo en Java. Por lo mismo, los HTML ya no funcionan abiertos
directamente o con Live Server: hay que entrar por <http://localhost:8080>.

## Tecnologías

- Java 17 y Spring Boot 3.5 (Maven)
- Spring Web (API REST), Spring Data JPA, Spring Security (sesión + BCrypt), Bean Validation, Lombok
- H2 en memoria: no hay que instalar ninguna base de datos (ver "Pasar a MySQL")

Los getters y setters de las entidades (carpeta `modelo/`) no están escritos a
mano: los genera Lombok con las anotaciones `@Getter`/`@Setter` al compilar.
Si tu editor no los reconoce, instala el plugin/soporte de Lombok (en VS Code
ya viene incluido en el "Extension Pack for Java"; en IntelliJ hay que
instalar el plugin "Lombok" y activar "Enable annotation processing").

## Cómo ejecutarlo

Requisito: un JDK 17 o superior (por ejemplo Eclipse Temurin 17). No hace
falta instalar Maven: el proyecto trae el Maven Wrapper (`mvnw`), que lo
descarga solo la primera vez.

- **VS Code**: con el "Extension Pack for Java" y el "Spring Boot Extension
  Pack", abrir la carpeta `estudiocucuta-springboot` y darle ▶ a `estudiocucuta`
  en el panel "Spring Boot Dashboard" (o "Run" encima del `main` de
  `EstudioCucutaApplication`).
- **IntelliJ IDEA**: abrir la carpeta, esperar a que descargue las dependencias
  y ejecutar `EstudioCucutaApplication`.
- **Consola**, dentro de la carpeta del proyecto: `.\mvnw spring-boot:run` en
  Windows, o `./mvnw spring-boot:run` en Linux/Mac. Para correr la prueba:
  `.\mvnw test`.

Luego abrir <http://localhost:8080>.

La base de datos vive en memoria: cada vez que se reinicia la aplicación
vuelve a empezar con los datos de ejemplo.

### Cuentas de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@estudiocucuta.com | admin123 |
| Usuaria verificada, con un anuncio | laura@ejemplo.test | demo123 |
| Usuario con verificación pendiente, con un anuncio | andres@ejemplo.test | demo123 |

Para probar el chat entre dos personas, iniciar sesión con Laura en un navegador
y con Andrés en otro (o en una ventana privada).

La contraseña del administrador se puede cambiar con la variable de entorno
`ADMIN_CONTRASENA`, y los datos de ejemplo se desactivan con `app.datos-demo=false`.

## Estructura

```
src/main/java/com/estudiocucuta/
├── modelo/        Entidades JPA (Usuario, Anuncio, FotoAnuncio, Favorito,
│                  Conversacion, Mensaje, Reporte, SolicitudVerificacion) y enums
├── repositorio/   Repositorios Spring Data + AnuncioSpecs (filtros del buscador)
├── dto/           Datos que entran y salen de la API (records)
├── servicio/      Reglas de negocio (antes estaban en datos.js)
├── controlador/   Endpoints REST
├── seguridad/     Spring Security, usuario de la sesión
├── excepcion/     ApiException y respuestas de error { "error": "..." }
└── config/        Datos iniciales y publicación de las fotos subidas
src/main/resources/
├── application.properties
└── static/        El frontend (HTML, CSS, JS e imágenes)
```

Las fotos que suben los usuarios se guardan en la carpeta `fotos-subidas/` y
se publican en `/fotos/...`; en la base de datos solo queda la ruta.

## API

| Método | Ruta | Para qué | Sesión |
|---|---|---|---|
| POST | `/api/auth/registro` | Crear cuenta (e iniciar sesión) | — |
| POST | `/api/auth/acceder` | Iniciar sesión | — |
| POST | `/api/auth/salir` | Cerrar sesión | — |
| GET | `/api/auth/sesion` | Usuario actual (204 si no hay sesión) | — |
| GET | `/api/anuncios?q=&ciudad=&precioMax=&tipo=&genero=&mascotas=&amoblado=&soloFavoritos=&orden=` | Buscar anuncios | — |
| GET | `/api/anuncios/{id}` | Detalle | — |
| POST | `/api/anuncios` | Publicar (multipart: `datos` JSON + `fotos`) | Sí |
| PUT | `/api/anuncios/{id}` | Editar (solo el propietario) | Sí |
| DELETE | `/api/anuncios/{id}` | Eliminar (propietario o admin) | Sí |
| POST | `/api/anuncios/{id}/visitas` | Contar una visita | — |
| POST | `/api/anuncios/{id}/reportes` | Reportar | Sí |
| GET | `/api/usuarios/{id}` y `/api/usuarios/{id}/anuncios` | Perfil público | — |
| PUT / DELETE | `/api/cuenta` | Editar datos / eliminar la cuenta | Sí |
| PUT | `/api/cuenta/contrasena` | Cambiar contraseña | Sí |
| GET | `/api/cuenta/anuncios` | Mis publicaciones (con visitas y contactos) | Sí |
| POST | `/api/cuenta/verificacion` | Solicitar verificación | Sí |
| GET / PUT / DELETE | `/api/favoritos` y `/api/favoritos/{anuncioId}` | Favoritos | Sí |
| GET / POST | `/api/conversaciones`, `/{id}`, `/{id}/mensajes`, `/no-leidas` | Chat | Sí |
| PUT | `/api/conversaciones/{id}/leida` | Marcar como leída | Sí |
| GET | `/api/admin/anuncios`, `/usuarios`, `/reportes`, `/verificaciones`, `/pendientes` | Panel admin | Admin |
| PUT | `/api/admin/usuarios/{id}/bloqueo`, `/api/admin/reportes/{id}/resuelto` | Moderar | Admin |
| POST | `/api/admin/verificaciones/{id}/aprobar` y `/rechazar` | Verificaciones | Admin |
| DELETE | `/api/admin/usuarios/{id}` | Eliminar una cuenta | Admin |

## Pasar a MySQL

1. En `pom.xml`, descomentar la dependencia `mysql-connector-j`.
2. Crear la base de datos: `CREATE DATABASE estudiocucuta;`
3. En `application.properties`, cambiar la sección "Base de datos" por:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/estudiocucuta
spring.datasource.username=root
spring.datasource.password=tu_contraseña
spring.jpa.hibernate.ddl-auto=update
```

Con `update`, JPA crea las tablas la primera vez y los datos se conservan
entre reinicios.
