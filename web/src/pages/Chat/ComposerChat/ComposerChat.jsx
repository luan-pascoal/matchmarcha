import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import {
  IconSend, IconPlus, IconCalendar, IconDocument, IconImage, IconX, IconTrash
} from '../IconesChat.jsx';
import './ComposerChat.css';

const TIPOS_DOCUMENTO_ACEITOS = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt";

export function ComposerChat({
  anexoSelecionado,
  erroAnexo,
  legendaAnexo,
  setLegendaAnexo,
  enviarArquivo,
  inputImagemRef,
  inputDocumentoRef,
  aoSelecionarImagem,
  aoSelecionarArquivo,
  modoSelecao,
  cancelarSelecao,
  mensagensSelecionadasIds,
  setPopupExcluir,
  contatoSelecionadoId,
  setMensagens,
  buscarContatos,
  usuario
}) {

  const [anexoMenuAberto, setAnexoMenuAberto] = useState(false);
  const [erroEnvio, setErroEnvio] = useState([]);
  const anexoMenuRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  // Fecha o menu de anexo (documento/imagem) ao clicar fora dele
  useEffect(() => {
    function fecharAoClicarFora(event) {
      if (anexoMenuRef.current && !anexoMenuRef.current.contains(event.target)) {
        setAnexoMenuAberto(false);
      }
    }
    document.addEventListener("mousedown", fecharAoClicarFora);
    return () => document.removeEventListener("mousedown", fecharAoClicarFora);
  }, []);

  // Função responsável por enviar as mensagens
  const enviarMensagem = async (data) => {

    setErroEnvio([]);
    const texto = data.mensagem.trim();

    const resposta = await axios.post(`/api/mensagens/${contatoSelecionadoId}`,
      { texto },
      {
        validateStatus: () => true,
        withCredentials: true
      }
    );

    if (resposta.status === 200) {

      const mensagemEnviada = resposta.data.Sucesso.mensagem;

      setMensagens((prev) => {
        const jaExiste = prev.some((m) => m.Msg_id === mensagemEnviada.Msg_id);
        if (jaExiste) return prev;
        return [...prev, mensagemEnviada];
      });

      buscarContatos({ silencioso: true });
      reset();

    } else {
      setErroEnvio(Object.entries(resposta.data?.Erro ?? {}));
    }
  };

  function abrirSeletorImagem() {
    setAnexoMenuAberto(false);
    inputImagemRef.current.click();
  }

  function abrirSeletorDocumento() {
    setAnexoMenuAberto(false);
    inputDocumentoRef.current.click();
  }

  return (
    <footer className="chat-conversation__composer">

      {anexoSelecionado ? (
        <>
          {erroAnexo.length > 0 && (
            <div className="chat-composer__erro-envio">
              {erroAnexo.map(([campo, msg]) => (
                <p key={campo}>{msg}</p>
              ))}
            </div>
          )}

          <form
            className="chat-composer__form"
            onSubmit={(event) => { event.preventDefault(); enviarArquivo(); }}
          >
            <div className="chat-composer__field">
              <input
                type="text"
                className="chat-composer__input"
                placeholder="Digite sua mensagem aqui..."
                autoComplete="off"
                value={legendaAnexo}
                onChange={(event) => setLegendaAnexo(event.target.value)}
              />
            </div>
            <button
              type="submit"
              className="chat-icon-btn chat-composer__send"
              aria-label="Enviar anexo"
            >
              <IconSend />
            </button>
          </form>
        </>
      ) : modoSelecao ? (
        <div className="chat-selection-bar">
          <button
            type="button"
            className="chat-icon-btn"
            aria-label="Cancelar seleção"
            onClick={cancelarSelecao}
          >
            <IconX />
          </button>

          <span className="chat-selection-bar__contador">
            {mensagensSelecionadasIds.size}{" "}
            {mensagensSelecionadasIds.size === 1 ? "selecionada" : "selecionadas"}
          </span>

          <button
            type="button"
            className="chat-icon-btn chat-selection-bar__excluir"
            aria-label="Excluir mensagens selecionadas"
            onClick={() => setPopupExcluir(true)}
          >
            <IconTrash />
          </button>
        </div>
      ) : (
        <>
          {erroEnvio.length > 0 && !errors?.mensagem && (
            <div className="chat-composer__erro-envio">
              {erroEnvio.map(([campo, msg]) => (
                <p key={campo}>{msg}</p>
              ))}
            </div>
          )}

          <div className="chat-attach-menu-wrap" ref={anexoMenuRef}>
            <button
              type="button"
              className="chat-icon-btn"
              aria-label="Anexar arquivo"
              onClick={() => setAnexoMenuAberto((v) => !v)}
            >
              <IconPlus />
            </button>

            {anexoMenuAberto && (
              <div className="chat-attach-menu">
                <button type="button" onClick={abrirSeletorDocumento}>
                  <IconDocument />
                  Documento
                </button>
                <button type="button" onClick={abrirSeletorImagem}>
                  <IconImage />
                  Foto ou vídeo
                </button>
              </div>
            )}

            <input
              type="file"
              ref={inputDocumentoRef}
              accept={TIPOS_DOCUMENTO_ACEITOS}
              className="chat-attach-input-oculto"
              onChange={aoSelecionarArquivo}
            />
            <input
              type="file"
              ref={inputImagemRef}
              accept="image/*,video/*"
              className="chat-attach-input-oculto"
              onChange={aoSelecionarImagem}
            />
          </div>

          <form
            id="chat-composer-form"
            className="chat-composer__form"
            onSubmit={handleSubmit(enviarMensagem)}
          >
            <div className="chat-composer__field">
              <input
                type="text"
                className="chat-composer__input"
                placeholder="Digite sua mensagem aqui..."
                autoComplete="off"
                {...register("mensagem", {
                  required: true,
                  validate: (value) => value.trim().length > 0,
                  maxLength: 1024,
                  onChange: () => setErroEnvio([]),
                })}
              />
              {errors?.mensagem?.type === 'required' && (
                <p className="chat-composer__error">Você deve escrever uma mensagem para enviar.</p>
              )}
              {errors?.mensagem?.type === 'validate' && (
                <p className="chat-composer__error">A mensagem não pode estar vazia.</p>
              )}
              {errors?.mensagem?.type === 'maxLength' && (
                <p className="chat-composer__error">A mensagem não pode ter mais de 1024 caracteres.</p>
              )}
            </div>
          </form>

          <button
            type="submit"
            form="chat-composer-form"
            className="chat-icon-btn chat-composer__send"
            aria-label="Enviar mensagem"
          >
            <IconSend />
          </button>

          {usuario.usuario.tipo === "instrutor" && (
            <button type="button" className="chat-icon-btn" aria-label="Criar aula">
              <IconCalendar />
            </button>
          )}
        </>
      )}
    </footer>
  );
}