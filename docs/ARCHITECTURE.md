# Arquitectura actual

Este documento describe límites y ubicaciones presentes en el repositorio. El código, los contratos ejecutables y las pruebas son la referencia para el comportamiento detallado.

## Procesos

```text
WhatsApp / Telegram
        ↕
apps/gateway — adaptadores, control de conversación y persistencia
        ↕ bus HTTP privado
apps/panel — servidor, autenticación, proxy y UI legacy / React

apps/panel/web — bandeja React/TypeScript servida en /inbox
apps/brain — API Python para generación y contexto de IA
apps/stt — transcripción; servicio separado en Compose
```

- **Gateway:** único propietario de los transportes de canal. Recibe mensajes, aplica las reglas de conversación y escribe el archivo operativo SQLite. El acceso a SQLite se concentra en el worker del Gateway.
- **Panel:** proceso independiente. Proxyfica solicitudes hacia el bus interno; no inicia sesiones de WhatsApp/Telegram ni abre directamente el archivo SQLite del Gateway. La bandeja `/inbox` requiere `PANEL_CONVERSATIONS_UI_ENABLED=true`; `/` conserva la interfaz legacy.
- **Brain:** proceso separado que genera respuestas y mantiene su propio contexto/memoria. No debe acceder directamente al archivo SQLite del Gateway ni hablar con los canales.
- **STT:** transcripción en proceso/servicio independiente; su despliegue en Docker está definido en `deploy/docker/compose.yml`.
- **Contracts:** `packages/contracts/` contiene los schemas y artefactos wire compartidos. Su README describe generación y consumo.

## Código y estado

```text
apps/gateway/       código Node del Gateway
apps/panel/         servidor del panel y frontend
apps/brain/         código Python del Brain
apps/stt/           código de transcripción
packages/contracts/ contratos compartidos
gateway/            estado mutable del Gateway
gateway/panel/      configuración local del panel (no versionar)
brain/              estado/configuración mutable del Brain
brain/profiles/     perfiles Markdown versionados
```

El código se organiza bajo `apps/`; las rutas de estado permanecen en la raíz para no mezclar una reorganización del código con una migración de datos. `apps/gateway/lib/repoPaths.js` y `apps/brain/runtime_paths.py` resuelven las rutas del estado.

## Límites de seguridad

- La UI se comunica con el Gateway a través del servidor del panel y el bus interno configurado por `GATEWAY_INTERNAL_URL`.
- En producción, el panel usa autenticación Google cuando `NODE_ENV=production`. La frontera Panel→Gateway usa `SDK_PANEL_GATEWAY_SECRET`; no es una clave de proveedor de IA ni cifra el tráfico.
- El bus y el servidor de estado no deben publicarse a Internet. El proxy público, si existe, debe apuntar solo al panel.
- El estado mutable, sesiones y credenciales deben permanecer fuera del control de versiones.

Para requisitos de autenticación consulta [seguridad del panel](FRONTERA-AUTENTICADA-V1.md); para topología de producción, [Docker Compose](../deploy/docker/README.md).
