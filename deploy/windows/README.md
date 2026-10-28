# Inicio en Windows

El repositorio incluye dos launchers `.bat`: uno para Brain y otro para Gateway. No hay un launcher Windows incluido para el panel.

## Requisitos

- Python 3.12 o superior disponible en `PATH`.
- Node.js 22.13 o superior.
- Un clon del repositorio con el estado runtime local bajo `brain/` y `gateway/`.

## Arranque

Abre dos terminales desde la raíz del repositorio, en este orden:

```bat
deploy\windows\startBrain.bat
```

```bat
deploy\windows\startGateway.bat
```

`startBrain.bat` crea `brain\venv` si falta, instala `apps\brain\requirements.txt` y ejecuta `apps\brain\main.py`. `startGateway.bat` comprueba las dependencias/contracts instalados y ejecuta `apps\gateway\index.js`; instala dependencias con `npm ci` cuando faltan o no coinciden.

Mantén ambas terminales abiertas. `Ctrl+C` detiene cada proceso. Los scripts no configuran un supervisor ni programan el arranque automático.

## Sesión y reset

La sesión de WhatsApp y el estado runtime quedan bajo `gateway\`; la configuración/estado del Brain, bajo `brain\`. Protégelos y no los incluyas en Git. Para renovar solo la sesión o hacer un reset de fábrica, sigue [reset seguro](../../docs/RESET-SEGURO.md) y detén antes los procesos.

El flujo Windows no se ejecuta en el workflow de CI, que valida en Ubuntu; esta guía no afirma pruebas de despliegue en Windows.
