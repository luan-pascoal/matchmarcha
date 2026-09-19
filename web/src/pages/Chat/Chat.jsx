import { useState, useRef, useEffect } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { SiteHeaderLoggedActions } from "../../components/layout/SiteHeader";
import { pusherClient } from "../../services/pusher";
import avatarPadrao from "../../assets/images/icons/user.png";
import axios from "axios";
import { Contatos } from "./Contatos/Contatos.jsx";
import { Conversa } from "./Conversa/Conversa.jsx";
import { ComposerChat } from "./ComposerChat/ComposerChat.jsx";
import { PopupEdicaoMensagem } from "./PopupEdicaoMensagem/PopupEdicaoMensagem.jsx";
import { PopupExclusaoMensagem } from "./PopupExclusaoMensagem/PopupExclusaoMensagem.jsx";
import { IconChatEmpty } from "./IconesChat.jsx";
import "./Chat.css";

const LIMITE_TAMANHO_IMAGEM = 2 * 1024 * 1024;      // 2MB
const LIMITE_TAMANHO_DOCUMENTO = 10 * 1024 * 1024;  // 10MB

export function Chat({ dadosUsuario, carregarUsuario, usuario, contatos, buscarContatos, erroContatos }) {

  const [contatoSelecionadoId, setContatoSelecionadoId] = useState(null);
  const [mensagens, setMensagens] = useState([]);

  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [erroMensagens, setErroMensagens] = useState([]);
  const [fotosComErro, setFotosComErro] = useState(new Set());

  // State que controla se o popup de edição está aberto ou não
  const [mensagemEditando, setMensagemEditando] = useState(null);

  const [anexoSelecionado, setAnexoSelecionado] = useState(null);
  const [erroAnexo, setErroAnexo] = useState([]);
  const [legendaAnexo, setLegendaAnexo] = useState('');

  // States do modo de seleção/exclusão de mensagens
  const [modoSelecao, setModoSelecao] = useState(false);
  const [mensagensSelecionadasIds, setMensagensSelecionadasIds] = useState(new Set());
  // Controla se o popup de remoção está aberto ou não
  const [popupExcluir, setPopupExcluir] = useState(false);

  const inputImagemRef = useRef(null);
  const inputDocumentoRef = useRef(null);

  // Função responsável por buscar as mensagens
  const buscarMensagens = async (idContato) => {

    setCarregandoMensagens(true);
    setErroMensagens([]);

    const resposta = await axios.get(`/api/mensagens/${idContato}`, {
      validateStatus: () => true,
      withCredentials: true
    });

    if (resposta.status === 200) {
      setMensagens(resposta.data.Sucesso.mensagens);
    } else {
      setErroMensagens(Object.entries(resposta.data?.Erro ?? {}));
      setMensagens([]);
    }

    setCarregandoMensagens(false);

  };

  const enviarArquivo = async () => {

    setErroAnexo('');

    const formData = new FormData();
    formData.append('anexo', anexoSelecionado.arquivo);
    formData.append('texto', legendaAnexo.trim());

    const resposta = await axios.post(`/api/mensagens/arquivo/${contatoSelecionadoId}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
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
      cancelarAnexo();

    } else {
      setErroAnexo(Object.entries(resposta.data?.Erro ?? {}));
    }
  };

  // Abre o popup de edição para uma mensagem específica
  function abrirEdicao(msg) {
    setMensagemEditando(msg);
  }

  function fecharEdicao() {
    setMensagemEditando(null);
  }

  // Entra no modo de seleção, já marcando a mensagem clicada no menu
  function iniciarSelecao(msgId) {
    setModoSelecao(true);
    setMensagensSelecionadasIds(new Set([msgId]));
  }

  // Alterna o estado de seleção (marcado/desmarcado) de uma mensagem
  function toggleSelecaoMensagem(msgId) {

    setMensagensSelecionadasIds((prev) => {

      const novo = new Set(prev);

      if (novo.has(msgId)) {
        novo.delete(msgId);
      } else {
        novo.add(msgId);
      }

      return novo;
    });
  }

  // Sai do modo de seleção, limpando tudo que estava marcado
  function cancelarSelecao() {
    setModoSelecao(false);
    setMensagensSelecionadasIds(new Set());
  }

  // Toda vez que seleciona um contato diferente, buscamos as mensagens desse contato
  useEffect(() => {

    if (!contatoSelecionadoId) return;

    buscarMensagens(contatoSelecionadoId);

  }, [contatoSelecionadoId])

  // Ao renderizar o component, buscamos os contatos
  useEffect(() => {
    buscarContatos({ silencioso: false });
  }, []);

  // Efeito que escuta o canal private-usuario{id}
  useEffect(() => {

    if (usuario?.usuario?.tipo !== "usuario" || !usuario.id) return;

    const nomeCanal = `private-usuario${usuario.usuario.id}`;
    const canal = pusherClient.subscribe(nomeCanal);

    const aoReceberEvento = () => {
      buscarContatos({ silencioso: true });
    }

    canal.bind('novo-contato', aoReceberEvento);
    canal.bind('mensagem-recebida', aoReceberEvento)

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        buscarContatos({ silencioso: true });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      pusherClient.unbind('novo-contato', aoReceberEvento);
      pusherClient.unbind('mensagem-recebida', aoReceberEvento);
      pusherClient.unsubscribe(nomeCanal);
      document.removeEventListener('visibilitychange', handleVisibility);
    }

  }, [usuario.usuario.tipo, usuario.usuario.id]);

  // Efeito que escuta o canal private-instrutor{id}
  useEffect(() => {

    if (usuario?.usuario?.tipo !== "instrutor" || !usuario.usuario.instrutor_id) return;

    const nomeCanal = `private-instrutor${usuario.usuario.instrutor_id}`;
    const canal = pusherClient.subscribe(nomeCanal);

    const aoReceberMensagem = () => {
      buscarContatos({ silencioso: true });
    };

    canal.bind('mensagem-recebida', aoReceberMensagem);

    return () => {
      pusherClient.unbind('mensagem-recebida', aoReceberMensagem);
      pusherClient.unsubscribe(nomeCanal);
    };

  }, [usuario.usuario.tipo, usuario.usuario.instrutor_id]);

  const contatoSelecionado = contatos.find(
    (c) => c.Ctt_id === contatoSelecionadoId
  );

  // Efeito que escuta o canal private-contato{id}
  useEffect(() => {

    if (!contatoSelecionadoId) return;

    const nomeCanal = `private-contato${contatoSelecionadoId}`;
    const canal = pusherClient.subscribe(nomeCanal);

    const aoReceberMensagem = (novaMensagem) => {

      setMensagens((prev) => {

        const jaExiste = prev.some((m) => m.Msg_id === novaMensagem.Msg_id)

        if (jaExiste) return prev;

        return [...prev, novaMensagem];

      });

    };

    const aoEditarMensagem = (mensagemEditada) => {

      setMensagens((prev) =>

        prev.map((m) =>
          m.Msg_id === mensagemEditada.Msg_id
            ? { ...m, Msg_texto: mensagemEditada.Msg_texto }
            : m
        )

      );
    };

    const aoRemoverMensagem = (mensagemRemovida) => {

      setMensagens((prev) =>
        prev.map((m) =>
          m.Msg_id === mensagemRemovida.Msg_id
            ? { ...m, Msg_datadelete: new Date().toISOString() }
            : m
        )
      );

    };

    canal.bind('nova-mensagem', aoReceberMensagem);
    canal.bind('mensagem-editada', aoEditarMensagem);
    canal.bind('mensagem-removida', aoRemoverMensagem);

    return () => {
      pusherClient.unbind('nova-mensagem', aoReceberMensagem);
      pusherClient.unbind('mensagem-editada', aoEditarMensagem);
      pusherClient.unbind('mensagem-removida', aoRemoverMensagem);
      pusherClient.unsubscribe(nomeCanal);
    }

  }, [contatoSelecionadoId]);

  function marcarFotoComErro(id) {
    setFotosComErro((prev) => new Set(prev).add(id));
  }

  function srcFoto(contato) {

    const temFotoValida = contato.outro_foto && !fotosComErro.has(contato.outro_id);

    return temFotoValida
      ? `http://localhost/MatchMarcha/uploads/${contato.outro_foto}`
      : avatarPadrao;

  }

  function aoSelecionarImagem(event) {

    const arquivo = event.target.files?.[0];
    event.target.value = "";

    if (!arquivo) return;

    if (arquivo.size > LIMITE_TAMANHO_IMAGEM) {
      setErroAnexo("A imagem não pode ter mais de 2MB.");
      return;
    }

    setErroAnexo('');
    const previewUrl = URL.createObjectURL(arquivo);
    setAnexoSelecionado({ arquivo, tipo: 'imagem', previewUrl });

  }

  function aoSelecionarArquivo(event) {

    const arquivo = event.target.files?.[0];
    event.target.value = "";

    if (!arquivo) return;

    if (arquivo.size > LIMITE_TAMANHO_DOCUMENTO) {
      setErroAnexo("O arquivo não pode ter mais de 10MB.");
      return;
    }

    setErroAnexo('');
    setAnexoSelecionado({ arquivo, tipo: 'documento', previewUrl: null });

  }

  function cancelarAnexo() {

    if (anexoSelecionado?.previewUrl) {
      URL.revokeObjectURL(anexoSelecionado.previewUrl);
    }

    setAnexoSelecionado(null);
    setErroAnexo('');
    setLegendaAnexo('');

  }

  useEffect(() => {

    return () => {

      if (anexoSelecionado?.previewUrl) {
        URL.revokeObjectURL(anexoSelecionado.previewUrl);
      }

    };

  }, [anexoSelecionado]);

  useEffect(() => {

    cancelarAnexo();

  }, [contatoSelecionadoId])

  return (
    <AppLayout
      headerRight={
        <SiteHeaderLoggedActions
          dadosUsuario={dadosUsuario}
          carregarUsuario={carregarUsuario}
          tipoUsuario={usuario.usuario.tipo}
        />
      }
      footerRight={`Mensagens${dadosUsuario?.nome ? ` de ${dadosUsuario.nome}` : ""}`}
    >
      <div className="stack stack--lg">
        <div className="chat-page">

          <Contatos
            contatos={contatos}
            buscarContatos={buscarContatos}
            erroContatos={erroContatos}
            contatoSelecionadoId={contatoSelecionadoId}
            setContatoSelecionadoId={setContatoSelecionadoId}
            srcFoto={srcFoto}
            marcarFotoComErro={marcarFotoComErro}
          />

          <section className="chat-conversation">
            {!contatoSelecionado ? (
              <div className="chat-empty-state">
                <IconChatEmpty />
                <p className="chat-empty-state__title">Suas mensagens</p>
                <p className="chat-empty-state__subtitle">
                  Envie mensagens diretamente para o instrutor. Selecione uma
                  conversa ao lado para começar.
                </p>
              </div>
            ) : (
              <>
                <Conversa
                  contatoSelecionado={contatoSelecionado}
                  contatoSelecionadoId={contatoSelecionadoId}
                  srcFoto={srcFoto}
                  marcarFotoComErro={marcarFotoComErro}
                  carregandoMensagens={carregandoMensagens}
                  erroMensagens={erroMensagens}
                  buscarMensagens={buscarMensagens}
                  mensagens={mensagens}
                  anexoSelecionado={anexoSelecionado}
                  cancelarAnexo={cancelarAnexo}
                  mensagensSelecionadasIds={mensagensSelecionadasIds}
                  toggleSelecaoMensagem={toggleSelecaoMensagem}
                  modoSelecao={modoSelecao}
                  abrirEdicao={abrirEdicao}
                  iniciarSelecao={iniciarSelecao}
                  usuario={usuario}
                />
                <ComposerChat
                  anexoSelecionado={anexoSelecionado}
                  erroAnexo={erroAnexo}
                  legendaAnexo={legendaAnexo}
                  setLegendaAnexo={setLegendaAnexo}
                  enviarArquivo={enviarArquivo}
                  inputImagemRef={inputImagemRef}
                  inputDocumentoRef={inputDocumentoRef}
                  aoSelecionarImagem={aoSelecionarImagem}
                  aoSelecionarArquivo={aoSelecionarArquivo}
                  modoSelecao={modoSelecao}
                  cancelarSelecao={cancelarSelecao}
                  mensagensSelecionadasIds={mensagensSelecionadasIds}
                  setPopupExcluir={setPopupExcluir}
                  contatoSelecionadoId={contatoSelecionadoId}
                  setMensagens={setMensagens}
                  buscarContatos={buscarContatos}
                  usuario={usuario}
                />
              </>
            )}
          </section>

        </div>
      </div>

      <PopupEdicaoMensagem
        mensagemEditando={mensagemEditando}
        fecharEdicao={fecharEdicao}
        setMensagens={setMensagens}
      />

      <PopupExclusaoMensagem
        popupExcluir={popupExcluir}
        setPopupExcluir={setPopupExcluir}
        mensagensSelecionadasIds={mensagensSelecionadasIds}
        setMensagens={setMensagens}
        cancelarSelecao={cancelarSelecao}
        mensagens={mensagens}
        usuario={usuario}
      />

    </AppLayout>
  );
}
