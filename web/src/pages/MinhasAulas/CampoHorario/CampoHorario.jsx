import { useState, useRef, useEffect } from "react";
import "./CampoHorario.css";

export function CampoHorario({
  id,
  label,
  registro,
  opcoes,
  destaque,
  aoEscolher,
  mensagemErro,
}) {

  const [aberto, setAberto] = useState(false);
  const containerRef = useRef(null);
  const listaRef = useRef(null);

  useEffect(() => {

    if (!aberto) return;

    const aoClicarFora = (event) => {
      if (!containerRef.current?.contains(event.target)) setAberto(false);
    };

    document.addEventListener("mousedown", aoClicarFora);

    return () => document.removeEventListener("mousedown", aoClicarFora);
    
  }, [aberto]);

  useEffect(() => {

    if (!aberto || !listaRef.current) return;

    const lista = listaRef.current;
    const item = lista.querySelector(`[data-valor="${destaque}"]`);
    if (!item) return;

    // Distância do item até o topo da lista, independente de quem é o offsetParent
    const distancia = item.getBoundingClientRect().top - lista.getBoundingClientRect().top;
    lista.scrollTop += distancia;

  }, [aberto, destaque]);

  return (
    <>
      <div className="field campo-horario" ref={containerRef}>
        <label className="label" htmlFor={id}>
          {label}
        </label>

        <div className="campo-horario__controle">
          <input
            id={id}
            className="input campo-horario__input"
            type="text"
            inputMode="numeric"
            placeholder="HH:MM"
            maxLength={5}
            autoComplete="off"
            aria-invalid={!!mensagemErro}
            {...registro}
          />
          <button
            className="btn btn--ghost btn--square campo-horario__seta"
            type="button"
            aria-label={`Escolher ${label.toLowerCase()}`}
            aria-expanded={aberto}
            onClick={() => setAberto((anterior) => !anterior)}
          >
            ▾
          </button>

          {aberto && (
            <ul className="campo-horario__lista" ref={listaRef}>
              {opcoes.map((opcao) => (
                <li key={opcao.valor} data-valor={opcao.valor}>
                  <button
                    className={`campo-horario__opcao${opcao.bloqueado ? " campo-horario__opcao--bloqueada" : ""}`}
                    type="button"
                    disabled={opcao.bloqueado}
                    onClick={() => {
                      aoEscolher(opcao.valor);
                      setAberto(false);
                    }}
                  >
                    {opcao.valor}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {mensagemErro && <p className="error-message">{mensagemErro}</p>}
      </div>
    </>
  );
}
