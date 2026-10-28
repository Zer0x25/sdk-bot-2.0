# Reset seguro

Hay dos operaciones distintas. Haz un backup antes de borrar estado y detén los procesos activos antes de ejecutarlas. No los reinicies manualmente hasta que el comando termine; el modo interactivo puede relanzar servicios al finalizar.

## Renovar la sesión de WhatsApp

Desde `apps/gateway/`:

```bash
npm run reset
```

En modo interactivo, confirma para eliminar solo `gateway/auth_info_baileys/`; el proceso inicia el Gateway para volver a vincular. El modo no interactivo elimina esa sesión y sale sin iniciar procesos:

```bash
npm run reset -- --yes
```

## Reset de fábrica

`npm run clean` borra el estado runtime: sesión de WhatsApp, contactos, settings, broadcasts, archivo SQLite de conversaciones y sus adjuntos, cola, memoria SQLite del Brain, logs y locks. **No borra** `brain/profiles/`.

El modo interactivo solicita confirmación doble. Para automatización existe `npm run clean -- --yes`; `--yes` omite preguntas, pero **no** omite las guardas de parada. El modo no interactivo termina sin relanzar servicios.

## Antes y después

1. Detén Gateway y Brain desde su supervisor (Compose, runit, systemd u otro) y evita que se reinicien durante la operación. No basta con matar un PID si el supervisor sigue activo.
2. Ejecuta el comando desde el paquete Gateway. Si la parada no puede verificarse o hay un proceso supervisado, el preflight aborta antes del borrado; no intentes saltarte esa protección.
3. Si el borrado falla a mitad de camino, puede quedar estado parcialmente eliminado. Mantén los procesos detenidos e inspecciona el resultado antes de reiniciar.
4. Tras `clean --yes`, inicia de nuevo el stack de forma explícita.

No uses `clean` como método para borrar un solo chat ni como procedimiento de recuperación. El inventario de estado y el chequeo de snapshots están en [operación y recuperación](OPERACION-RECUPERACION.md). Windows y Termux deben detenerse usando sus propios procesos/supervisores antes del reset; no asumas que el CLI los puede detener automáticamente.
