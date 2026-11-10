import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import { AppProvider } from '../src/ctx';
import { App } from '../src/App';

// Accesibilidad automática (axe-core en jsdom). jsdom no calcula diseño ni colores, así que NO se evalúa el contraste:
// eso sigue pendiente de una herramienta en navegador real (Lighthouse/axe DevTools).
const rutas = ['/', '/temario', '/test', '/simulacro', '/estadisticas', '/fallos', '/historial', '/ajustes', '/mas'];

async function auditar(ruta: string) {
  const { container } = render(
    <MemoryRouter initialEntries={[ruta]}>
      <AppProvider>
        <App />
      </AppProvider>
    </MemoryRouter>,
  );
  await waitFor(() => expect(container.querySelector('main')).not.toBeNull(), { timeout: 4000 });
  const res = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
    resultTypes: ['violations'],
  });
  return res.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
}

describe('accesibilidad básica (axe-core)', () => {
  afterEach(() => cleanup());
  for (const ruta of rutas) {
    it(`sin violaciones automáticas en ${ruta}`, async () => {
      expect(await auditar(ruta)).toEqual([]);
    }, 15000);
  }

  it('canario: axe detecta una imagen sin texto alternativo (la prueba sí puede fallar)', async () => {
    const { container } = render(<img src="x.png" />);
    const res = await axe.run(container, { resultTypes: ['violations'] });
    expect(res.violations.map((v) => v.id)).toContain('image-alt');
  });
});
