# Lista final de decisión para la primera publicación en producción

Estados: **APTO** (verificado y listo) · **APTO CON LIMITACIONES** (funcional, con riesgos conocidos) · **NO APTO** (hay que corregirlo antes de publicar).

La aplicación debe presentarse como **material de estudio no oficial ni certificado**: las preguntas están verificadas por IA contra su fuente (dos rondas de evaluación a ciegas más la redacción), **sin revisión humana independiente**. Este documento no autoriza ninguna publicación.

## A. Lo que podría bloquear la publicación
| Elemento | Estado | Evidencia / motivo |
|---|---|---|
| Compilación de producción: solo preguntas habilitadas y sin material interno | **APTO** | Era un fallo real (el paquete llevaba pendientes, retiradas y notas de auditoría); corregido con filtro de compilación, 3 pruebas y `check-dist` en el despliegue; comprobado que falla si se cuela un campo interno |
| Pruebas, tipos, lint, validador, compilación | **APTO** | 91 pruebas, `tsc`, `eslint`, validador y builds prod/lab en verde (`npm run pre-publicacion`) |
| Aislamiento producción / laboratorio (service worker, cachés, bases de datos) | **APTO** | `check-sw`, `check-pwa` y pruebas de almacenamiento: bases `agec1-prod`/`agec1-lab`, cachés `agec1-prod-…`/`agec1-lab-…` |
| Reglas del simulacro y puntuación | **APTO** | Pruebas de formato (40+30+supuesto de 20, 100 min, −1/3, reservas, doble eliminatoria) |
| Historial y actualización sin perder progreso | **APTO** | Pruebas de persistencia, `check-history-compat` (0 de 1.229 alteradas) y prueba del propietario en iPhone (7 comprobaciones OK) |
| Protección de `main` | **APTO** | PR obligatoria, comprobación requerida, sin force-push, también para administradores |
| Vigencia de la normativa | **APTO** | 35 normas del BOE guardadas, todas «SIN CAMBIOS» hoy; 0 enlaces rotos |
| Cifras de documentación y PR | **APTO** | Generadas desde los datos y vigiladas por prueba; PR 1 actualizada |
| Presentación como no oficial / no certificado | **APTO** | Aviso visible en Inicio y Ajustes; README y documentación lo dicen |
| Copias de seguridad del progreso | **ACCIÓN DEL PROPIETARIO** | Exportar el JSON desde cada dispositivo antes de publicar (`docs/PUBLICACION.md` §3); no es un fallo de la aplicación |
| Autorización expresa | **ACCIÓN DEL PROPIETARIO** | Sin ella no se fusiona ni se publica |

**Resultado: ningún elemento «NO APTO».** Los dos últimos son pasos previos del propietario, no defectos.

## B. Contenido
| Elemento | Estado | Riesgo conocido |
|---|---|---|
| Banco habilitado: 1.225 preguntas (710 teoría, 193 ofimática, 322 de supuestos), 13 supuestos, 45 temas con ≥ 10 | **APTO CON LIMITACIONES** | Verificación por IA: 757 preguntas distintas evaluadas a ciegas (707 siguen habilitadas, 57,7 %); el 42,3 % solo tiene redacción verificada y validación automática |
| Exactitud jurídica | **APTO CON LIMITACIONES** | Sin errores de fondo en 276 evaluaciones de la última ronda; las rondas anteriores hallaron y corrigieron 1 error y varias dudas; no equivale a una revisión humana |
| Cobertura del programa oficial | **APTO CON LIMITACIONES** | Matriz heurística + valoración manual: 39 cubiertos, 22 parciales, 15 pendientes, 2 solo en supuesto. Pendientes: confección de nóminas, hardware/software genérico, atención a personas con discapacidad, páginas web públicas, ventanilla única, libreta de direcciones de Outlook |
| Vigencia futura | **APTO CON LIMITACIONES** | IV Convenio único (podría sustituirse), Clases Pasivas a extinguir, edad de jubilación con régimen transitorio, páginas de Microsoft/Copilot cambiantes, fuentes en inglés (RFC 9110, CERN) |
| Sesgo de longitud de las respuestas | **APTO CON LIMITACIONES** | La correcta es la más larga en el 22,7 % (azar 25 %) y claramente más larga en el 5,1 %; CASE-A, CASE-B y CASE-L siguen en 45-55 % por diferencias de pocos caracteres |

## C. Aplicación
| Elemento | Estado | Riesgo conocido |
|---|---|---|
| PWA, instalación, modo sin conexión, actualización | **APTO CON LIMITACIONES** | Comprobado por scripts y por el propietario en iPhone/Safari sobre el laboratorio; **sin probar** en Chrome de escritorio ni en producción real (el navegador integrado no registra service workers). Se prueba tras publicar (`docs/PUBLICACION.md` §5) |
| Accesibilidad | **APTO CON LIMITACIONES** | axe-core (WCAG 2.2 AA y buenas prácticas) en 9 rutas y una sesión, tema claro y oscuro, sin violaciones; sin auditoría manual (lector de pantalla, teclado) |
| Historial importado desde el laboratorio | **APTO CON LIMITACIONES** | Las preguntas retiradas antes de publicar aparecen como «ya no está en el banco» |
| Reversión | **APTO CON LIMITACIONES** | Los datos son locales y no se pierden; una reversión grave deja instalada la versión anterior en los dispositivos hasta que se publique otra (sin service worker de desinstalación) |

## D. Mejoras que pueden esperar (no bloquean)
1. Revisión humana independiente del banco (prioridad: supuestos y temas con plazos).
2. Evaluar a ciegas el 42,3 % restante del banco habilitado.
3. Rellenar las lagunas de cobertura cuando exista fuente primaria legible (nóminas, hardware genérico, discapacidad, ventanilla única).
4. Reescribir con contenido real los distractores de CASE-A, CASE-B y CASE-L si se quiere acercar el sesgo estricto al 25 %.
5. Auditoría manual de accesibilidad y pruebas con lector de pantalla.
6. Service worker de desinstalación como mecanismo de reversión.
7. Marcar `releasedIn` en las preguntas publicadas para conservar el texto de las que se retiren en el futuro.

## E. Valoración
Se puede publicar una **primera versión estable** como herramienta de estudio personal, con el aviso de material no oficial, siempre que el propietario exporte antes sus copias de seguridad y autorice expresamente la fusión. Condiciones para llamarla «estable»: controles de `npm run pre-publicacion` en verde sobre el SHA anotado y la comprobación posterior de la sección 5 de `docs/PUBLICACION.md` hecha en iPhone y PC. Las respuestas deben contrastarse siempre con el BOE.
