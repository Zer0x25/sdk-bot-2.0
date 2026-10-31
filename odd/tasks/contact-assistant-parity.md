Objective: restore existing contact agenda and global assistant profile capabilities in inbox UX.
Branch: feat/contact-assistant-parity. Delivery: ask-on-risk. Checks: focused gateway/panel suites.

## Specs
- S1: "Recuperar la agenda completa en la nueva UX." "contacto sin conversación;" "contacto con chat que se puede abrir;" "permiso de automatización y atención humana."
- S2: "Agregar la selección visible del **perfil global activo** y explicar cuándo un contacto lo hereda o tiene uno propio."
- S3: "Mostrarlos en solo lectura (recomendado)" — "Recuperamos visibilidad de toda la agenda y mantenemos edición para conversaciones identificadas."
- S4: "sin rehacer backend" "No hace falta rehacer el backend ni pasar ahora por pruebas de conexión."

## Tasks
- T0 [S4] inline: isolate gateway control-service test before importing runtime modules; done: 12 focused tests passed; commit 6753801.
- T1 [S1,S3,S4] delegated: expose existing agenda safely and implement contacts UX; blocked: delegated writer unavailable under build-output restrictions; commit pending.
- T2 [S2,S4] delegated/inline: expose global profile selection via existing authority and assistant UX; blocked: installed contract copies are stale and require authorization to synchronize; commit pending.
- T3 [S1-S4] independent verification: security, authority and functional flows; pending; commit pending.

## Log
- L1: "hazlo"
- L2: "la app ya manejaba de cierta forma varios puntos el /inbox es una capa UX, si lko sabes?"
- L3: "salta la pruebas de conexxion no tengo el itempo de enfoque que necesito  en estos momenteos, salta este paso y en que podemos avanzar?? los contactos, la configuracoin del asistente?"
- L4: "Mostrarlos en solo lectura (recomendado)" — "Recuperamos visibilidad de toda la agenda y mantenemos edición para conversaciones identificadas."
- L5: Agenda writer reported safe mapping across ambiguous/excluded identities unproven; no code changes.
- L6: Global profile writer reports existing status is not reliably canonical under SQLite control; a narrow authority read may be needed. No source changes or tests.
- L7: "ok" — user approved "extensiones puntuales de lectura en el backend existente" para asociación segura y política canónica, sin reescribir backend ni conectar canales reales.
- L8: "Autorizar pruebas y build" — user authorized test-owned temporary directories under /tmp and regeneration of apps/panel/web/dist/ for this work. Agenda worker still declined destructive generated build by its independent restrictions; no code changes.
- L9: Global profile worker stopped: gateway test module imports may initialize default runtime state before temporary isolation; frontend runner cache scope not established. No source changes, no test-first evidence.
- L10: "si hazlo" — user approved preparing an isolated test environment before resuming implementation.
- L11: controlService.test.js now initializes temporary contacts/settings and dummy brain key before imports; 12 focused tests passed. RED omitted to avoid importing real runtime state before isolation. Native assess unassessable because of untracked scope. Remaining suites and writer build constraints are not resolved.
- L12: "avanza" — user accepts build proof may remain pending; continue safely with available focused tests.
- L13: Partial T2 adds canonical read, admin profile selection and React UI. Gateway 13 tests passed using test-only contract resolution to workspace; contracts check and 12 focused frontend tests passed. Panel typecheck failed because apps/panel/node_modules/@sdk-bot/contracts is an old copy; same issue exists under apps/gateway/node_modules. Implementation unverified and uncommitted. No real channel tests. Need authorization before replacing installed dependency copies.
