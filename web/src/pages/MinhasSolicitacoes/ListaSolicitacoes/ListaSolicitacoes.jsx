import avatarPadrao from "../../../assets/images/icons/user.png";
import { SolicitacaoAcoes } from "../SolicitacaoAcoes/SolicitacaoAcoes";
import "./ListaSolicitacoes.css";

export function ListaSolicitacoes({
    solicitacoes,
    confirmacaoPendente,
    pedirConfirmacao,
    cancelarConfirmacao,
    aceitar,
    recusar,
    fotosComErro,
    marcarFotoComErro,
    acoesEmAndamento
}) {

    const IconClock = (p) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15.5 14" />
        </svg>
    );
    const IconPin = (p) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
        </svg>
    );

    const doisPrimeirosNomes = (nomeCompleto) =>
        nomeCompleto.trim().split(/\s+/).slice(0, 2).join(" ");
    
    if (solicitacoes.length === 0) {
        return <div className="empty-state">Nenhuma solicitação por aqui no momento.</div>;
    }

    return (
        <div id="solic-lista" className="solic-lista">
            {solicitacoes.map((item) => {

                const temFotoValida = item.foto && !fotosComErro.has(item.id);

                const srcFoto = temFotoValida
                    ? `http://localhost/MatchMarcha/uploads/${item.foto}`
                    : avatarPadrao;

                const catClass =
                    item.categoria === "A" ? "badge-cat--a" : item.categoria === "AB" ? "badge-cat--ab" : "badge-cat--b";

                return (
                    <div className="solic-card" key={item.id}>

                        <div className="avatar-circle">
                            <img
                                src={srcFoto}
                                alt={`Foto de ${item.nome}`}
                                className="avatar-circle__img"
                                onError={() => marcarFotoComErro(item.id)}
                            />
                        </div>

                        <span className="solic-card__name" title={item.nome}>
                            {doisPrimeirosNomes(item.nome)}
                        </span>

                        <span className="solic-card__divider" aria-hidden="true" />

                        <span className="solic-card__categoria">
                            <span className={`badge-cat ${catClass}`}>{item.categoria}</span>
                        </span>
                        <span className="info-item info-item--periodo"><IconClock /> {item.periodo}</span>
                        <span className="info-item info-item--cidade"><IconPin /> {item.cidade}</span>

                        <span className="solic-card__divider" aria-hidden="true" />

                        <div className="solic-card__actions">
                            <SolicitacaoAcoes
                                item={item}
                                confirmacaoPendente={confirmacaoPendente}
                                pedirConfirmacao={pedirConfirmacao}
                                cancelarConfirmacao={cancelarConfirmacao}
                                aceitar={aceitar}
                                recusar={recusar}
                                emAndamento={acoesEmAndamento.has(item.id)}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
