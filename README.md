# SDK-Bot

SDK-Bot conecta canales de mensajería con un gateway, un panel de administración y un Brain de IA. WhatsApp y Telegram usan adaptadores del Gateway; el panel y el Brain son procesos separados.

## Componentes

| Ruta | Responsabilidad |
|---|---|
| `apps/gateway/` | Adaptadores de canales, reglas de conversación y archivo SQLite. Es el único proceso que mantiene los transportes. |
| `apps/panel/` | Panel web legacy y bandeja React/TypeScript en `/inbox`; se comunica con el Gateway por su bus interno. |
| `apps/brain/` | API Python para generación y contexto de IA. |
| `apps/stt/` | Servicio de transcripción usado por el despliegue Docker. |
| `packages/contracts/` | Schemas, OpenAPI, tipos y validación compartidos. |
| `gateway/`, `brain/` | Estado runtime, configuración local, sesiones, bases de datos y logs. No son directorios de código fuente. |

La bandeja `/inbox` está desactivada por defecto. El panel legacy continúa en `/`.

## Desarrollo local en Linux

Requisitos: Node.js 22.13 o superior, Python, `uv` y las herramientas usadas por `deploy/linux/dev.sh`. El script crea el entorno Python y verifica/instala dependencias del Gateway y del panel cuando hace falta. El bundle web se debe compilar explícitamente:

```bash
cd apps/panel
NODE_ENV=development npm ci
NODE_ENV=development npm run build
cd ../..

PANEL_CONVERSATIONS_UI_ENABLED=true bash deploy/linux/dev.sh up all
bash deploy/linux/dev.sh status
bash deploy/linux/dev.sh down
```

`up` reemplaza procesos que ocupen los puertos del stack; úsalo solo si esos puertos pertenecen a SDK-Bot. El launcher enlaza por defecto a `0.0.0.0`; no expongas el panel de desarrollo a redes no confiables. Las variables `BRAIN_HOST`, `ADMIN_WEB_HOST` y `STATUS_HOST` permiten limitar los listeners.

## Producción y otras plataformas

- [Despliegue Docker Compose](deploy/docker/README.md)
- [Despliegue Termux](deploy/termux/README.md)
- [Scripts de inicio para Windows](deploy/windows/README.md)
- [Arquitectura actual](docs/ARCHITECTURE.md)
- [Seguridad y autenticación del panel](docs/FRONTERA-AUTENTICADA-V1.md)
- [Configuración OAuth](docs/OAUTH-LESSONS.md)
- [Operación y recuperación](docs/OPERACION-RECUPERACION.md)
- [Contratos compartidos](packages/contracts/README.md)

## Estado, credenciales y resets

No guardes credenciales ni sesiones en el repositorio. `brain/.env` contiene la configuración del Brain; `gateway/panel/.env` contiene la configuración OAuth local; la sesión de WhatsApp y los datos del Gateway están bajo `gateway/`. Mantén protegidos esos archivos y directorios.

`npm run reset` elimina la sesión de WhatsApp para vincularla de nuevo. `npm run clean` elimina el estado runtime completo, incluido el archivo de conversaciones; conserva `brain/profiles/`. Desde la raíz, ejecuta ambos comandos dentro de `apps/gateway/` y lee el [procedimiento de reset seguro](docs/RESET-SEGURO.md) antes de usarlos.

## Verificación

La CI valida contratos, Gateway/panel y Brain. Los comandos exactos y versiones de Node/Python están en [`.github/workflows/ci.yml`](.github/workflows/ci.yml). El check del workspace raíz valida los contratos; no sustituye las suites de Gateway ni Brain.

## Licencia

Proyecto privado. Todos los derechos reservados.
