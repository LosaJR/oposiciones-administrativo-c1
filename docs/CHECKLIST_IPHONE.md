# Comprobación en iPhone (Safari) y navegador de escritorio

Esta lista cubre lo que **no se pudo probar** en el entorno de desarrollo: el navegador integrado rechaza registrar service workers y no hay acceso a Safari. Sirve para el laboratorio (`/laboratorio/`) y, cuando se autorice, para producción. Anota fecha, modelo de iPhone, versión de iOS y qué falló.

Laboratorio: https://losajr.github.io/oposiciones-administrativo-c1/laboratorio/

## 1. Primera carga y uso básico (5 min)
1. Abre el laboratorio en **Safari** (no en un navegador integrado de otra aplicación). Debe verse la franja amarilla «Laboratorio».
2. Rota el móvil: no debe aparecer scroll horizontal en Inicio, Temario, Test, Simulacro y Estadísticas.
3. Test por tema: elige un tema, 5 preguntas, modo Práctica. Responde, comprueba que se ve la explicación y entrega. El resultado debe mostrar los aciertos, los fallos y los blancos.
4. Entrenamiento equilibrado (pantalla Test): 10 preguntas. Deben salir de varios temas.

## 2. Instalación como aplicación
1. En Safari: Compartir → **Añadir a pantalla de inicio**. El icono debe verse sin recortes.
2. Ábrela desde el icono: debe abrirse a pantalla completa, sin la barra de Safari.
3. Importante: los datos de la aplicación instalada pueden ser **independientes** de los de la pestaña de Safari en iOS. Comprueba si el historial que ves es el de la instalación.

## 3. Persistencia del historial
1. Completa un test corto y entrégalo. Ve a Estadísticas: debe constar el intento.
2. Cierra la aplicación por completo (desliza hacia arriba en el selector de apps) y vuelve a abrirla: el historial debe seguir.
3. Empieza un simulacro, responde 3 preguntas y sal con «Salir sin cerrar». Reabre la app: debe ofrecer **continuar** y conservar las 3 respuestas y el tiempo restante por reloj de pared.
4. Anota si iOS borró los datos tras varios días sin usar la app (Safari puede purgar el almacenamiento de sitios que no se usan en 7 días si la web no está instalada).

## 4. Sin conexión
1. Con la app abierta y cargada, activa el **modo avión**.
2. Cierra y reabre la aplicación instalada: debe abrir sin red.
3. Haz un test de 5 preguntas y entrégalo. Debe guardarse el resultado.
4. Desactiva el modo avión.
5. Anota cualquier pantalla en blanco, fuentes que no cargan o error de «sin conexión».

## 5. Actualización a una versión nueva
Requiere que haya una versión nueva en el laboratorio (se publica con cada push a `develop`).
1. Con la versión antigua instalada, empieza un test y responde alguna pregunta.
2. Publica la versión nueva y espera unos minutos.
3. Abre la app: debe aparecer el aviso «Hay una versión nueva. Se aplicará cuando termines el examen.» (la actualización es manual: modo `prompt`). No debe recargarse sola ni perder la sesión en curso. En Ajustes, «Buscar actualización» fuerza la búsqueda de versión; «Lista para funcionar sin conexión» indica que la caché está completa.
4. Termina el test en curso y actualiza desde el aviso. Comprueba que el historial anterior sigue y que Ajustes → «Versión y actualizaciones» muestra la versión nueva (hash corto del commit).
5. Si se actualiza en mitad de una pregunta y se pierde una respuesta, anótalo con los pasos exactos.

## 5 bis. Aislamiento entre laboratorio y producción (solo cuando exista producción)
1. Instala el laboratorio y la producción en el mismo iPhone.
2. Cada una debe tener su propio historial (bases `agec1-lab` y `agec1-prod`) y su propia caché; actualizar una no debe afectar a la otra.

## 6. Accesibilidad básica
1. Activa **VoiceOver** y recorre una pregunta: debe leer el enunciado y las cuatro opciones como opciones seleccionables.
2. Aumenta el tamaño de texto del sistema al máximo: nada debe quedar cortado.
3. Modo oscuro del sistema: el texto debe seguir siendo legible.

## En Chrome de escritorio (para lo mismo, si no hay iPhone)
Abre el laboratorio → F12 → pestaña Application: **Service Workers** (estado «activated»), **Cache Storage** (caché `agec1-lab…` con unas 20 entradas) e **IndexedDB** (`agec1-lab`). En Network marca «Offline» y recarga: la app debe abrir.
