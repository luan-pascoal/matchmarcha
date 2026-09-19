import { useEffect, useRef, useState } from 'react';
import {
  IconSearch, IconChatEmpty, IconChevronDown, IconDocument,
  IconEdit, IconTrash, IconCopy, IconCheck, IconX, IconArrowUp, IconArrowDown
} from '../IconesChat.jsx';
import { formatarHora, formatarRotuloData, mesmaData, normalizar, dentroDoPrazoEdicao } from '../chatHelpers.js';
import './Conversa.css';

const ALTURA_ESTIMADA_MENU_MENSAGEM = 150;

export function Conversa({
  contatoSelecionado,
  contatoSelecionadoId,
  srcFoto,
  marcarFotoComErro,
  carregandoMensagens,
  erroMensagens,
  buscarMensagens,
  mensagens,
  anexoSelecionado,
  cancelarAnexo,
  mensagensSelecionadasIds,
  toggleSelecaoMensagem,
  modoSelecao,
  abrirEdicao,
  iniciarSelecao,
  usuario
}) {

  const [buscaMensagemAberta, setBuscaMensagemAberta] = useState(false);
  const [buscaMensagem, setBuscaMensagem] = useState('');
  const [indiceResultadoBusca, setIndiceResultadoBusca] = useState(0);

  const [menuMensagemAbertoId, setMenuMensagemAbertoId] = useState(null);
  const [menuAbreDirecao, setMenuAbreDirecao] = useState("baixo");

  const mensagensRef = useRef(null);
  const menuMensagemRef = useRef(null);
  const mensagemRefs = useRef(new Map());

  // Autoscroll pra mensagem mais recente
  useEffect(() => {
    if (mensagensRef.current) {
      mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight;
    }
  }, [contatoSelecionadoId, mensagens.length]);

  // Fecha o menu de opções da mensagem (editar/remover/copiar) ao clicar fora dele
  useEffect(() => {
    function fecharAoClicarFora(event) {
      if (menuMensagemRef.current && !menuMensagemRef.current.contains(event.target)) {
        setMenuMensagemAbertoId(null);
      }
    }
    document.addEventListener("mousedown", fecharAoClicarFora);
    return () => document.removeEventListener("mousedown", fecharAoClicarFora);
  }, []);

  const idsResultadoBusca = buscaMensagem
    ? mensagens
      .filter((m) => m.Msg_datadelete === null && m.Msg_texto && normalizar(m.Msg_texto).includes(normalizar(buscaMensagem)))
      .map((m) => m.Msg_id)
    : [];

  const idFocadoBusca = idsResultadoBusca[indiceResultadoBusca];

  useEffect(() => {
    if (idsResultadoBusca.length === 0) return;
    setIndiceResultadoBusca(idsResultadoBusca.length - 1);
  }, [buscaMensagem]);

  useEffect(() => {
    if (idsResultadoBusca.length === 0) return;
    const idFocado = idsResultadoBusca[indiceResultadoBusca];
    rolarAteMensagem(idFocado);
  }, [indiceResultadoBusca, idsResultadoBusca]);

  function rolarAteMensagem(msgId) {
    const elemento = mensagemRefs.current.get(msgId);
    if (elemento) {
      elemento.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function irParaResultadoAnterior() {
    setIndiceResultadoBusca((atual) =>
      atual === 0 ? idsResultadoBusca.length - 1 : atual - 1
    );
  }

  function irParaProximoResultado() {
    setIndiceResultadoBusca((atual) =>
      atual === idsResultadoBusca.length - 1 ? 0 : atual + 1
    );
  }

  function renderTextoComDestaque(texto, termo) {
    if (!termo) return texto;

    const textoNormalizado = normalizar(texto);
    const termoNormalizado = normalizar(termo);

    if (!textoNormalizado) return;

    const partes = [];
    let ultimoIndice = 0;
    let indice = textoNormalizado.indexOf(termoNormalizado);

    while (indice !== -1) {
      partes.push(texto.slice(ultimoIndice, indice));
      partes.push(
        <mark key={indice} className="chat-search-highlight">
          {texto.slice(indice, indice + termoNormalizado.length)}
        </mark>
      );
      ultimoIndice = indice + termoNormalizado.length;
      indice = textoNormalizado.indexOf(termoNormalizado, ultimoIndice);
    }

    partes.push(texto.slice(ultimoIndice));
    return partes;
  }

  function srcAnexo(caminho) {
    return `http://localhost/MatchMarcha/uploads/chat/${caminho}`;
  }

  function aoCarregarImagemAnexo() {
    if (mensagensRef.current) {
      mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight;
    }
  }

  function renderConteudoMensagem(msg) {
    return (
      <>
        {msg.Msg_anexocaminho && (
          msg.Msg_anexotipo === 'imagem' ? (
            <img
              src={srcAnexo(msg.Msg_anexocaminho)}
              alt="Imagem enviada"
              className="chat-bubble__anexo-imagem"
              onLoad={aoCarregarImagemAnexo}
            />
          ) : (
            <a
              href={srcAnexo(msg.Msg_anexocaminho)}
              target="_blank"
              rel="noreferrer"
              className="chat-bubble__anexo-documento"
            >
              <IconDocument />
              <span>{msg.Msg_anexocaminho.split('_').slice(1).join('_')}</span>
            </a>
          )
        )}

        {msg.Msg_texto && renderTextoComDestaque(msg.Msg_texto, buscaMensagem)}
      </>
    );
  }

  function alternarMenuMensagem(event, msgId) {
    const jaAberto = menuMensagemAbertoId === msgId;

    if (jaAberto) {
      setMenuMensagemAbertoId(null);
      return;
    }

    if (mensagensRef.current) {
      const triggerRect = event.currentTarget.getBoundingClientRect();
      const containerRect = mensagensRef.current.getBoundingClientRect();
      const espacoAbaixo = containerRect.bottom - triggerRect.bottom;

      setMenuAbreDirecao(
        espacoAbaixo < ALTURA_ESTIMADA_MENU_MENSAGEM ? "cima" : "baixo"
      );
    }

    setMenuMensagemAbertoId(msgId);
  }

  // Regras: mensagens de sistema nunca chegam aqui (filtradas antes da chamada).
  // Mensagens próprias mostram Editar (se dentro do prazo de 30min), Remover e Copiar.
  // Mensagens de outra pessoa mostram só Copiar.
  function renderBotaoOpcoesMensagem(msg, lado) {
    const aberto = menuMensagemAbertoId === msg.Msg_id;

    const ehPropria = msg.Msg_remetente === usuario.usuario.tipo;
    const podeEditar = ehPropria && dentroDoPrazoEdicao(msg.Msg_datacriacao);

    return (
      <div
        className={
          "chat-bubble-menu-wrap chat-bubble-menu-wrap--" +
          lado +
          (aberto && menuAbreDirecao === "cima"
            ? " chat-bubble-menu-wrap--abre-cima"
            : "") +
          (aberto ? " chat-bubble-menu-wrap--open" : "")
        }
        ref={aberto ? menuMensagemRef : null}
      >
        <button
          type="button"
          className="chat-bubble-menu-trigger"
          aria-label="Opções da mensagem"
          onClick={(event) => alternarMenuMensagem(event, msg.Msg_id)}
        >
          <IconChevronDown />
        </button>

        {aberto && (
          <div className="chat-bubble-menu">
            {ehPropria && podeEditar && (
              <button
                type="button"
                onClick={() => { setMenuMensagemAbertoId(null); abrirEdicao(msg); }}
              >
                <IconEdit />
                Editar
              </button>
            )}
            {ehPropria && (
              <button
                type="button"
                className="chat-bubble-menu__danger"
                onClick={() => { setMenuMensagemAbertoId(null); iniciarSelecao(msg.Msg_id); }}
              >
                <IconTrash />
                Remover
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(msg.Msg_texto);
                setMenuMensagemAbertoId(null);
              }}
            >
              <IconCopy />
              Copiar
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <header className="chat-conversation__header">
        <span className="chat-contact__avatar" aria-hidden="true">
          <img
            src={srcFoto(contatoSelecionado)}
            alt={`Foto de ${contatoSelecionado.outro_nome}`}
            className="chat-contact__avatar-img"
            onError={() => marcarFotoComErro(contatoSelecionado.outro_id)}
          />
        </span>
        <div className="chat-conversation__title">
          <p className="chat-contact__name">
            {contatoSelecionado.outro_nome}
          </p>
        </div>
        <button
          type="button"
          className="chat-icon-btn"
          aria-label="Buscar mensagem nesta conversa"
          onClick={() => setBuscaMensagemAberta((v) => !v)}
        >
          <IconSearch />
        </button>
      </header>

      {anexoSelecionado ? (
        <div className="chat-attachment-preview">
          <button
            type="button"
            className="chat-attachment-preview__cancelar"
            aria-label="Cancelar anexo"
            onClick={cancelarAnexo}
          >
            <IconX />
          </button>

          {anexoSelecionado.tipo === 'imagem' ? (
            <img
              src={anexoSelecionado.previewUrl}
              alt="Pré-visualização da imagem"
              className="chat-attachment-preview__imagem"
            />
          ) : (
            <div className="chat-attachment-preview__documento">
              <IconDocument />
              <p className="chat-attachment-preview__nome">{anexoSelecionado.arquivo.name}</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div
            className={
              "chat-conversation__message-search" +
              (buscaMensagemAberta ? " chat-conversation__message-search--open" : "")
            }
          >
            <div className="chat-search-field">
              <IconSearch />
              <input
                type="text"
                placeholder="Buscar nesta conversa"
                value={buscaMensagem}
                onChange={(e) => setBuscaMensagem(e.target.value)}
              />
              {idsResultadoBusca.length > 0 && (
                <div className="chat-search-nav">
                  <span className="chat-search-nav__contador">
                    {indiceResultadoBusca + 1} de {idsResultadoBusca.length}
                  </span>
                  <button
                    type="button"
                    className="chat-search-nav__btn"
                    aria-label="Resultado anterior"
                    onClick={irParaResultadoAnterior}
                  >
                    <IconArrowUp />
                  </button>
                  <button
                    type="button"
                    className="chat-search-nav__btn"
                    aria-label="Próximo resultado"
                    onClick={irParaProximoResultado}
                  >
                    <IconArrowDown />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="chat-conversation__messages chat-scroll" ref={mensagensRef}>
            {carregandoMensagens ? (
              <div className="chat-messages-status">
                <p>Carregando mensagens...</p>
              </div>
            ) : erroMensagens.length > 0 ? (
              <div className="chat-messages-status chat-messages-status--erro">
                {erroMensagens.map(([campo, msg]) => (
                  <p key={campo}>{msg}</p>
                ))}

                <button
                  type="button"
                  className="chat-messages-status__retry"
                  onClick={() => buscarMensagens(contatoSelecionadoId)}
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              mensagens.map((msg, index) => {

                const anterior = mensagens[index - 1];

                const mostrarSeparador =
                  !anterior || !mesmaData(anterior.Msg_datacriacao, msg.Msg_datacriacao);

                const ehPropria = msg.Msg_remetente === usuario.usuario.tipo;
                const ehSistema = msg.Msg_remetente === "sistema";
                const removida = msg.Msg_datadelete !== null;
                const selecionada = mensagensSelecionadasIds.has(msg.Msg_id);
                const ehFocadaNaBusca = buscaMensagem && msg.Msg_id === idFocadoBusca;

                return (
                  <div key={msg.Msg_id}>
                    {mostrarSeparador && (
                      <div className="chat-date-divider">
                        {formatarRotuloData(msg.Msg_datacriacao)}
                      </div>
                    )}

                    {ehSistema ? (
                      <div className="chat-bubble-row chat-bubble-row--system">
                        <div className="chat-bubble chat-bubble--system">
                          {removida ? "Mensagem removida" : msg.Msg_texto}
                          <span className="chat-bubble__time">
                            {formatarHora(msg.Msg_datacriacao)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="chat-message-row"
                        ref={(el) => {
                          if (el) mensagemRefs.current.set(msg.Msg_id, el);
                          else mensagemRefs.current.delete(msg.Msg_id);
                        }}
                        onClick={
                          modoSelecao
                            ? () => toggleSelecaoMensagem(msg.Msg_id)
                            : undefined
                        }
                      >
                        {modoSelecao && (
                          <button
                            type="button"
                            className={
                              "chat-message-checkbox" +
                              (selecionada ? " chat-message-checkbox--checked" : "")
                            }
                            aria-label="Selecionar mensagem"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleSelecaoMensagem(msg.Msg_id);
                            }}
                          >
                            {selecionada && <IconCheck />}
                          </button>
                        )}

                        <div
                          className={
                            "chat-bubble-row " +
                            (ehPropria ? "chat-bubble-row--own" : "chat-bubble-row--other")
                          }
                        >
                          {!modoSelecao && ehPropria && !removida && renderBotaoOpcoesMensagem(msg, "own")}

                          <div
                            className={
                              "chat-bubble " +
                              (ehPropria ? "chat-bubble--own" : "chat-bubble--other") +
                              (removida ? " chat-bubble--removida" : "") +
                              (ehFocadaNaBusca ? " chat-bubble--foco-busca" : "")
                            }
                            onClick={(event) => {
                              if (modoSelecao) event.stopPropagation();
                            }}
                          >
                            {removida ? "Mensagem removida" : renderConteudoMensagem(msg)}
                            <span className="chat-bubble__time">
                              {formatarHora(msg.Msg_datacriacao)}
                            </span>
                          </div>

                          {!modoSelecao && !ehPropria && !removida && renderBotaoOpcoesMensagem(msg, "other")}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </>
  );
}