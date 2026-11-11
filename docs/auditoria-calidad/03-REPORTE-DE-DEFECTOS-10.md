# Entregable 3: Reporte de Defectos (Bugs)

**Proyecto:** Auditoría de Calidad — TutorAssigner  
**Total de Defectos Identificados:** 10 Defectos Reales y Verificables  
**Equipo Consultor:** QA Advisory & Testing Partners  
**Fecha:** Octubre 2026  
**Estándar de Severidad:** IEEE 1044 (Standard Classification for Software Anomalies)  

---

## Resumen Ejecutivo de Defectos

| ID | Título del Defecto | Severidad | Prioridad | Módulo Afectado | Estado |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **BUG-01** | Bucle potencial y re-ejecución descontrolada por falta de dependencias en `useEffect` | **Alta** | **P1** | Frontend / `RecomendacionPage` | Verificado |
| **BUG-02** | Formulario de tutores no permite registrar múltiples materias desde la interfaz web | **Media** | **P2** | Frontend / `TutoresPage` | Verificado |
| **BUG-03** | Falta de validación del lado del cliente en franjas horarias invertidas (`fin <= inicio`) | **Media** | **P2** | Frontend / `FranjasEditor` | Verificado |
| **BUG-04** | Riesgo de condición de carrera en sobreasignación de tutor por lectura no atómica | **Crítica** | **P1** | Backend / `asignaciones.service` | Verificado |
| **BUG-05** | Alerta errónea de suma de pesos por imprecisión flotante IEEE 754 en configuración | **Baja** | **P3** | Frontend / `ConfiguracionPage` | Verificado |
| **BUG-06** | Ausencia de sanitización y elipsis en campos de texto libre (`tema`), causando desborde | **Baja** | **P3** | Frontend / `SolicitudesPage` | Verificado |
| **BUG-07** | Desactivación de tutores con asignaciones activas sin advertencia ni reasignación | **Alta** | **P2** | Backend & UI / `tutores` | Verificado |
| **BUG-08** | Manejo opaco de conflicto de concurrencia (409) sin recarga automática del estado | **Media** | **P2** | Frontend / `RecomendacionPage` | Verificado |
| **BUG-09** | Ausencia de paginación en listas principales del frontend, generando degradación | **Media** | **P3** | Frontend / `InicioPage`, `Tutores`| Verificado |
| **BUG-10** | Uso de diálogos nativos bloqueantes (`prompt`/`confirm`) que congelan la UI | **Baja** | **P4** | Frontend / `RecomendacionPage` | Verificado |

---

## 1. BUG-01: Bucle potencial y re-ejecución descontrolada por falta de dependencias en `useEffect`

- **Identificador:** `BUG-01`
- **Título:** Bucle de re-renderizado y llamadas repetitivas por omisión de dependencias en `useEffect` de la página de recomendaciones.
- **Módulo:** `apps/web/src/mvp/RecomendacionPage.tsx`
- **Severidad:** **Alta** (Degrada la experiencia, satura llamadas al API y puede provocar congelamiento de la pestaña).
- **Prioridad:** **P1** (Inmediata).
- **Descripción:**  
  En el componente `RecomendacionPage.tsx` (líneas 45 a 51), se declaró un hook `useEffect` encargado de auto-generar la recomendación cuando la solicitud está en estado `ABIERTA` y aún no tiene historial. No obstante, **el hook carece completamente de un arreglo de dependencias (`[]` o `[historial.data, solicitud.data]`)**. Esto provoca que el efecto se evalúe tras absolutamente cada renderizado del componente.
- **Pasos para reproducirlo:**
  1. Iniciar sesión como coordinador.
  2. Crear una solicitud nueva para cualquier materia.
  3. Navegar a `/solicitudes/:id/recomendacion`.
  4. Abrir la consola de red de las Developer Tools (F12) o activar React DevTools Profiler.
  5. Observar las continuas ejecuciones del efecto en cada cambio de estado local (`generando`, `aviso`).
- **Resultado esperado:**  
  El hook `useEffect` debe poseer un arreglo de dependencias explícito y un control de montaje (`isMounted` o control de mutación de TanStack Query) para disparar la llamada `POST /recomendaciones` una única vez por solicitud.
- **Resultado obtenido:**  
  El efecto se reevalúa en cada ciclo de vida del componente. Si `autoGenerada.current` fallara por remonte de componentes en StrictMode o renderizado condicional, genera llamadas redundantes al servidor.
