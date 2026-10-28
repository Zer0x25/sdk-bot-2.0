# Operación y recuperación

Procedimientos conservadores para proteger el estado del Gateway. No uses producción como fixture ni reemplaces una fuente activa con un snapshot antiguo.

## Estado que debe protegerse

En Compose, el volumen `sdk-bot-production-state` contiene estado operativo como la sesión de WhatsApp, bases JSON, cola, base SQLite de conversaciones, adjuntos y memoria. Es sensible: trátalo como si contuviera credenciales. Los logs viven en volúmenes separados. `brain/profiles/` se monta desde el repositorio; los archivos de entorno/secretos se gestionan aparte.

El repositorio no define un job automático de backup ni un destino externo. Antes de una operación destructiva o una actualización que pueda afectar estado:

1. Detén **panel, Gateway y Brain** con Compose y confirma que todos terminaron limpiamente (`Exited (0)`). No copies SQLite mientras haya escritores activos.
2. Captura el volumen completo de estado a un destino privado fuera del repositorio y, de preferencia, fuera del host. Verifica checksum y que el archivo pueda listarse antes de dar la copia por válida.
3. Registra el commit desplegado, digest de imágenes y fecha del backup. Restaura perfiles desde el commit y secretos desde el gestor aprobado; no los incluyas en un archivo público.
4. Conserva el volumen actual durante una recuperación. `docker compose down -v` elimina volúmenes y no es un mecanismo de rollback.

Los artefactos `VACUUM INTO` del archivo SQLite no sustituyen una copia del volumen: no incluyen la sesión de canal, los JSON, la cola ni los adjuntos.

## Comprobar un snapshot SQLite

La herramienta solo compara una base candidata con la fuente actual. **No restaura, copia ni promueve volúmenes.** Gateway debe estar detenido; las bases deben estar cerradas y sin `-wal`, `-shm` o `-journal`. El snapshot debe ser una copia separada, también para el directorio de adjuntos.

```bash
cd apps/gateway
npm run conversations:restore-check -- --snapshot /ruta/absoluta/copia/conversations.db
```

Si los adjuntos no están en el directorio `attachments/` junto a la base candidata, indícalos con `--snapshot-attachments /ruta/absoluta/attachments`. La fuente activa se resuelve con la configuración `SDK_CONVERSATIONS_DB_PATH` y rutas asociadas. El comando abre ambos archivos en solo lectura; código 0 significa que la comparación no encontró bloqueos, código 2 que no se debe continuar. Un resultado favorable no valida otros archivos/volúmenes ni autoriza por sí mismo una recuperación productiva.

## Reconciliar una base legacy antes de considerar replay

Si vas a importar un archivo SQLite antiguo que puede contener mensajes sin recibo `legacy_dispatch`, la ausencia del recibo significa **entrega desconocida**. No reproduzcas esos mensajes automáticamente.

```bash
cd apps/gateway
npm run conversations:legacy-reconcile -- --db /ruta/absoluta/legacy.db
```

La herramienta exige Gateway detenido y un archivo cerrado, genera un informe de solo lectura y nunca escribe en la base ni vuelve a enviar mensajes. Protege el informe localmente. Cada candidato requiere revisión humana con evidencia; una decisión de revisión es una atestación del operador, no una confirmación automática del proveedor. No uses una base activa ni elimines sus sidecars para forzar el análisis.

## Retención implementada

La purga del Gateway corre antes de admitir transportes y luego diariamente; procesa lotes limitados. La retención del ledger de generaciones del Brain se barre al inicio y periódicamente. Los valores son defaults de código y algunos son configurables.

| Dato | Regla por defecto |
|---|---|
| Cuerpos del archivo de conversaciones | 90 días desde `ingested_at` |
| Eventos | 7 días y, además, hasta 50.000 secuencias recientes |
| Huellas de deduplicación | 180 días |
| Adjuntos | 90 días; primero se marcan para borrar y luego se eliminan los bytes |
| Outbox | Intenciones no iniciadas vencen a las 24 h; resultados sensibles se redactan a los 90 días; terminales aceptados/rechazados pueden eliminarse a los 180 días. `delivery_unknown` no se reejecuta automáticamente |
| Invocaciones de herramientas, recibos terminales de Telegram y operaciones de control terminales | 180 días |
| Respuestas del ledger de generaciones del Brain | 7 días; tombstone hasta 30 días |

El contexto/memoria conversacional del Brain es separado del archivo operativo y se configura aparte. No hagas `DELETE` manual en SQLite para satisfacer una solicitud de borrado o recuperación; usa solo una operación soportada y revisada.

Las reglas ejecutables están en `apps/gateway/services/conversations/worker.js`, `eventRetention.js` y `retention.js`, y en `apps/brain/config.py`/`memory.py`. Los contratos de backup y recuperación deben mantenerse alineados con esos valores.
