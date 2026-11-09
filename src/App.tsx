import { NavLink, Route, Routes } from 'react-router-dom';
import { useApp } from './ctx';
import { ENV } from './core/bank';
import { Home } from './pages/Home';
import { Syllabus } from './pages/Syllabus';
import { TestSetup } from './pages/TestSetup';
import { Simulacro } from './pages/Simulacro';
import { Runner } from './pages/Runner';
import { Result } from './pages/Result';
import { Mistakes } from './pages/Mistakes';
import { Stats } from './pages/Stats';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Icon } from './ui/components';

const NAV = [
  { to: '/', label: 'Inicio', icon: 'home', end: true },
  { to: '/temario', label: 'Temario', icon: 'book' },
  { to: '/test', label: 'Test', icon: 'check' },
  { to: '/simulacro', label: 'Simulacro', icon: 'clock' },
  { to: '/mas', label: 'Más', icon: 'more' },
] as const;

export function App() {
  const { ready, pwa } = useApp();
  if (!ready) return <p className="main muted" role="status">Cargando tus datos locales…</p>;
  return (
    <div className="shell">
      <aside className="side" aria-label="Navegación principal">
        <div className="brandname">AGE C1{ENV === 'lab' ? ' · Lab' : ''}</div>
        {NAV.filter((n) => n.to !== '/mas').map((n) => (
          <NavLink key={n.to} to={n.to} end={'end' in n ? n.end : false}><Icon name={n.icon} />{n.label}</NavLink>
        ))}
        <NavLink to="/fallos"><Icon name="redo" />Mis fallos</NavLink>
        <NavLink to="/estadisticas"><Icon name="chart" />Estadísticas</NavLink>
        <NavLink to="/historial"><Icon name="list" />Historial</NavLink>
        <NavLink to="/ajustes"><Icon name="gear" />Ajustes y fuentes</NavLink>
      </aside>
      <div>
        {ENV === 'lab' && <div className="envbar">Laboratorio: copia de pruebas, separada de producción</div>}
        <main className="main" id="contenido">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/temario" element={<Syllabus />} />
            <Route path="/test" element={<TestSetup />} />
            <Route path="/simulacro" element={<Simulacro />} />
            <Route path="/sesion" element={<Runner />} />
            <Route path="/resultado/:id" element={<Result />} />
            <Route path="/fallos" element={<Mistakes />} />
            <Route path="/estadisticas" element={<Stats />} />
            <Route path="/historial" element={<History />} />
            <Route path="/ajustes" element={<Settings />} />
            <Route path="/mas" element={<More />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
      </div>
      <nav className="nav" aria-label="Navegación principal">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={'end' in n ? n.end : false}><Icon name={n.icon} />{n.label}</NavLink>
        ))}
      </nav>
      {pwa.updateReady && (
        <div className="update" role="status">
          <span>{pwa.canApply ? 'Hay una versión nueva.' : 'Hay una versión nueva. Se aplicará cuando termines el examen.'}</span>
          {pwa.canApply && <button className="btn small" onClick={pwa.apply}>Actualizar</button>}
        </div>
      )}
    </div>
  );
}

function More() {
  return (
    <div className="stack">
      <h1>Más</h1>
      <NavLink className="card row" to="/fallos"><Icon name="redo" />Mis fallos y repaso</NavLink>
      <NavLink className="card row" to="/estadisticas"><Icon name="chart" />Estadísticas</NavLink>
      <NavLink className="card row" to="/historial"><Icon name="list" />Historial de sesiones</NavLink>
      <NavLink className="card row" to="/ajustes"><Icon name="gear" />Ajustes, copia de seguridad y fuentes</NavLink>
    </div>
  );
}