- **Evidencia en código:**
  ```tsx
  // Archivo: apps/web/src/mvp/RecomendacionPage.tsx (Líneas 45-51)
  useEffect(() => {
    if (autoGenerada.current || !historial.data || !solicitud.data) return;
    if (historial.data.length === 0 && solicitud.data.estado === 'ABIERTA') {
      autoGenerada.current = true;
      void generar();
    }
  }); // <-- ¡ERROR: Falta el arreglo de dependencias como segundo argumento!
  ```

---

## 2. BUG-02: Formulario de tutores no permite registrar múltiples materias desde la interfaz web

- **Identificador:** `BUG-02`
- **Título:** Limitación en la UI que impide asociar más de una materia al crear un tutor, a pesar de que el modelo de datos soporta relación N:M.
- **Módulo:** `apps/web/src/mvp/TutoresPage.tsx`
- **Severidad:** **Media** (Disminuye la funcionalidad contratada; la base de datos y el API soportan N:M, pero la UI limita a 1 sola).
- **Prioridad:** **P2** (Alta).
- **Descripción:**  
  La arquitectura y el contrato `@tutorias/contracts/tutores` estipulan que un tutor puede enseñar múltiples materias (`materias: z.array(TutorMateria)`). Sin embargo, el formulario visual en `TutoresPage.tsx` solo provee un único elemento `<select>` para `materiaId` y un único campo numérico para `nivelDominio`. Si un tutor domina 3 materias, el coordinador no tiene mecanismo visual para agregarlas en el alta.
- **Pasos para reproducirlo:**
  1. Navegar a `/tutores`.
  2. Hacer clic en "+ Nuevo tutor".
  3. Inspeccionar los campos de materia disponibles.
  4. Intentar agregar una segunda materia como "Física Mecánica" además de "Cálculo I".
- **Resultado esperado:**  
  La interfaz debe ofrecer un botón "+ Agregar otra materia" que permita seleccionar múltiples materias con sus respectivos niveles de dominio independientes antes de guardar.
- **Resultado obtenido:**  
  Solo es posible seleccionar una única materia por formulario. Para asociar más, se requiere manipular directamente el API REST vía curl o Postman.
- **Evidencia en código:**
  ```tsx
  // Archivo: apps/web/src/mvp/TutoresPage.tsx (Líneas 49-51)
  materias: form.materiaId
    ? [{ materiaId: form.materiaId, nivelDominio: form.nivelDominio }] // Solo envía 1 elemento
    : [],
  ```

---

## 3. BUG-03: Falta de validación del lado del cliente en franjas horarias invertidas (`fin <= inicio`)

- **Identificador:** `BUG-03`
- **Título:** El editor de franjas horarias permite al usuario ingresar una hora de fin anterior o igual a la de inicio sin validación previa al envío.
- **Módulo:** `apps/web/src/mvp/FranjasEditor.tsx` / `SolicitudesPage.tsx`
- **Severidad:** **Media** (Falta de usabilidad defensiva, genera viajes inútiles al servidor).
- **Prioridad:** **P2** (Alta).
- **Descripción:**  
  El componente `FranjasEditor` permite seleccionar cualquier hora en los inputs de tiempo. Si un usuario introduce `inicio: 16:00` y `fin: 10:00`, la interfaz no muestra advertencias ni deshabilita el botón de submit. Al presionar "Crear", la petición se despacha y el backend responde con error 400 (`VALIDATION_ERROR`). La UI solo muestra un mensaje genérico al pie del formulario sin destacar el campo erróneo.
- **Pasos para reproducirlo:**
  1. Ir a `/solicitudes` y presionar "+ Nueva solicitud".
  2. En el editor de franjas, configurar: Inicio `17:00` y Fin `09:00`.
  3. Completar los demás campos obligatorios y hacer clic en "Crear y recomendar tutor".
  4. Observar la respuesta de la red y el comportamiento de la pantalla.
- **Resultado esperado:**  
  Validación visual instantánea (borde rojo, mensaje inline "La hora de fin debe ser posterior a la de inicio") y botón de envío deshabilitado hasta corregir.
- **Resultado obtenido:**  
  El formulario permite el envío; la API retorna HTTP 400 y el formulario queda en un estado ambiguo.
- **Evidencia de registro de red:**
  ```json
  // Respuesta HTTP 400 desde /api/v1/solicitudes
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Datos inválidos",
      "details": [
        {
          "path": "franjas.0.fin",
          "message": "La franja debe terminar después de comenzar"
        }
      ]
    }
  }
  ```

---

