import { useState, useEffect, useRef, useMemo } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { SiteHeaderLoggedActions } from "../../components/layout/SiteHeader";
import { PageTop } from "./PageTop/PageTop";
import { PopupCriacaoAula } from "./PopupCriacaoAula/PopupCriacaoAula";
import { PopupDetalhesAula } from "./PopupDetalhesAula/PopupDetalhesAula";
import { pusherClient } from "../../services/pusher";
import { chaveData, normalizar, ROTULOS_STATUS } from "./minhasAulasHelpers";
import axios from "axios";
import "./MinhasAulas.css";

const NOMES_MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const LETRAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

// ---------- Helpers (depois serão movidos para calendarioHelpers.js) ----------

// Quantidade de dias de um mês (mes de 0 a 11)
function diasNoMes(ano, mes) {
  return new Date(ano, mes + 1, 0).getDate();
}

// Dia da semana do dia 1 (0 = domingo ... 6 = sábado)
function primeiroDiaSemana(ano, mes) {
  return new Date(ano, mes, 1).getDay();
}

function mesmoDia(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Monta a grade do mês: lista de semanas, cada uma com 7 posições (número do dia ou null)
function montarSemanas(ano, mes) {
  const vazios = primeiroDiaSemana(ano, mes);
  const total = diasNoMes(ano, mes);

  const celulas = [
    ...Array(vazios).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  while (celulas.length % 7 !== 0) celulas.push(null);

  const semanas = [];
  for (let i = 0; i < celulas.length; i += 7) {
    semanas.push(celulas.slice(i, i + 7));
  }

  return semanas;
}

// Data por extenso com a primeira letra maiúscula (ex.: "Quarta-feira, 21 de outubro de 2026")
function formatarDiaCompleto(data) {
  const texto = data.toLocaleDateString("pt-br", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Aulas de um dia, ordenadas do horário mais cedo para o mais tarde
function aulasDoDia(aulasFiltradas, data) {
  const chave = chaveData(data);
  return aulasFiltradas
    .filter((aula) => aula.Au_data === chave)
    .sort((a, b) => a.Au_horario_inicio.localeCompare(b.Au_horario_inicio));
}

// Número de aulas de cada dia: { "AAAA-MM-DD": quantidade }. Aulas canceladas não contam
function contarAulasPorDia(aulasFiltradas) {
  const contagem = {};
  aulasFiltradas.forEach((aula) => {
    if (aula.Au_status === "CANCELADA") return;
    contagem[aula.Au_data] = (contagem[aula.Au_data] ?? 0) + 1;
  });
  return contagem;
}

// Número de aulas (não canceladas) do mês exibido
function contarAulasDoMes(aulasFiltradas, ano, mes) {
  const prefixo = `${ano}-${String(mes + 1).padStart(2, "0")}`;
  return aulasFiltradas.filter(
    (aula) =>
      aula.Au_status !== "CANCELADA" && aula.Au_data.startsWith(prefixo),
  ).length;
}

// ---------- Componente ----------

export function MinhasAulas({
  usuario,
  dadosUsuario,
  carregarUsuario,
  contatos,
  buscarContatos,
  cidades,
  aulas,
  buscarAulas,
}) {

  // Instrutor vê o botão de adicionar aula e os botões de editar/cancelar
  const ehInstrutor = usuario?.usuario?.tipo === "instrutor";

  const [mesAtual, setMesAtual] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });
  const [diaSelecionado, setDiaSelecionado] = useState(() => new Date());
  const [popupCriacaoAberto, setPopupCriacaoAberto] = useState(false);
  const [filtroPessoa, setFiltroPessoa] = useState(null);
  const [buscaPessoa, setBuscaPessoa] = useState("");
  const [mostrarPessoas, setMostrarPessoas] = useState(false);
  const [aulaSelecionada, setAulaSelecionada] = useState(null);
  const [feriadosPorData, setFeriadosPorData] = useState({});

  // Indica que a seleção veio do teclado e o foco precisa acompanhar o dia
  const focarAposNavegar = useRef(false);

  const hoje = new Date();
  const ano = mesAtual.getFullYear();
  const mes = mesAtual.getMonth();
  const semanas = montarSemanas(ano, mes);

  // Anos de feriados já buscados, para não repetir a requisição ao navegar entre meses
  const anosBuscados = useRef(new Set());

  const pessoasComAula = useMemo(() => {
    const mapa = new Map();

    (aulas ?? []).forEach((aula) => {
      if (!mapa.has(aula.outro_id)) {
        mapa.set(aula.outro_id, aula.outro_nome);
      }
    });

    return [...mapa.entries()]
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-br"));
  }, [aulas]);

  const pessoasFiltradas = pessoasComAula
    .filter((pessoa) =>
      normalizar(pessoa.nome).includes(normalizar(buscaPessoa)),
    )
    .slice(0, 10);

  const aulasFiltradas = useMemo(
    () =>
      filtroPessoa
        ? (aulas ?? []).filter((aula) => aula.outro_id === filtroPessoa.id)
        : (aulas ?? []),
    [aulas, filtroPessoa],
  );

  const limparFiltro = () => {
    setFiltroPessoa(null);
    setBuscaPessoa("");
    setMostrarPessoas(false);
  };

  const contagemPorDia = useMemo(
    () => contarAulasPorDia(aulasFiltradas),
    [aulas],
  );
  const totalAulasMes = contarAulasDoMes(aulasFiltradas, ano, mes);
  const aulaDoDiaSelecionado = aulasDoDia(aulasFiltradas, diaSelecionado);
  const feriadoDoDiaSelecionado = feriadosPorData[chaveData(diaSelecionado)];

  // O instrutor precisa dos contatos (alunos) para o autocomplete do popup de criação
  useEffect(() => {
    if (!ehInstrutor) return;
    buscarContatos({ silencioso: true });
  }, [ehInstrutor, buscarContatos]);

  function fecharPopupCriacao() {
    setPopupCriacaoAberto(false);
  }

  // Seleciona um dia e leva a visualização para o mês dele
  function selecionarDia(data) {
    setDiaSelecionado(data);
    setMesAtual(new Date(data.getFullYear(), data.getMonth(), 1));
  }

  function irParaHoje() {
    selecionarDia(new Date());
  }

  // Muda o mês mantendo o mesmo número de dia (ou o último dia, se o mês for menor)
  function mudarMes(delta) {
    const alvo = new Date(
      diaSelecionado.getFullYear(),
      diaSelecionado.getMonth() + delta,
      1,
    );
    const ultimoDia = diasNoMes(alvo.getFullYear(), alvo.getMonth());
    const dia = Math.min(diaSelecionado.getDate(), ultimoDia);
    selecionarDia(new Date(alvo.getFullYear(), alvo.getMonth(), dia));
  }

  // Navegação por teclado (seção 2.4)
  function aoPressionarTecla(event) {
    const passos = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

    if (passos[event.key] !== undefined) {
      event.preventDefault();
      focarAposNavegar.current = true;
      selecionarDia(
        new Date(
          diaSelecionado.getFullYear(),
          diaSelecionado.getMonth(),
          diaSelecionado.getDate() + passos[event.key],
        ),
      );
      return;
    }

    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      focarAposNavegar.current = true;
      mudarMes(event.key === "PageUp" ? -1 : 1);
    }
  }

  // Busca os feriados nacionais do ano exibido (uma vez por ano)
  useEffect(() => {

    if (anosBuscados.current.has(ano)) return;
    anosBuscados.current.add(ano);

    const buscarFeriados = async () => {
      try {
        const resposta = await axios.get(`/api/feriados/${ano}`, {
          validateStatus: () => true,
          withCredentials: true,
        });

        if (resposta.status === 200 && Array.isArray(resposta.data)) {
          setFeriadosPorData((anterior) => {
            const novos = { ...anterior };
            resposta.data.forEach((feriado) => {
              novos[feriado.date] = feriado.name;
            });
            return novos;
          });
          return;
        }
      } catch {
        // Feriado é apenas informativo: se falhar, a tela segue funcionando
      }

      // Falhou: libera o ano para tentar de novo quando ele for exibido outra vez
      anosBuscados.current.delete(ano);
    };

    buscarFeriados();
  }, [ano]);

  // Quando a seleção muda pelo teclado, move o foco para o novo dia
  useEffect(() => {
    if (!focarAposNavegar.current) return;
    focarAposNavegar.current = false;

    document.getElementById(`dia-${chaveData(diaSelecionado)}`)?.focus();
  }, [diaSelecionado]);

  // Consulta inicial ao abrir a tela
  useEffect(() => {
    buscarAulas({ silencioso: false });
  }, [buscarAulas]);

  useEffect(() => {
    const aoVoltarParaAba = () => {
      if (document.visibilityState === "visible") {
        buscarAulas({ silencioso: true });
      }
    };

    document.addEventListener("visibilitychange", aoVoltarParaAba);
    return () => {
      document.removeEventListener("visibilitychange", aoVoltarParaAba);
    };
  }, [buscarAulas]);

  // Atualiza as aulas a cada 60 segundos (o status muda com o passar do tempo)
  useEffect(() => {
    const intervalo = setInterval(() => {
      if (document.visibilityState === "visible") {
        buscarAulas({ silencioso: true });
      }
    }, 60000);

    return () => clearInterval(intervalo);
  }, [buscarAulas]);

  const idCanal = ehInstrutor
    ? usuario?.usuario?.instrutor_id
    : usuario?.usuario?.id;

  useEffect(() => {
    if (!idCanal) return;

    const nomeCanal = ehInstrutor
      ? `private-instrutor${idCanal}`
      : `private-usuario${idCanal}`;

    const canal = pusherClient.subscribe(nomeCanal);

    const aoAtualizarAula = () => {
      buscarAulas({ silencioso: true });
    };

    canal.bind("aula-atualizada", aoAtualizarAula);

    return () => {
      canal.unbind("aula-atualizada", aoAtualizarAula);
      pusherClient.unsubscribe(nomeCanal);
    };
  }, [ehInstrutor, idCanal, buscarAulas]);

  return (
    <AppLayout
      headerRight={
        <SiteHeaderLoggedActions
          dadosUsuario={dadosUsuario}
          carregarUsuario={carregarUsuario}
          tipoUsuario={usuario.usuario.tipo}
        />
      }
      footerRight={`Minhas Aulas${dadosUsuario?.nome ? ` de ${dadosUsuario.nome}` : ""}`}
    >
      <div className="stack stack--lg minhas-aulas__container">
        <div className="minhas-aulas">
          <PageTop ehInstrutor={ehInstrutor} />

          <div className="minhas-aulas__colunas">
            {/* Coluna esquerda: ações e filtro (15%) */}
            <aside
              className="minhas-aulas__coluna minhas-aulas__coluna--acoes"
              aria-label="Ações e filtro"
            >
              {ehInstrutor && (
                <button
                  className="btn btn--primary btn--square"
                  type="button"
                  onClick={() => setPopupCriacaoAberto(true)}
                >
                  Adicionar aula
                </button>
              )}

              <div className="minhas-aulas__filtro">
                <label className="label" htmlFor="filtro-pessoa">
                  {ehInstrutor ? "Filtrar por aluno" : "Filtrar por instrutor"}
                </label>
                <div className="minhas-aulas__autocomplete">
                  <input
                    id="filtro-pessoa"
                    className="input"
                    type="text"
                    placeholder={
                      ehInstrutor ? "Nome do aluno" : "Nome do instrutor"
                    }
                    autoComplete="off"
                    value={buscaPessoa}
                    onChange={(event) => {
                      setBuscaPessoa(event.target.value);
                      setMostrarPessoas(true);
                      setFiltroPessoa(null);
                    }}
                  />
                  {mostrarPessoas &&
                    buscaPessoa.length > 0 &&
                    pessoasFiltradas.length > 0 && (
                      <ul className="minhas-aulas__sugestoes">
                        {pessoasFiltradas.map((pessoa) => (
                          <li
                            key={pessoa.id}
                            className="minhas-aulas__sugestao"
                            onClick={() => {
                              setFiltroPessoa(pessoa);
                              setBuscaPessoa(pessoa.nome);
                              setMostrarPessoas(false);
                            }}
                          >
                            {pessoa.nome}
                          </li>
                        ))}
                      </ul>
                    )}
                </div>
                {mostrarPessoas &&
                  buscaPessoa.length > 0 &&
                  pessoasFiltradas.length === 0 && (
                    <p className="hint">Nenhuma pessoa encontrada.</p>
                  )}
                {filtroPessoa && (
                  <button
                    type="button"
                    className="btn btn--ghost btn--square"
                    onClick={limparFiltro}
                  >
                    Limpar filtro
                  </button>
                )}
              </div>
            </aside>

            {/* Coluna central: calendário mensal (60%) */}
            <section className="minhas-aulas__coluna minhas-aulas__coluna--mes">
              <div className="minhas-aulas__mes">
                <header className="minhas-aulas__mes-cabecalho">
                  <div className="minhas-aulas__mes-titulo">
                    <h2 className="minhas-aulas__mes-nome">
                      {NOMES_MESES[mes]} de {ano}
                    </h2>
                    <p className="minhas-aulas__mes-resumo muted">
                      {totalAulasMes === 1
                        ? "1 aula"
                        : `${totalAulasMes} aulas`}{" "}
                      em {NOMES_MESES[mes].toLowerCase()}
                    </p>
                  </div>

                  <button
                    className="btn btn--ghost btn--square minhas-aulas__btn-hoje"
                    type="button"
                    onClick={irParaHoje}
                  >
                    Hoje
                  </button>
                  <button
                    className="btn btn--ghost btn--square minhas-aulas__btn-mes minhas-aulas__btn-mes--anterior"
                    type="button"
                    aria-label="Mês anterior"
                    onClick={() => mudarMes(-1)}
                  >
                    &lt;
                  </button>
                  <button
                    className="btn btn--ghost btn--square minhas-aulas__btn-mes minhas-aulas__btn-mes--proximo"
                    type="button"
                    aria-label="Próximo mês"
                    onClick={() => mudarMes(1)}
                  >
                    &gt;
                  </button>
                </header>

                <div
                  className="minhas-aulas__grade"
                  role="grid"
                  aria-label={`${NOMES_MESES[mes]} de ${ano}`}
                  onKeyDown={aoPressionarTecla}
                >
                  <div className="minhas-aulas__semana" role="row">
                    {LETRAS_SEMANA.map((letra, indice) => (
                      <span
                        key={indice}
                        className="minhas-aulas__dia-semana"
                        role="columnheader"
                      >
                        {letra}
                      </span>
                    ))}
                  </div>

                  {semanas.map((semana, indiceSemana) => (
                    <div
                      key={indiceSemana}
                      className="minhas-aulas__semana"
                      role="row"
                    >
                      {semana.map((numeroDia, indiceDia) => {
                        if (numeroDia === null) {
                          return (
                            <span
                              key={indiceDia}
                              role="gridcell"
                              aria-hidden="true"
                            />
                          );
                        }

                        const data = new Date(ano, mes, numeroDia);
                        const quantidade = contagemPorDia[chaveData(data)] ?? 0;
                        const ehSelecionado = mesmoDia(data, diaSelecionado);
                        const ehHoje = mesmoDia(data, hoje);
                        const nomeFeriado = feriadosPorData[chaveData(data)];

                        const classes = [
                          "minhas-aulas__dia",
                          ehHoje ? "minhas-aulas__dia--hoje" : "",
                          ehSelecionado ? "minhas-aulas__dia--selecionado" : "",
                          nomeFeriado ? "minhas-aulas__dia--feriado" : "",
                        ]
                          .join(" ")
                          .trim();

                        return (
                          <button
                            key={indiceDia}
                            id={`dia-${chaveData(data)}`}
                            className={classes}
                            type="button"
                            role="gridcell"
                            tabIndex={ehSelecionado ? 0 : -1}
                            aria-selected={ehSelecionado}
                            aria-label={`${data.toLocaleDateString("pt-br", { dateStyle: "full" })}${
                              quantidade > 0
                                ? `, ${quantidade} ${quantidade === 1 ? "aula" : "aulas"}`
                                : ""
                            }${nomeFeriado ? `, feriado: ${nomeFeriado}` : ""}`}
                            onClick={() => selecionarDia(data)}
                          >
                            {numeroDia}
                            {quantidade > 0 && (
                              <span
                                className="minhas-aulas__dia-contagem"
                                aria-hidden="true"
                              >
                                {quantidade}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Coluna direita: aulas do dia (25%) */}
            <aside
              className="minhas-aulas__coluna minhas-aulas__coluna--dia"
              aria-label="Aulas do dia"
            >
              <div className="minhas-aulas__painel">

                <h3 className="minhas-aulas__painel-titulo">
                  {formatarDiaCompleto(diaSelecionado)}
                </h3>

                {feriadoDoDiaSelecionado && (
                  <p className="minhas-aulas__feriado">
                    {feriadoDoDiaSelecionado}
                  </p>
                )}

                {aulaDoDiaSelecionado.length === 0 ? (
                  <p className="muted">Nenhuma aula neste dia</p>
                ) : (
                  <ul className="minhas-aulas__lista">
                    {aulaDoDiaSelecionado.map((aula) => (
                      <li key={aula.Au_id}>
                        <button
                          className={`minhas-aulas__aula${aula.Au_status === "CANCELADA" ? " minhas-aulas__aula--cancelada" : ""}`}
                          type="button"
                          onClick={() => setAulaSelecionada(aula)}
                        >
                          <span className="minhas-aulas__aula-nome">
                            {aula.outro_nome}
                          </span>
                          <span className="minhas-aulas__aula-horario">
                            {aula.Au_horario_inicio.substring(0, 5)} –{" "}
                            {aula.Au_horario_fim.substring(0, 5)}
                          </span>
                          <span
                            className={`minhas-aulas__aula-status minhas-aulas__aula-status--${aula.Au_status.toLowerCase()}`}
                          >
                            {ROTULOS_STATUS[aula.Au_status]}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>

          {/* Legenda abaixo das colunas */}
          <div className="minhas-aulas__legenda">
            <ul className="minhas-aulas__legenda-lista">
              <li className="minhas-aulas__legenda-item">
                <span className="minhas-aulas__legenda-marca minhas-aulas__legenda-marca--feriado" />
                Feriado
              </li>
              <li className="minhas-aulas__legenda-item">
                <span className="minhas-aulas__legenda-marca minhas-aulas__legenda-marca--selecionado" />
                Dia selecionado
              </li>
              <li className="minhas-aulas__legenda-item">
                <span className="minhas-aulas__legenda-marca minhas-aulas__legenda-marca--aulas">
                  2
                </span>
                Dia com aulas
              </li>
              <li className="minhas-aulas__legenda-item">
                <span className="minhas-aulas__legenda-marca minhas-aulas__legenda-marca--hoje" />
                Hoje
              </li>
            </ul>
          </div>
        </div>
      </div>

      {ehInstrutor && (
        <>
          <PopupCriacaoAula
            aberto={popupCriacaoAberto}
            fechar={fecharPopupCriacao}
            alunoInicial={null}
            contatos={contatos}
            cidades={cidades}
            aulas={aulas}
            buscarAulas={buscarAulas}
            dadosUsuario={dadosUsuario}
          />
          <PopupDetalhesAula
            aberto={!!aulaSelecionada}
            fechar={() => setAulaSelecionada(null)}
            aulaSelecionada={aulaSelecionada}
            cidades={cidades}
            aulas={aulas}
            buscarAulas={buscarAulas}
            usuario={usuario}
            dadosUsuario={dadosUsuario}
          />
        </>
      )}
    </AppLayout>
  );
}
