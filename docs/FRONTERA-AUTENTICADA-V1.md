# Seguridad y autenticación del panel

Guía operativa de la frontera entre navegador, panel y Gateway. Los requisitos de cada ruta se aplican en el código del panel, el Gateway y `packages/contracts/`.

## Panel y OAuth

En producción (`NODE_ENV=production`) el panel exige autenticación. Configura estas variables en `gateway/panel/.env` y protégelo como secreto:

- `PANEL_GOOGLE_CLIENT_ID` y `PANEL_GOOGLE_CLIENT_SECRET`: credenciales del cliente OAuth web.
- `PANEL_SESSION_SECRET`: valor fijo para firmar sesiones; si se omite, el panel genera uno efímero al arrancar y las sesiones no sobreviven al reinicio.
- `PANEL_PUBLIC_URL`: URL canónica del panel. Debe coincidir con el origen y la URI `/auth/callback` registrados en Google.
- `PANEL_ALLOWED_EMAILS`: lista CSV opcional de cuentas permitidas. Vacío permite cualquier cuenta Google verificada.

Si la autenticación es obligatoria pero faltan credenciales OAuth, el panel falla cerrado; no convierte la configuración incompleta en acceso abierto. El `state` de OAuth se conserva en memoria del servidor, expira a los 10 minutos y se consume una vez. Reiniciar el panel puede invalidar un flujo OAuth en curso.

La cookie de sesión es `HttpOnly` y `SameSite=Lax`; `Secure` se añade en HTTPS. El TTL de la sesión es de 12 horas. La identidad se deriva en el servidor de la sesión verificada; no aceptes un actor o capacidades enviados por el navegador.

## Autorización y firma Panel→Gateway

- `SDK_PANEL_GATEWAY_SECRET` debe tener al menos 32 bytes y llegar tanto al panel como al Gateway. Compose exige la variable para ambos servicios. No reutilices el secreto de sesión ni claves de IA.
- El panel firma el contexto de la solicitud y el Gateway lo valida. La firma autentica/integridad; no cifra el bus HTTP.
- Mantén `GATEWAY_INTERNAL_URL`, los puertos del bus y status en redes privadas. No publiques el bus ni el status en el proxy público.
- `PANEL_ACTOR_GRANTS` se configura del lado servidor, por identidad estable. Si no se configura, el acceso v1 queda limitado a lectura; las rutas legacy y UI legacy requieren el grant `admin:write`.
- Las rutas v1 comprueban la capacidad y el alcance que corresponde a cada operación. Un DTO válido no equivale a autorización.

## Desarrollo

En `NODE_ENV=development` el panel puede quedar abierto, incluso si hay credenciales OAuth definidas. No publiques ese modo en una red no confiable. Si necesitas limitar el acceso local, enlaza Panel, Brain y status a loopback mediante `ADMIN_WEB_HOST`, `BRAIN_HOST` y `STATUS_HOST`; no expongas un actor de desarrollo por túnel o proxy público.

No escribas secretos, cookies, tokens, payloads firmados ni cuerpos de mensajes en logs o documentación. Cambios de autenticación deben probarse con respuestas OAuth simuladas; no requieren una cuenta real para la suite.