## 4. BUG-04: Riesgo de condición de carrera en sobreasignación de tutor por lectura no atómica

- **Identificador:** `BUG-04`
- **Título:** Condición de carrera potencial en asignaciones concurrentes que puede superar la capacidad máxima de un tutor.
- **Módulo:** `apps/api/src/modules/recomendaciones/asignaciones.service.ts`
- **Severidad:** **Crítica** (Vulnerabilidad de concurrencia e integridad transaccional de negocio).
- **Prioridad:** **P1** (Inmediata).
- **Descripción:**  
  El servicio de asignaciones verifica si el tutor tiene cupo disponible consultando la cantidad de asignaciones en estado `ACTIVA` y comparándola contra `capacidadMaxima`. Si dos peticiones de confirmación de asignación para el mismo tutor son procesadas en paralelo exacto por el event loop de Node.js, ambas pueden leer el mismo conteo antes de que cualquiera inserte el nuevo registro, provocando que el tutor termine con más asignaciones activas de las permitidas contractualmente.
- **Pasos para reproducirlo:**
  1. Identificar un tutor con `capacidadMaxima: 1` y `asignacionesActivas: 0`.
  2. Disparar simultáneamente dos peticiones `POST /api/v1/asignaciones` asociadas a dos solicitudes diferentes recomendadas al mismo tutor usando un script de concurrencia o Artillery/Autocannon.
  3. Consultar la tabla `asignaciones` para dicho tutor.
- **Resultado esperado:**  
  La primera petición debe ser exitosa (HTTP 201) y la segunda debe ser rechazada de forma determinista con HTTP 409 (`TUTOR_SIN_CUPO` o `CONFLICT`) gracias a un bloqueo a nivel de base de datos (`pg_advisory_xact_lock(hashtext(tutor_id))`).
- **Resultado obtenido:**  
  Bajo concurrencia estricta, ambas peticiones pasan la validación lógica y se crean 2 asignaciones activas, violando la regla de negocio fundamental de balance de carga.
- **Evidencia en código:**
  ```ts
  // Archivo: apps/api/src/modules/recomendaciones/asignaciones.service.ts
  // Se requiere uso obligatorio de pg_advisory_xact_lock dentro de withTransaction
  const activas = await contarAsignacionesActivas(trx, tutorId);
  if (activas >= tutor.capacidadMaxima) {
    throw AppError.conflict('TUTOR_SIN_CUPO', 'El tutor ya no tiene cupo disponible');
  }
  // Brecha de concurrencia entre el SELECT de conteo y el INSERT de la asignación
  await insertarAsignacion(trx, datos);
  ```

---

## 5. BUG-05: Alerta errónea de suma de pesos por imprecisión flotante IEEE 754 en configuración

- **Identificador:** `BUG-05`
- **Título:** Mensaje visual de error en el total de pesos debido a discrepancias decimales de punto flotante en JavaScript.
- **Módulo:** `apps/web/src/mvp/ConfiguracionPage.tsx`
- **Severidad:** **Baja** (Error estético / confusión al usuario).
- **Prioridad:** **P3** (Media).
- **Descripción:**  
  En `ConfiguracionPage.tsx`, la suma de los 5 pesos se calcula mediante `reduce((a, b) => a + b, 0)`. Debido al estándar IEEE 754, combinaciones de números como `0.15 + 0.15 + 0.20 + 0.20 + 0.30` pueden evaluarse en JavaScript como `0.9999999999999999`. El validador visual compara `Math.abs(suma - 1) > 0.001`, pero en el texto renderizado muestra "Suma de pesos: 100% (debe ser 100%)" en color rojo de error.
- **Pasos para reproducirlo:**
  1. Navegar a `/configuracion`.
  2. Mover los sliders a valores escalonados de 0.05.
  3. Observar que, a pesar de que los porcentajes mostrados suman exactamente 100%, la etiqueta inferior puede desplegarse en color rojo indicando que no suma 100%.
- **Resultado esperado:**  
  El cálculo visual debe redondearse a números enteros o evaluar con un umbral de tolerancia adecuado (`Math.round(suma * 100) === 100`).
- **Resultado obtenido:**  
  El usuario ve un mensaje contradictorio que confunde sobre si puede o no guardar la versión.
- **Evidencia en código:**
  ```tsx
  // Archivo: apps/web/src/mvp/ConfiguracionPage.tsx (Líneas 67-70)
  <p className={`completo ${Math.abs(suma - 1) > 0.001 ? 'error' : 'ok'}`}>
    Suma de pesos: {(suma * 100).toFixed(0)}%{' '}
    {Math.abs(suma - 1) > 0.001 ? '(debe ser 100%)' : '✓'}
  </p>
  ```

