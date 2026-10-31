Objective: isolated interactive inbox simulation. Branch: feat/simulated-inbox.
Delivery: ask-on-risk. Checks: focused fixture tests and applicable panel/gateway checks.

## Specs
- S1: "podemos simular los mensjes entrantes, lo importante es ver como se comporta la app en funcionamiento"
- S2: "prte del pairing, yo la saltaria y simularia mientras resolvemos el codigo"
- S3: "aislada de tus sesiones y conversaciones reales, para observar el recorrido completo sin enviar nada a proveedores."

## Tasks
- T1 [S1-S3] inline: implement and test isolated interactive fixture; done: focused integration and panel checks pass; commit 701ad42.
- T2 [S1-S3] delegated verification: independently check isolation and functional flow; done: independent API and isolation verification; user confirms it works; commit 701ad42.

## Log
- L1: "la conexcion real, ya lo he hecho y funciona, pero para estos caso, podemos simular los mensjes entrantes, lo importante es ver como se comporta la app en funcionamiento, y prte del pairing, yo la saltaria y simularia mientras resolvemos el codigo"
- L2: S3 quotes the assistant's isolation commitment; do not use real credentials, state or external providers.
- L3: Worker replaced its initial unrelated UI with the real panel build backed by a simulated API; its test run timed out. Static inspection found the test launches the child with stdin ignored but attempts child.stdin.end in cleanup. Full flow and isolation remain unverified. No commit.
- L4: "retome corrigiendo el cierre de esa prueba"
- L5: Corrected child stdin pipe; simulator integration test passed. Independent verifier passed build, API flow, panel tests and typecheck, but no browser-driven proof. Local simulator serves both routes HTTP 200. Chrome headless check timed out after 30s; do not retry automatically. Verifier unexpectedly created scratch directories outside project at /tmp/gpySFWLw/gaz0ijIr/tmp.7hkUOOShtR and /tmp/gpySFWLw/gaz0ijIr/tmp.woWYH62bz8; not removed. Native assessment unassessable due to undeclared untracked files.
- L6: "si me funciona" — user confirms manual operation without specifying individual actions. Implementation commit 701ad42; committed-range native assessment remained unassessable due to untracked scope.
