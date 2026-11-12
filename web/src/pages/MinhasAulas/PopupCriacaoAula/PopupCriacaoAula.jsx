import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Popup } from "../../../components/popup/Popup";
import { MsgErrosBackEnd } from "../../../components/MsgErrosBackEnd";
import { CampoHorario } from "../CampoHorario/CampoHorario";
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
} from "../minhasAulasHelpers";
import "./PopupCriacaoAula.css";

const VALORES_INICIAIS = {
  usuarioId: "",
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

export function PopupCriacaoAula({
  aberto,
  fechar,
  alunoInicial,
  contatos,
  cidades,
  aulas,
  buscarAulas,
  dadosUsuario
}) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: VALORES_INICIAIS });

  const [arrayErrosBackend, setArrayErrosBackend] = useState([]);
  const [alunoBusca, setAlunoBusca] = useState("");
  const [mostrarAlunos, setMostrarAlunos] = useState(false);
  const [cidadeBusca, setCidadeBusca] = useState("");
  const [mostrarCidades, setMostrarCidades] = useState(false);

  const dataAula = watch("data");
  const horarioInicio = watch("horario_inicio");
  const horarioFim = watch("horario_fim");

  const categoriasPermitidas = Object.entries(LABELS_CATEGORIA).filter(
    ([valor]) => dadosUsuario?.tipo === "AB" || valor === dadosUsuario?.tipo,
  );

  const alunoInicialId = alunoInicial?.id ?? "";
  const alunoInicialNome = alunoInicial?.nome ?? "";

  useEffect(() => {

    if (!aberto) return;

    reset({ ...VALORES_INICIAIS, usuarioId: alunoInicialId });
    setAlunoBusca(alunoInicialNome);
    setCidadeBusca("");
    setMostrarAlunos(false);
    setMostrarCidades(false);
    setArrayErrosBackend([]);
    
  }, [aberto, alunoInicialId, alunoInicialNome, reset]);

  // ---------- Autocompletes ----------

  const alunosFiltrados = (contatos ?? [])
    .filter((contato) =>
      normalizar(contato.outro_nome).includes(normalizar(alunoBusca)),
    )
    .slice(0, 10);

  const cidadesFiltradas = (cidades ?? [])
    .filter((cidade) =>
      normalizar(cidade.nome).includes(normalizar(cidadeBusca)),
    )
    .slice(0, 10);

  // ---------- Regras de horário ----------

  const ocupados = useMemo(
    () => (dataAula ? intervalosOcupados(aulas ?? [], dataAula) : []),
    [aulas, dataAula],
  );

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
    setArrayErrosBackend([]);

    const resposta = await axios.post(
      "/api/calendario",
      {
        usuarioId: Number(dados.usuarioId),
        data: dados.data,
        horario_inicio: dados.horario_inicio,
        horario_fim: dados.horario_fim,
        cidadeId: Number(dados.cidadeId),
        categoria: dados.categoria,
      },
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

    setArrayErrosBackend([["geral", "Não foi possível criar a aula"]]);
  };

  return (
    <>
      <Popup aberto={aberto} onFechar={fechar} titulo="Nova aula">
        <form className="form-aula" onSubmit={handleSubmit(onSubmit)}>
          <div className="field">
            <label className="label" htmlFor="aula-aluno">
              Aluno
            </label>
            <div className="popup-aula__autocomplete">
              <input
                id="aula-aluno"
                className="input"
                type="text"
                placeholder="Digite o nome do aluno"
                autoComplete="off"
                value={alunoBusca}
                readOnly={!!alunoInicial}
                onChange={(event) => {
                  setAlunoBusca(event.target.value);
                  setMostrarAlunos(true);
                  setValue("usuarioId", "");
                }}
              />
              <input
                type="hidden"
                {...register("usuarioId", { required: true })}
              />
              {!alunoInicial &&
                mostrarAlunos &&
                alunoBusca.length > 0 &&
                alunosFiltrados.length > 0 && (
                  <ul className="popup-aula__sugestoes">
                    {alunosFiltrados.map((contato) => (
                      <li
                        key={contato.outro_id}
                        className="popup-aula__sugestao"
                        onClick={() => {
                          setAlunoBusca(contato.outro_nome);
                          setValue("usuarioId", contato.outro_id, {
                            shouldValidate: true,
                          });
                          setMostrarAlunos(false);
                        }}
                      >
                        {contato.outro_nome}
                      </li>
                    ))}
                  </ul>
                )}
            </div>
            {errors?.usuarioId?.type === "required" && (
              <p className="error-message">Selecione um aluno da lista.</p>
            )}
          </div>

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

          <MsgErrosBackEnd arrayErrosBackend={arrayErrosBackend} />

          <div className="popup__rodape">
            <button
              className="btn btn--ghost btn--square"
              type="button"
              onClick={fechar}
            >
              Cancelar
            </button>
            <button
              className="btn btn--primary btn--square"
              type="submit"
              disabled={isSubmitting || !!erroInicio || !!erroFim}
            >
              {isSubmitting ? "Criando..." : "Criar aula"}
            </button>
          </div>
        </form>
      </Popup>
    </>
  );
}