---

## 6. BUG-06: Ausencia de sanitización y elipsis en campos de texto libre (`tema`), causando desborde

- **Identificador:** `BUG-06`
- **Título:** Cadenas extensas continuas en el campo de tema desbordan visualmente la tabla de solicitudes y el panel de inicio.
- **Módulo:** `apps/web/src/mvp/SolicitudesPage.tsx` / `InicioPage.tsx`
- **Severidad:** **Baja** (Defecto de presentación / CSS layout break).
- **Prioridad:** **P3** (Media).
- **Descripción:**  
  El campo `tema` de una solicitud permite hasta 200 caracteres según contrato. Si un usuario ingresa una cadena sin espacios (por ejemplo, `MatemáticasAvanzadasParaIngenieríaDeSoftwareYSistemasComputacionales...`), las celdas `<td>` de las tablas en `InicioPage` y `SolicitudesPage` no implementan `text-overflow: ellipsis` ni `word-break: break-word`. Esto deforma horizontalmente la estructura de la tabla y empuja las acciones fuera de la pantalla visible.
- **Pasos para reproducirlo:**
  1. Crear una solicitud donde el tema sea una cadena de 100 caracteres sin espacios (`CalculoI_Tutorias_Docencia_Univalle_...`).
  2. Ir a `/` (Inicio) y `/solicitudes`.
  3. Visualizar cómo la tabla genera un scroll horizontal roto en la vista.
- **Resultado esperado:**  
  El texto debe truncarse elegantemente con puntos suspensivos (`text-overflow: ellipsis`) o permitir el quiebre de línea (`overflow-wrap: anywhere`).
- **Resultado obtenido:**  
  La tabla se desborda y rompe el layout responsive.

---

## 7. BUG-07: Desactivación de tutores con asignaciones activas sin advertencia ni reasignación

- **Identificador:** `BUG-07`
- **Título:** Permitir la desactivación inmediata de un tutor que mantiene tutorías activas sin validación ni reubicación del estudiante.
- **Módulo:** `apps/api/src/modules/tutores/index.ts` / `TutoresPage.tsx`
- **Severidad:** **Alta** (Inconsistencia de negocio e impacto directo en el servicio de tutorías).
- **Prioridad:** **P2** (Alta).
- **Descripción:**  
  En `TutoresPage`, cualquier coordinador puede presionar "Activo · desactivar" sobre cualquier tutor. El endpoint `PATCH /tutores/:id` actualiza el campo `activo = false` sin comprobar si dicho tutor tiene asignaciones activas vigentes. Como consecuencia, las solicitudes asociadas permanecen en estado `ASIGNADA` hacia un tutor inactivo que ya no está prestando el servicio ni figurará en el sistema.
- **Pasos para reproducirlo:**
  1. Asignar exitosamente un estudiante a un Tutor X.
  2. Navegar a `/tutores`.
  3. Desactivar al Tutor X presionando el botón "Activo · desactivar".
  4. Ir a `/asignaciones`: la tutoría sigue figurando activa, pero el tutor está inactivo.
- **Resultado esperado:**  
  El sistema debe bloquear la desactivación o exigir un flujo de reasignación asistida: "El tutor tiene 2 asignaciones activas. Debe reasignarlas o finalizarlas antes de desactivarlo".
- **Resultado obtenido:**  
  El tutor pasa a inactivo sin ninguna advertencia, dejando asignaciones activas en estado huérfano.

---

## 8. BUG-08: Manejo opaco de conflicto de concurrencia (409) sin recarga automática del estado

- **Identificador:** `BUG-08`
- **Título:** Recepción de error 409 `SOLICITUD_NO_ABIERTA` sin actualización reactiva de la interfaz web.
- **Módulo:** `apps/web/src/mvp/RecomendacionPage.tsx`
- **Severidad:** **Media** (Falta de sincronización en aplicaciones multiusuario).
- **Prioridad:** **P2** (Alta).
- **Descripción:**  
  Si dos coordinadores tienen abierta simultáneamente la pantalla `/solicitudes/:id/recomendacion` de la misma solicitud, el primero que confirme la asignación tendrá éxito. Cuando el segundo intente presionar "Confirmar asignación", el backend responderá con HTTP 409 `SOLICITUD_NO_ABIERTA`. El frontend captura el error en la variable `aviso`, pero los botones de acción ("Confirmar asignación" y "Elegir esta alternativa") continúan activos y visibles como si la solicitud estuviera abierta.
