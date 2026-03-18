# Mobile Selector Pattern Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar un patrón reusable y mobile-first para selectores cortos y comboboxes buscables largos en la app mobile de rutas.

**Architecture:** Extraer un componente cliente compartido que decida entre `select` nativo y combobox buscable según el volumen de opciones. Mantener la obtención y el filtrado de datos en las páginas server existentes para no alterar permisos, RLS ni alcance de información.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, `node:test`.

---

### Task 1: Definir la lógica reusable del patrón

**Files:**
- Create: `app/_components/mobile-select-field-state.mjs`
- Test: `app/_components/mobile-select-field-state.test.mjs`

**Step 1: Write the failing test**

Cubrir:
- Umbral de `> 10` opciones para combobox buscable.
- Apertura inicial mostrando lista completa sin escribir.
- Reapertura con valor seleccionado mostrando lista completa.
- Filtrado en tiempo real cuando existe texto.

**Step 2: Run test to verify it fails**

Run: `node --test app/_components/mobile-select-field-state.test.mjs`
Expected: FAIL porque el módulo aún no existe.

**Step 3: Write minimal implementation**

Agregar helpers puros para:
- Detectar si el campo debe ser buscable.
- Resolver el query inicial al abrir.
- Filtrar opciones por texto.

**Step 4: Run test to verify it passes**

Run: `node --test app/_components/mobile-select-field-state.test.mjs`
Expected: PASS.

### Task 2: Extraer el componente reusable

**Files:**
- Create: `app/_components/mobile-select-field.tsx`
- Modify: `app/registros/registro-form.tsx`

**Step 1: Write the failing test**

Usar la lógica probada de Task 1 como contrato del componente: el componente debe abrir la lista completa al tocar el campo y elegir `select` nativo para listas cortas.

**Step 2: Run test to verify it fails**

Run: `node --test app/_components/mobile-select-field-state.test.mjs`
Expected: PASS sobre la lógica, mientras la implementación visual aún no existe.

**Step 3: Write minimal implementation**

Construir un componente reusable que:
- Soporte `value` controlado y `defaultValue` no controlado.
- Soporte `name`, `required`, `disabled`, `clearable`, `onChange`.
- Mantenga área táctil amplia, lista con scroll y botón claro para limpiar cuando aplique.
- Use `select` nativo si hay 10 opciones o menos.
- Use combobox buscable si hay más de 10 opciones.

**Step 4: Run test to verify it passes**

Run: `npm run lint`
Expected: PASS para el nuevo componente.

### Task 3: Migrar los selectores largos de registros

**Files:**
- Modify: `app/registros/registro-form.tsx`

**Step 1: Write the failing test**

La prueba de lógica ya debe proteger:
- Reapertura de lista completa.
- Filtrado en vivo.
- Umbral largo/corto.

**Step 2: Run test to verify it fails**

Run: `node --test app/_components/mobile-select-field-state.test.mjs`
Expected: PASS; usar esto como red de seguridad mínima antes del refactor.

**Step 3: Write minimal implementation**

Reemplazar el combobox embebido por el componente shared en:
- Selector de ubicación.
- Selector de producto.

Conservar:
- Valores hidden del formulario.
- Reseteo dependiente de producto/ubicación.
- Flujo edit/create.

**Step 4: Run test to verify it passes**

Run: `npx tsc --noEmit`
Expected: PASS.

### Task 4: Verificación final

**Files:**
- Inspect: `app/_components/mobile-select-field.tsx`
- Inspect: `app/registros/registro-form.tsx`

**Step 1: Run verification commands**

Run:
- `node --test app/_components/mobile-select-field-state.test.mjs`
- `npm run lint`
- `npx tsc --noEmit`

**Step 2: Review changed surfaces**

Confirmar pantallas actualizadas:
- `app/registros/nuevo/page.tsx`
- `app/registros/[recordId]/editar/page.tsx`

Confirmar componente reusable:
- `app/_components/mobile-select-field.tsx`

**Step 3: Commit**

No se hará commit salvo que el usuario lo pida.
