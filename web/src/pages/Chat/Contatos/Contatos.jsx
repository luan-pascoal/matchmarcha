import { useState } from 'react';
import { IconSearch } from '../IconesChat.jsx';
import { normalizar } from '../chatHelpers.js';
import './Contatos.css';

function truncarPrevia(contato, limite = 42) {
  if (contato.Msg_anexotipo === 'imagem') return "📷 Foto";
  if (contato.Msg_anexotipo === 'documento') return "📄 Documento";
  if (!contato.Msg_texto) return "";
  if (contato.Msg_texto.length <= limite) return contato.Msg_texto;
  return contato.Msg_texto.slice(0, limite).trimEnd() + "...";
}

export function Contatos({ 
  contatos, 
  buscarContatos, 
  erroContatos, 
  contatoSelecionadoId, 
  setContatoSelecionadoId, 
  srcFoto, 
  marcarFotoComErro 
}) {

  const [buscaContato, setBuscaContato] = useState('');

  const contatosFiltrados = contatos.filter((contato) =>
    normalizar(contato.outro_nome).includes(normalizar(buscaContato))
  );

  return (
    <aside className="chat-sidebar">
      <div className="chat-sidebar__search">
        <div className="chat-search-field">
          <IconSearch />
          <input
            type="text"
            placeholder="Buscar conversa"
            value={buscaContato}
            onChange={(e) => setBuscaContato(e.target.value)}
          />
        </div>
      </div>

      <ul className="chat-contact-list chat-scroll">
        {erroContatos ? (
          <li className="chat-contact-list__empty chat-contact-list__empty--erro">
            <p>{erroContatos}</p>
            <button
              type="button"
              className="chat-contact-list__retry"
              onClick={() => buscarContatos()}
            >
              Tentar novamente
            </button>
          </li>
        ) : contatos.length === 0 ? (
          <li className="chat-contact-list__empty">
            <p>Você ainda não tem nenhuma conversa</p>
          </li>
        ) : (
          contatosFiltrados.map((contato) => (
            <li key={contato.Ctt_id}>
              <button
                type="button"
                className={
                  "chat-contact" +
                  (contato.Ctt_id === contatoSelecionadoId
                    ? " chat-contact--active"
                    : "")
                }
                onClick={() => setContatoSelecionadoId(contato.Ctt_id)}
              >
                <span className="chat-contact__avatar" aria-hidden="true">
                  <img
                    src={srcFoto(contato)}
                    alt={`Foto de ${contato.outro_nome}`}
                    className="chat-contact__avatar-img"
                    onError={() => marcarFotoComErro(contato.outro_id)}
                  />
                </span>
                <span className="chat-contact__info">
                  <p className="chat-contact__name">{contato.outro_nome}</p>
                  <p className="chat-contact__preview">
                    {truncarPrevia(contato)}
                  </p>
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}