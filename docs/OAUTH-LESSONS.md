# Configuración OAuth del panel

El panel usa OAuth 2.0 de Google. Esta guía conserva los requisitos operativos; la implementación vigente está en `apps/panel/index.js` y sus módulos de identidad/proxy.

## Configuración

1. Crea en Google Cloud un cliente OAuth de tipo aplicación web.
2. Registra el origen público del panel y la URI de retorno `https://<host>/auth/callback`.
3. Guarda en `gateway/panel/.env`:
   - `PANEL_GOOGLE_CLIENT_ID`
   - `PANEL_GOOGLE_CLIENT_SECRET`
   - `PANEL_SESSION_SECRET` fijo y protegido
   - `PANEL_PUBLIC_URL` con la URL canónica registrada
   - `PANEL_ALLOWED_EMAILS` si quieres restringir qué cuentas verificadas pueden acceder
4. Reinicia el proceso del panel después de cambiar configuración.

No incluyas valores reales de estas variables en Git, issues, capturas ni logs. El repositorio incluye una plantilla en `apps/panel/.env.example`.

## Comportamiento relevante

- El panel guarda el `state` OAuth en memoria del servidor, con TTL de 10 minutos y uso único; no depende de una cookie para transportar el `state`.
- La cookie de sesión usa `HttpOnly` y `SameSite=Lax`; `Secure` se activa al servir bajo HTTPS. La sesión dura 12 horas.
- En producción, OAuth es obligatorio. En desarrollo, el panel puede permanecer abierto; no expongas el modo de desarrollo a una red no confiable.
- `PANEL_PUBLIC_URL` evita que el callback se construya a partir de una IP o alias distinto del que Google tiene autorizado.

## Diagnóstico

- **Callback rechaza `state`:** confirma que el proceso ve la URL canónica, que el callback vuelve al mismo host registrado y que el flujo no excedió los 10 minutos ni cruzó un reinicio del panel.
- **Vuelve a la pantalla de login:** comprueba que el navegador conserva cookies para el mismo host y que la configuración HTTPS/reverse proxy coincide con la URL pública.
- **No permite entrar:** comprueba las credenciales OAuth y, si `PANEL_ALLOWED_EMAILS` está configurado, la cuenta autorizada. La cuenta debe estar verificada por Google.

Para secreto compartido Panel→Gateway, grants y límites de red, consulta [seguridad del panel](FRONTERA-AUTENTICADA-V1.md).
