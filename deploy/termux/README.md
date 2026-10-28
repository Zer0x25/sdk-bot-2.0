# Despliegue en Termux

El script de bootstrap configura **Brain y Gateway** como servicios `runit` en Android. No instala ni arranca el panel web; el flujo Termux del repositorio no debe describirse como un despliegue completo de la UI.

## Instalación

El script usa `$HOME/SDK-Bot` por defecto. Desde un clon en esa ruta:

```bash
bash deploy/termux/setup-termux.sh
```

También puede clonar el repositorio si aún no existe en la ruta configurada. Para usar otra ubicación, define `SDK_BOT_REPO` antes de ejecutar el script. El bootstrap instala paquetes Termux, Python y Node LTS, prepara dependencias de Brain/Gateway y registra `sdk-brain` y `sdk-gateway` en `$PREFIX/var/service`.

La configuración del Brain queda en `brain/.env`; complétala localmente y no la subas al repositorio. El script mantiene una copia de ese archivo y de `gateway/auth_info_baileys/` en `~/.sdk-bot-secrets/`; protege también ese directorio. La sesión de WhatsApp es sensible.

El Brain usa `apps/brain/requirements-termux.txt`. Ese archivo omite `google-genai`; no asumas que el proveedor Gemini está disponible en Termux.

## Estado y operación

```bash
sv status sdk-brain sdk-gateway
sv up sdk-brain sdk-gateway
sv down sdk-brain sdk-gateway
```

El log del Gateway se escribe en `~/logs/sdk-gateway.log`. El bootstrap activa `termux-wake-lock` y crea `~/.termux/boot/start-services.sh`; el arranque tras reiniciar requiere la aplicación Termux:Boot instalada y configurada.

Para actualizar, usa el script incluido:

```bash
bash deploy/termux/update-termux.sh
```

Este hace `git pull --ff-only origin main`, reinstala dependencias si detecta cambios en manifiestos/contratos y reinicia los dos servicios. No lo ejecutes con modificaciones locales que no quieras integrar; el pull fast-forward puede rechazarlas.

## Límites

- El bootstrap inicia Brain y Gateway, no el panel ni `/inbox`.
- Protege `brain/.env`, la sesión de WhatsApp y `~/.sdk-bot-secrets/`.
- Detén los servicios con `sv down` antes de un reset o cambio destructivo. Consulta [reset seguro](../../docs/RESET-SEGURO.md) y [operación/recuperación](../../docs/OPERACION-RECUPERACION.md).
- La CI del repositorio corre en Ubuntu; no afirma que el flujo Termux esté probado por CI.
