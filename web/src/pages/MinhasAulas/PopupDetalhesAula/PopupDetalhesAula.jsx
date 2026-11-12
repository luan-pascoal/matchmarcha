import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Popup } from "../../../components/popup/Popup";
import { MsgErrosBackEnd } from "../../../components/MsgErrosBackEnd";
import { CampoHorario } from "../CampoHorario/CampoHorario";
import { PopupCancelamentoAula } from "../PopupCancelamentoAula/PopupCancelamentoAula";
import {
  OPCOES_HORARIO,
  PADRAO_HORARIO,
  normalizar,
  horarioParaMinutos,
  intervalosOcupados,
  inicioBloqueado,
  haSobreposicao,
  proximaHoraCheia,
  validarHorarios,
  ROTULOS_STATUS,
} from "../minhasAulasHelpers";
import "./PopupDetalhesAula.css";

const VALORES_INICIAIS = {
  data: "",
  cidadeId: "",
  categoria: "0",
  horario_inicio: "",
  horario_fim: "",
};

const LABELS_CATEGORIA = {
  A: "A (Somente moto)",
  B: "B (Somente carro)",
  AB: "AB (Moto e carro)",
};

export function PopupDetalhesAula({
  aberto,
  fechar,
  aulaSelecionada,
  cidades,
  aulas,
  buscarAulas,
  usuario,
  dadosUsuario
}) {
    
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({ defaultValues: VALORES_INICIAIS });

  const [arrayErrosBackend, setArrayErrosBackend] = useState([]);
  const [cidadeBusca, setCidadeBusca] = useState("");
  const [mostrarCidades, setMostrarCidades] = useState(false);
  const [popupCancelamentoAberto, setPopupCancelamentoAberto] = useState(false);

  const ehInstrutor = usuario?.usuario?.tipo === "instrutor";
  const aulaPodeSerEditada =
    aulaSelecionada?.Au_status === "AGENDADA" && ehInstrutor;
    
  const categoriasPermitidas = Object.entries(LABELS_CATEGORIA).filter(
    ([valor]) => dadosUsuario?.tipo === "AB" || valor === dadosUsuario?.tipo,
  );

  const dataAula = watch("data");
  const horarioInicio = watch("horario_inicio");
  const horarioFim = watch("horario_fim");

  useEffect(() => {
    if (!aberto || !aulaSelecionada) return;

    const cidadeSelecionada = (cidades ?? []).find(
      (c) => c.id === aulaSelecionada.Au_cidadeid,
    );

    reset({
      outro_nome: aulaSelecionada.outro_nome,
      Au_status: aulaSelecionada.Au_status,
      data: aulaSelecionada.Au_data,
      cidadeId: aulaSelecionada.Au_cidadeid,
      categoria: aulaSelecionada.Au_categoria,
      horario_inicio: aulaSelecionada.Au_horario_inicio.substring(0, 5),
      horario_fim: aulaSelecionada.Au_horario_fim.substring(0, 5),
    });

    setCidadeBusca(
      cidadeSelecionada
        ? `${cidadeSelecionada.nome} - ${cidadeSelecionada.uf}`
        : "",
    );
    setMostrarCidades(false);
    setArrayErrosBackend([]);
  }, [aberto, aulaSelecionada, cidades, reset]);

  const cidadesFiltradas = (cidades ?? [])
    .filter((cidade) =>
      normalizar(cidade.nome).includes(normalizar(cidadeBusca)),
    )
    .slice(0, 10);

  const ocupados = useMemo(() => {
    if (!dataAula || !aulaSelecionada) return [];
    return intervalosOcupados(aulas ?? [], dataAula, aulaSelecionada.Au_id);
  }, [aulas, dataAula, aulaSelecionada]);

  const { erroInicio, erroFim } = validarHorarios({
    inicio: horarioInicio,
    fim: horarioFim,
    ocupados,
  });

  const minutosInicio = PADRAO_HORARIO.test(horarioInicio)
    ? horarioParaMinutos(horarioInicio)
    : null;

  const opcoesInicio = OPCOES_HORARIO.map((hora) => ({
    valor: hora,
    bloqueado: inicioBloqueado(horarioParaMinutos(hora), ocupados),
  }));

  const opcoesFim = OPCOES_HORARIO.map((hora) => {
    const minutos = horarioParaMinutos(hora);
    return {
      valor: hora,
      bloqueado:
        minutosInicio !== null &&
        (minutos <= minutosInicio ||
          haSobreposicao(minutosInicio, minutos, ocupados)),
    };
  });

  const sugestaoInicio = proximaHoraCheia();
  const sugestaoFim =
    minutosInicio === null
      ? sugestaoInicio
      : opcoesFim.find((opcao) => !opcao.bloqueado)?.valor;

  const mensagemInicio =
    erroInicio ||
    (errors?.horario_inicio?.type === "required"
      ? "Informe o horário de início."
      : errors?.horario_inicio
        ? "Use o formato HH:MM, de 00:00 a 23:59."
        : "");

  const mensagemFim =
    erroFim ||
    (errors?.horario_fim?.type === "required"
      ? "Informe o horário de término."
      : errors?.horario_fim
        ? "Use o formato HH:MM, de 00:00 a 23:59."
        : "");

  const onSubmit = async (dados) => {

    if (!aulaSelecionada) return;

    setArrayErrosBackend([]);

    // Monta apenas os campos que mudaram
    const corpo = {};
    if (dados.data !== aulaSelecionada.Au_data) corpo.data = dados.data;
    if (dados.cidadeId !== aulaSelecionada.Au_cidadeid)
      corpo.cidadeId = Number(dados.cidadeId);
    if (dados.categoria !== aulaSelecionada.Au_categoria)
      corpo.categoria = dados.categoria;
    if (
      dados.horario_inicio !== aulaSelecionada.Au_horario_inicio.substring(0, 5)
    )
      corpo.horario_inicio = dados.horario_inicio;
    if (dados.horario_fim !== aulaSelecionada.Au_horario_fim.substring(0, 5))
      corpo.horario_fim = dados.horario_fim;

    // Se nada mudou, só fecha
    if (Object.keys(corpo).length === 0) {
      fechar();
      return;
    }

    const resposta = await axios.put(
      `/api/calendario/${aulaSelecionada.Au_id}`,
      corpo,
      {
        headers: {
          "Content-Type": "application/json",
        },
        validateStatus: () => true,
        withCredentials: true,
      },
    );

    if (resposta.status === 200 && resposta.data.Sucesso) {
      await buscarAulas({ silencioso: true });
      fechar();
      return;
    }

    if (resposta.status === 422) {
      setArrayErrosBackend(Object.entries(resposta?.data?.Erro ?? {}));
      return;
    }

    setArrayErrosBackend([["geral", "Não foi possível salvar a aula"]]);
    
  };

  if (!aulaSelecionada) return null;

  return (
    <>
      <Popup aberto={aberto && !popupCancelamentoAberto} onFechar={fechar} titulo="Detalhes da aula">
        <form className="form-aula" onSubmit={handleSubmit(onSubmit)}>
          {/* Campo read-only: Nome do aluno/instrutor */}
          <div className="field">
            <label className="label">
              {ehInstrutor ? "Aluno" : "Instrutor"}
            </label>
            <input
              type="text"
              className="input"
              value={aulaSelecionada.outro_nome}
              disabled
              readOnly
            />
          </div>

          {/* Campo read-only: Status */}
          <div className="field">
            <label className="label">Status</label>
            <input
              type="text"
              className="input"
              value={ROTULOS_STATUS[aulaSelecionada.Au_status]}
              disabled
              readOnly
            />
          </div>

          {/* Campos editáveis (só se instrutor + AGENDADA) */}
          {aulaPodeSerEditada && (
            <>
              <div className="field">
                <label className="label" htmlFor="aula-data">
                  Data
                </label>
                <input
                  id="aula-data"
                  className="input"
                  type="date"
                  {...register("data", { required: true })}
                />
                {errors?.data?.type === "required" && (
                  <p className="error-message">Informe a data da aula.</p>
                )}
              </div>

              <div className="field">
                <label className="label" htmlFor="aula-cidade">
                  Cidade
                </label>
                <div className="popup-aula__autocomplete">
                  <input
                    id="aula-cidade"
                    className="input"
                    type="text"
                    placeholder="Digite a cidade"
                    autoComplete="off"
                    value={cidadeBusca}
                    onChange={(event) => {
                      setCidadeBusca(event.target.value);
                      setMostrarCidades(true);
                      setValue("cidadeId", "");
                    }}
                  />
                  <input
                    type="hidden"
                    {...register("cidadeId", { required: true })}
                  />
                  {mostrarCidades &&
                    cidadeBusca.length > 0 &&
                    cidadesFiltradas.length > 0 && (
                      <ul className="popup-aula__sugestoes">
                        {cidadesFiltradas.map((cidade) => (
                          <li
                            key={cidade.id}
                            className="popup-aula__sugestao"
                            onClick={() => {
                              setCidadeBusca(`${cidade.nome} - ${cidade.uf}`);
                              setValue("cidadeId", cidade.id, {
                                shouldValidate: true,
                              });
                              setMostrarCidades(false);
                            }}
                          >
                            {cidade.nome} - {cidade.uf}
                          </li>
                        ))}
                      </ul>
                    )}
                </div>
                {errors?.cidadeId?.type === "required" && (
                  <p className="error-message">O campo cidade é obrigatório.</p>
                )}
              </div>

              <div className="field">
                <label className="label" htmlFor="aula-categoria">
                  Categoria
                </label>
                <select
                  id="aula-categoria"
                  className="popup-aula__select"
                  {...register("categoria", {
                    validate: (value) => value !== "0",
                  })}
                >
                  <option value="0">Selecione a categoria</option>
                  {categoriasPermitidas.map(([valor, texto]) => (
                    <option key={valor} value={valor}>
                      {texto}
                    </option>
                  ))}
                </select>
                {errors?.categoria?.type === "validate" && (
                  <p className="error-message">Selecione uma categoria.</p>
                )}
              </div>

              <div className="popup-aula__horarios">
                <CampoHorario
                  id="aula-horario-inicio"
                  label="Horário de início"
                  registro={register("horario_inicio", {
                    required: true,
                    pattern: PADRAO_HORARIO,
                  })}
                  opcoes={opcoesInicio}
                  destaque={sugestaoInicio}
                  aoEscolher={(valor) =>
                    setValue("horario_inicio", valor, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  mensagemErro={mensagemInicio}
                />
                <CampoHorario
                  id="aula-horario-fim"
                  label="Horário de término"
                  registro={register("horario_fim", {
                    required: true,
                    pattern: PADRAO_HORARIO,
                  })}
                  opcoes={opcoesFim}
                  destaque={sugestaoFim}
                  aoEscolher={(valor) =>
                    setValue("horario_fim", valor, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  mensagemErro={mensagemFim}
                />
              </div>
            </>
          )}

          <MsgErrosBackEnd arrayErrosBackend={arrayErrosBackend} />

          <div className="popup__rodape">
            <button
              className="btn btn--ghost btn--square"
              type="button"
              onClick={fechar}
            >
              Fechar
            </button>

            {aulaPodeSerEditada && (
              <>
                <button
                  className="btn btn--primary btn--square"
                  type="submit"
                  disabled={
                    isSubmitting || !!erroInicio || !!erroFim || !isDirty
                  }
                >
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </button>

                <button
                  className="btn btn--secondary btn--square"
                  type="button"
                  onClick={() => setPopupCancelamentoAberto(true)}
                >
                  Cancelar aula
                </button>
              </>
            )}
          </div>
        </form>
      </Popup>

      <PopupCancelamentoAula
        aberto={popupCancelamentoAberto}
        fechar={() => setPopupCancelamentoAberto(false)}
        fecharDetalhes={fechar}
        aulaSelecionada={aulaSelecionada}
        cidades={cidades}
        buscarAulas={buscarAulas}
      />
    </>
  );
}
