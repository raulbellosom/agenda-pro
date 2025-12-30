# Agenda Pro (Frontend) — JavaScript

Stack:
- React + Vite
- TailwindCSS 4.1
- Framer Motion + Lucide
- TanStack React Query (+ persist)
- PWA (vite-plugin-pwa)
- Appwrite (self-hosted v1.8.2 / 18.2.0)

## Configuración
1) Copia `.env.example` a `.env` y completa endpoint / project / database / collections.
2) Instala:
```bash
npm i
```
3) Ejecuta:
```bash
npm run dev
```

## Shared reutilizable
- `src/shared/` viene del zip que nos compartiste (UI, hooks, utils)
- `src/shared/appwrite/env.js` + `client.js` se usan como capa estándar para mapear IDs de colecciones y buckets.

## Paleta
Elegimos **Sky** (azul) porque comunica claridad, confianza y puntualidad.
Si quieres, después agregamos “mood colors” por calendario (personal/trabajo/salud).
