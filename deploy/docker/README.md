# Producción con Docker Compose

Compose define cuatro servicios: `brain`, `stt`, `gateway` y `panel`. El panel es un proceso distinto del Gateway; no conectes un segundo Gateway al mismo estado de WhatsApp.

## Requisitos previos

- Docker Engine y Docker Compose.
- La red Docker externa `proxy_net` debe existir y el reverse proxy debe conectarse a ella.
- `brain/.env` con la configuración del Brain y `gateway/panel/.env` con OAuth, ambos protegidos y fuera de Git.
- `SDK_PANEL_GATEWAY_SECRET` disponible para la interpolación de Compose y con el mismo valor entregado a Gateway y panel. Debe ser un secreto servidor independiente de la cookie y de las claves IA.

El panel corre en el puerto 3005 dentro de la red del proxy (`sdk-bot-panel:3005`); Compose no publica ese puerto en el host. Brain, bus interno y status tampoco se publican al exterior. Configura el reverse proxy para apuntar solo al panel.

## Construir y arrancar

Desde la raíz del repositorio:

```bash
docker compose -f deploy/docker/compose.yml build
docker compose -f deploy/docker/compose.yml up -d
docker compose -f deploy/docker/compose.yml ps
docker compose -f deploy/docker/compose.yml logs -f gateway
```

En producción OAuth está requerido. Configura las credenciales y la URL pública antes de iniciar; los detalles están en [seguridad del panel](../../docs/FRONTERA-AUTENTICADA-V1.md) y [OAuth](../../docs/OAUTH-LESSONS.md).

La UI React de conversaciones se sirve en `/inbox` cuando `PANEL_CONVERSATIONS_UI_ENABLED=true`; por defecto permanece apagada. Para activarla al levantar Compose:

```bash
PANEL_CONVERSATIONS_UI_ENABLED=true docker compose -f deploy/docker/compose.yml up -d --build
```

## Estado y mantenimiento

- `sdk-bot-production-state` contiene el estado persistente del Gateway/Brain, incluida la sesión de WhatsApp y el archivo de conversaciones.
- `sdk-bot-production-gateway-logs` y `sdk-bot-production-brain-logs` guardan logs.
- `sdk-bot-production-stt-models` conserva la caché de modelos de STT.
- `brain/profiles/` se monta desde el repositorio.
- `docker compose ... down` detiene servicios sin eliminar volúmenes.
- `docker compose ... down -v` es destructivo y elimina los volúmenes administrados por Compose.

El repositorio no configura backups programados. Para copias offline y el chequeo read-only de una base candidata, sigue [operación y recuperación](../../docs/OPERACION-RECUPERACION.md). No restaures un snapshot antiguo sobre el volumen activo como rollback de código.
