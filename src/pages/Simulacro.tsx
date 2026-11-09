import { Link } from 'react-router-dom';
import { useApp } from '../ctx';
import { profile, topics } from '../core/bank';
import { useStart } from '../ui/useStart';

export function Simulacro() {
  const { coverage, active, includePending, pool } = useApp();
  const start = useStart();
  const complete = coverage.complete;
  return (
    <div className="stack">
      <h1>Simulacro</h1>
      {active && <div className="notice">Tienes una sesión sin terminar. <Link to="/sesion">Continuar</Link></div>}

      <div className="card">
        <h2>Cómo es el examen oficial</h2>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li>Primera parte: <b>{profile.part1.theory}</b> preguntas de los bloques I a V y <b>{profile.part1.office}</b> del bloque VI.</li>
          <li>Segunda parte: <b>un supuesto a elegir entre {profile.part2.casesOffered}</b>, de {profile.part2.questions} preguntas (bloques II a V).</li>
          <li><b>{profile.durationMinutes} minutos</b> para todo. Cada error resta un tercio de un acierto; en blanco no resta.</li>
          <li>Las dos partes son eliminatorias. La nota mínima la fija el tribunal en cada convocatoria.</li>
        </ul>
        <p className="small muted" style={{ marginTop: 8 }}>Fuente: Anexo III, apartado 2 de {profile.id.replace('AGE-C1-LIBRE-', 'la convocatoria ')} (<a href="https://www.boe.es/buscar/doc.php?id=BOE-A-2025-26262" target="_blank" rel="noreferrer">BOE-A-2025-26262</a>). Revisado el {profile.checked_on}: no se localizó una convocatoria posterior.</p>
      </div>

      {complete ? (
        <div className="notice ok"><b>Cobertura completa:</b> todos los temas tienen preguntas y hay material para dos supuestos.</div>
      ) : (
        <div className="notice">
          <b>Simulacro de entrenamiento con cobertura incompleta.</b> No representa el temario completo todavía:
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            <li>{topics.length - coverage.missing.length} de {topics.length} temas tienen preguntas habilitadas.</li>
            <li>Teoría: {coverage.theory} de {profile.part1.theory} necesarias · Ofimática: {coverage.office} de {profile.part1.office}.</li>
            <li>Supuestos completos de {profile.part2.questions} preguntas: {coverage.casesReady} de {profile.part2.casesOffered}.</li>
            {coverage.missing.length > 0 && <li>Temas ausentes: {coverage.missing.join(', ')}.</li>}
          </ul>
        </div>
      )}
      {includePending && <div className="notice bad"><b>Laboratorio:</b> se incluyen preguntas pendientes de auditoría. Solo para probar la aplicación.</div>}

      <div className="card">
        <p className="small muted">El reparto por tema dentro de las 40 y 30 preguntas es una heurística proporcional al número de temas del bloque, no una cuota oficial. Preguntas, respuestas y supuestos salen en orden aleatorio en cada intento.</p>
        <button className="btn block" disabled={!!active || (pool.length === 0)} onClick={() => void start.simulacro()}>
          Empezar simulacro ({profile.durationMinutes} min)
        </button>
      </div>
    </div>
  );
}