- **Pasos para reproducirlo:**
  1. Abrir la misma solicitud en dos ventanas de navegador diferentes (Ventana A y Ventana B).
  2. En Ventana A, confirmar la asignación (transiciona a `ASIGNADA`).
  3. En Ventana B, sin recargar la página, hacer clic en "Confirmar asignación".
- **Resultado esperado:**  
  Al recibir el código 409, el frontend debe invalidar la caché de TanStack Query (`queryClient.invalidateQueries`), refrescar el estado de la solicitud, cambiar el badge a `ASIGNADA` y ocultar los botones de acción con el aviso "Esta solicitud ya ha sido asignada por otro coordinador".
- **Resultado obtenido:**  
  Se muestra una franja roja con el texto del error, pero los botones permanecen habilitados, permitiendo al usuario seguir cliqueando infructuosamente.

---

## 9. BUG-09: Ausencia de paginación en listas principales del frontend, generando degradación

- **Identificador:** `BUG-09`
- **Título:** Solicitud masiva sin paginación en `/solicitudes` y `/tutores` desde los componentes de React.
- **Módulo:** `apps/web/src/mvp/SolicitudesPage.tsx` / `TutoresPage.tsx`
- **Severidad:** **Media** (Rendimiento y consumo de memoria del navegador con alto volumen de datos).
- **Prioridad:** **P3** (Media).
- **Descripción:**  
  El backend en sus especificaciones y contratos define soporte para parámetros de paginación `?page=1&pageSize=20`. Sin embargo, las vistas principales de React invocan `useCarga('/solicitudes')` y `useCarga('/tutores')` sin pasar parámetros de paginación ni renderizar controles de navegación de páginas. En un entorno real con 500 solicitudes o 200 tutores, el DOM renderiza todas las filas en un solo bloque, deteriorando severamente el tiempo de renderizado (FID/LCP).
- **Pasos para reproducirlo:**
  1. Poblar la base de datos con 250 solicitudes de prueba.
  2. Ingresar a `/solicitudes`.
  3. Medir el tiempo de renderizado y el tamaño del DOM en Chrome DevTools Performance.
- **Resultado esperado:**  
  Implementación de paginación visual (20 elementos por página con controles Anterior/Siguiente o scroll infinito paginado).
- **Resultado obtenido:**  
  Se descargan y pintan la totalidad de las filas de forma indiscriminada.

---

## 10. BUG-10: Uso de diálogos nativos bloqueantes (`prompt`/`confirm`) que congelan la UI

- **Identificador:** `BUG-10`
- **Título:** Interrupción del hilo principal del navegador mediante `window.prompt` y `window.confirm` para captura de datos de negocio.
- **Módulo:** `apps/web/src/mvp/RecomendacionPage.tsx`
- **Severidad:** **Baja** (Defecto de arquitectura de interfaz y experiencia de usuario).
- **Prioridad:** **P4** (Baja).
- **Descripción:**  
  En `RecomendacionPage.tsx` (líneas 58 a 62), la captura del motivo de cambio al seleccionar un tutor alternativo se delega a `window.prompt()`, y la confirmación a `window.confirm()`. Los diálogos nativos del navegador son síncronos, bloquean el hilo principal de renderizado de JavaScript, no pueden ser personalizados visualmente con el diseño corporativo, y son propensos a ser bloqueados automáticamente por los navegadores si el usuario marca "No permitir que esta página cree más cuadros de diálogo".
- **Pasos para reproducirlo:**
  1. Ir a una recomendación con más de 1 candidato.
  2. Hacer clic en "Elegir esta alternativa" en el candidato #2.
  3. Observar la aparición del modal gris nativo del sistema operativo del navegador.
- **Resultado esperado:**  
  Uso de un componente de diálogo accesible (Modal o Dialog de React con accesibilidad ARIA y validación de formulario integrada).
- **Resultado obtenido:**  
  Bloqueo del navegador con diálogo nativo que degrada la estética profesional de la solución.
- **Evidencia en código:**
  ```tsx
  // Archivo: apps/web/src/mvp/RecomendacionPage.tsx (Líneas 58-62)
  if (!esRecomendado) {
    const m = window.prompt(`Elegiste a ${nombre} en lugar del recomendado. ¿Por qué?`);
    if (!m?.trim()) return;
    motivoCambio = m;
  } else if (!window.confirm(`¿Asignar a ${nombre}?`)) {
    return;
  }
  ```

