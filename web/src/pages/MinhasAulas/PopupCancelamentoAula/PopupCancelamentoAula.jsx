import { useState } from "react";
import axios from "axios";
import { Popup } from "../../../components/popup/Popup";
import { MsgErrosBackEnd } from "../../../components/MsgErrosBackEnd";
import "./PopupCancelamentoAula.css";

export function PopupCancelamentoAula({
  aberto,
  fechar,
  fecharDetalhes,
  aulaSelecionada,
  cidades,
  buscarAulas
}) {
    
  const [cancelando, setCancelando] = useState(false);
  const [arrayErrosBackend, setArrayErrosBackend] = useState([]);

  if (!aulaSelecionada) return null;

  const cidade = (cidades ?? []).find(
    (c) => Number(c.id) === Number(aulaSelecionada.Au_cidadeid),
  );

  // Au_data vem como AAAA-MM-DD; formatamos sem usar Date para não deslocar o dia
  const [ano, mes, dia] = aulaSelecionada.Au_data.split("-");

  // "Manter aula": fecha só este popup e volta para os detalhes
  const manterAula = () => {
    setArrayErrosBackend([]);
    fechar();
  };

  const confirmarCancelamento = async () => {
    setCancelando(true);
    setArrayErrosBackend([]);

    const resposta = await axios.delete(
      `/api/calendario/${aulaSelecionada.Au_id}`,
      {
        validateStatus: () => true,
        withCredentials: true,
      },
    );

    setCancelando(false);

    if (resposta.status === 200 && resposta.data.Sucesso) {
      await buscarAulas({ silencioso: true });
      fechar();
      fecharDetalhes();
      return;
    }

    if (resposta.status === 422) {
      setArrayErrosBackend(Object.entries(resposta?.data?.Erro ?? {}));
      return;
    }

    setArrayErrosBackend([["geral", "Não foi possível cancelar a aula"]]);
  };

  return (
    <Popup aberto={aberto} onFechar={manterAula} titulo="Cancelar aula">
      <div className="cancelar-aula">
        <p>
          Tem certeza de que deseja cancelar esta aula? Essa ação não pode ser
          desfeita.
        </p>

        <dl className="cancelar-aula__dados">
          <div>
            <dt className="cancelar-aula__rotulo">Aluno</dt>
            <dd>{aulaSelecionada.outro_nome}</dd>
          </div>
          <div>
            <dt className="cancelar-aula__rotulo">Data</dt>
            <dd>{`${dia}/${mes}/${ano}`}</dd>
          </div>
          <div>
            <dt className="cancelar-aula__rotulo">Horário</dt>
            <dd>
              {aulaSelecionada.Au_horario_inicio.substring(0, 5)} –{" "}
              {aulaSelecionada.Au_horario_fim.substring(0, 5)}
            </dd>
          </div>
          <div>
            <dt className="cancelar-aula__rotulo">Categoria</dt>
            <dd>{aulaSelecionada.Au_categoria}</dd>
          </div>
          <div>
            <dt className="cancelar-aula__rotulo">Cidade</dt>
            <dd>{cidade ? `${cidade.nome} - ${cidade.uf}` : "—"}</dd>
          </div>
        </dl>

        <MsgErrosBackEnd arrayErrosBackend={arrayErrosBackend} />

        <div className="popup__rodape">
          <button
            className="btn btn--ghost btn--square"
            type="button"
            onClick={manterAula}
          >
            Manter aula
          </button>
          <button
            className="btn btn--primary btn--square"
            type="button"
            onClick={confirmarCancelamento}
            disabled={cancelando}
          >
            {cancelando ? "Cancelando..." : "Confirmar cancelamento"}
          </button>
        </div>
      </div>
    </Popup>
  );
}