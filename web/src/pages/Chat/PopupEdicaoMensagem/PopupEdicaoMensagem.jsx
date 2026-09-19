import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { Popup } from '../../../components/popup/Popup.jsx';
import { formatarHora } from '../chatHelpers.js';
import './PopupEdicaoMensagem.css';

export function PopupEdicaoMensagem({ mensagemEditando, fecharEdicao, setMensagens }) {

  const [erroEdicao, setErroEdicao] = useState([]);
  const textareaEdicaoRef = useRef(null);

  const {
    register: registerEdicao,
    handleSubmit: handleSubmitEdicao,
    reset: resetEdicao,
    formState: { errors: errosEdicao, isDirty: mudouTexto }
  } = useForm();

  // Função responsável por editar uma mensagem
  const editarMensagem = async (idMensagem, novoTexto) => {

    if (novoTexto === '') return;

    setErroEdicao([]);

    const resposta = await axios.put(`/api/mensagens/${idMensagem}`,
      { texto: novoTexto },
      {
        validateStatus: () => true,
        withCredentials: true
      }
    );

    if (resposta.status === 200) {

      const msgAtualizada = resposta.data.Sucesso.mensagem;

      setMensagens((prev) =>
        prev.map((m) =>
          m.Msg_id === msgAtualizada.Msg_id
            ? { ...m, Msg_texto: msgAtualizada.Msg_texto }
            : m
        )
      );

      resetEdicao();
      fecharEdicao();
    } else {
      setErroEdicao(Object.entries(resposta.data?.Erro ?? {}));
    }
  };

  function salvarEdicao(data) {
    if (!mensagemEditando) return;
    editarMensagem(mensagemEditando.Msg_id, data.texto.trim());
  }

  // Foca a textarea de edição e posiciona o cursor no fim do texto
  useEffect(() => {

    if (!mensagemEditando) return;

    resetEdicao({ texto: mensagemEditando.Msg_texto });

    const elemento = textareaEdicaoRef.current;
    if (!elemento) return;

    const tamanho = elemento.value.length;

    elemento.focus();
    elemento.setSelectionRange(tamanho, tamanho);

    requestAnimationFrame(() => {
      elemento.scrollTop = 0;
    });

  }, [mensagemEditando, resetEdicao]);

  return (
    <Popup aberto={!!mensagemEditando} onFechar={fecharEdicao} titulo="Editar mensagem">
      {mensagemEditando && (
        <div className="editar-mensagem">

          <div className="editar-mensagem__preview">
            <div className="chat-bubble chat-bubble--own">
              {mensagemEditando.Msg_texto}
              <span className="chat-bubble__time">
                {formatarHora(mensagemEditando.Msg_datacriacao)}
              </span>
            </div>
          </div>

          <form
            id="editar-mensagem-form"
            onSubmit={handleSubmitEdicao(salvarEdicao)}
          >
            <div className="field">
              <label className="label" htmlFor="editar-mensagem-texto">Editar texto</label>
              {(() => {
                const { ref, ...rest } = registerEdicao("texto", {
                  required: true,
                  validate: (value) => value.trim().length > 0,
                  maxLength: 1024,
                });
                return (
                  <textarea
                    id="editar-mensagem-texto"
                    ref={(el) => { ref(el); textareaEdicaoRef.current = el; }}
                    className="editar-mensagem__textarea"
                    rows={4}
                    {...rest}
                  />
                );
              })()}
              {errosEdicao?.texto?.type === 'required' && (
                <p className="error-message">A mensagem não pode estar vazia.</p>
              )}
              {errosEdicao?.texto?.type === 'validate' && (
                <p className="error-message">A mensagem não pode estar vazia.</p>
              )}
              {errosEdicao?.texto?.type === 'maxLength' && (
                <p className="error-message">A mensagem não pode ter mais de 1024 caracteres.</p>
              )}
              {erroEdicao.map(([campo, msg]) => (
                <p key={campo} className="error-message">{msg}</p>
              ))}
            </div>

            <div className="popup__rodape">
              <button
                className="btn btn--ghost btn--square"
                type="button"
                onClick={fecharEdicao}
              >
                Cancelar
              </button>
              <button
                className="btn btn--primary btn--square"
                type="submit"
                form="editar-mensagem-form"
                disabled={!mudouTexto}
              >
                Salvar alterações
              </button>
            </div>
          </form>

        </div>
      )}
    </Popup>
  );
}