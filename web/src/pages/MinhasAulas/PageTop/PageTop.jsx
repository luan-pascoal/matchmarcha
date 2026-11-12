import "./PageTop.css";

export function PageTop({ ehInstrutor }) {
  return (
    <div className="minhas-aulas-page-top">
      <div className="minhas-aulas-page__header">
        <div>
          <h1 className="minhas-aulas-page__title">Minhas Aulas</h1>
          <p className="minhas-aulas-page__subtitle">
            {ehInstrutor
              ? "Visualize, crie, edite e cancele suas aulas de direção."
              : "Visualize suas aulas de direção."}
          </p>
        </div>
      </div>
    </div>
  );
}