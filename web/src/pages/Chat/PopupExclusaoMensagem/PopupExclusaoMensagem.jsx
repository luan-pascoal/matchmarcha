import { useState } from 'react';
import axios from 'axios';
import { Popup } from '../../../components/popup/Popup';
import { dentroDoPrazoEdicao } from '../chatHelpers.js';
import './PopupExclusaoMensagem.css';

export function PopupExclusaoMensagem({
  popupExcluir,
  setPopupExcluir,
  mensagensSelecionadasIds,
  setMensagens,
  cancelarSelecao,
  mensagens,
  usuario
}) {

  const [erroExcluir, setErroExcluir] = useState([]);

  const mensagensSelecionadas = mensagens.filter((m) => mensagensSelecionadasIds.has(m.Msg_id));

  // Verifica se todas as mensagens selecionadas podem ser excluídas para todos:
  // remetente é o usuário logado, e ainda está dentro do prazo de 30 min
  const podeExcluirParaTodos =
    mensagensSelecionadas.length > 0 &&
    mensagensSelecionadas.every(
      (m) => m.Msg_remetente === usuario.usuario.tipo && dentroDoPrazoEdicao(m.Msg_datacriacao)
    );

  const excluirParaMim = async () => {

    setErroExcluir([]);
    const idsSelecionados = [...mensagensSelecionadasIds];

    const respostas = await Promise.all(
      idsSelecionados.map((idMsg) =>
        axios.delete(`/api/mensagens/${idMsg}/ocultar`, {
          validateStatus: () => true,
          withCredentials: true
        })
      )
    );

    const idsComSucesso = idsSelecionados.filter(
      (_, index) => respostas[index].status === 200
    );

    const mensagensErro = respostas
      .filter((resposta) => resposta.status !== 200)
      .flatMap((resposta) => Object.values(resposta.data?.Erro ?? null));

    setMensagens((prev) =>
      prev.filter((m) => !idsComSucesso.includes(m.Msg_id))
    );

    if (mensagensErro.length > 0) {
      setErroExcluir([...new Set(mensagensErro)]);
      return;
    }

    setPopupExcluir(false);
    cancelarSelecao();
  };

  const excluirParaTodos = async () => {

    const idsSelecionados = [...mensagensSelecionadasIds];

    const respostas = await Promise.all(
      idsSelecionados.map((idMsg) =>
        axios.delete(`/api/mensagens/${idMsg}`, {
          validateStatus: () => true,
          withCredentials: true
        })
      )
    );

    const idsComSucesso = idsSelecionados.filter(
      (_, index) => respostas[index].status === 200
    );

    const mensagensErro = respostas
      .filter((resposta) => resposta.status !== 200)
      .flatMap((resposta) => Object.values(resposta.data?.Erro ?? {}));

    setMensagens((prev) =>
      prev.map((m) =>
        idsComSucesso.includes(m.Msg_id)
          ? { ...m, Msg_datadelete: new Date().toISOString() }
          : m
      )
    );

    if (mensagensErro.length > 0) {
      setErroExcluir([...new Set(mensagensErro)]);
      return;
    }

    setPopupExcluir(false);
    cancelarSelecao();
  };

  return (
    <Popup aberto={popupExcluir} onFechar={() => { setPopupExcluir(false); setErroExcluir([]); }} titulo="Excluir mensagem">
      <div className="excluir-mensagem">
        <p className="excluir-mensagem__texto">Deseja excluir a mensagem?</p>

        {erroExcluir.map((msg, index) => (
          <p key={index} className="error-message">{msg}</p>
        ))}

        <div className="popup__rodape excluir-mensagem__rodape">
          <button
            className="btn btn--ghost btn--square"
            type="button"
            onClick={() => { setPopupExcluir(false); setErroExcluir([]); }}
          >
            Cancelar
          </button>
          <button
            className="btn btn--ghost btn--square"
            type="button"
            onClick={excluirParaMim}
          >
            Excluir para mim
          </button>
          {podeExcluirParaTodos && (
            <button
              className="btn btn--primary btn--square"
              type="button"
              onClick={excluirParaTodos}
            >
              Excluir para todos
            </button>
          )}
        </div>
      </div>
    </Popup>
  );
}