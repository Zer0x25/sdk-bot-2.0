# `@sdk-bot/contracts`

Paquete privado con schemas, contrato OpenAPI, tipos TypeScript y validación runtime compartidos. No implementa transporte, persistencia, sesión ni autorización; validar un DTO no concede permiso para ejecutar una operación.

## Archivos fuente

- `schema.json`: schemas JSON de los DTOs.
- `openapi.json`: rutas y respuestas públicas, enlazadas a los schemas.
- `generated.d.ts`: tipos generados desde OpenAPI.
- `index.js` / `index.d.ts`: API de validación y tipos del paquete.

No edites tipos generados para cambiar un contrato. Cambia la fuente correspondiente y regenera/verifica:

```bash
# Desde la raíz del repositorio
npm ci
npm run contracts:generate
npm run check
```

`npm run check` en la raíz valida el workspace de contratos. Gateway y panel consumen el paquete mediante `file:../../packages/contracts` y mantienen instalaciones/locks propios. Después de cambiar contracts, reinstala en ambos:

```bash
(cd apps/gateway && npm ci)
(cd apps/panel && npm ci)
```

La CI comprueba contratos, Gateway/panel y Brain por separado; consulta [el workflow de CI](../../.github/workflows/ci.yml) para comandos y versiones probadas.

## Consumo

```typescript
import { assertValid, validate, type Contract } from '@sdk-bot/contracts';

const result = validate('TakeoverRequest', inputDesconocido);
if (result.valid) {
  const version: string = result.value.expectedVersion;
}

const id = assertValid('TelegramChatId', '-9007199254740993');
type Message = Contract<'Message'>;
```

`validate` devuelve un valor validado o errores saneados; `assertValid` devuelve el valor o lanza `TypeError`. La validación no convierte tipos, aplica defaults, elimina campos ni sustituye los controles de sesión, permisos, propiedad, idempotencia o estado durable que corresponden al servidor.
