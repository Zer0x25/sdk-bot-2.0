# Inbox React simulado

1. Desde la raíz, construye el panel actual: `npm --prefix apps/panel run build`.
2. Inicia el mock local: `npm --prefix apps/gateway run simulator`.
3. Abre el inbox React real en `http://127.0.0.1:4179/inbox/`. Abre el control en otra pestaña: `http://127.0.0.1:4179/simulator`.
4. En el inbox, abre la conversación sintética «Contacto simulado» y usa **Tomar control** para habilitar el compositor. Inyecta entradas desde el control. Responde desde el compositor (solo simulado) y, para liberar el control, elige **Devolver a IA** → **Solo mensajes futuros**.

Se puede elegir un puerto, por ejemplo `npm --prefix apps/gateway run simulator -- --port 0`; la salida imprime la URL asignada. Solo acepta `127.0.0.1` y mantiene el estado en memoria, que desaparece al cerrar el proceso. No crea ni borra archivos de estado. No arranca el gateway/brain ni carga sus módulos, configuración, credenciales o estado; no conecta proveedores ni hace solicitudes a la red externa. El canal, la conversación, la sesión y sus capacidades son fixtures sintéticos. **El backend de gateway y el transporte de proveedor están simulados**: las respuestas del operador se agregan al historial local, no se entregan a nadie. El inbox React y su diseño son los del build actual del panel.

Control: `POST /simulator/incoming` acepta `{ "text": "..." }`; la UI de control lo usa y el API mock publica un evento para que el inbox actualice la conversación. La prueba de integración pública es `node --test apps/gateway/tests/simulator/server.test.js`; cubre servir el build, takeover, entrada sintética, respuesta simulada y release. La prueba no ejecuta navegador headless; el build y API se validan por separado.
