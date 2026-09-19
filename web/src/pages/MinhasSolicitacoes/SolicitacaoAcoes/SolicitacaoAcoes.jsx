import "./SolicitacaoAcoes.css";

export function SolicitacaoAcoes({
    item,
    confirmacaoPendente,
    pedirConfirmacao,
    cancelarConfirmacao,
    aceitar,
    recusar,
    emAndamento
}) {

    const IconCheck = (p) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
    const IconClose = (p) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );

    return (
        <>
            <div className="solic-card__actions">
                {item.status === "pendente" ? (
                    confirmacaoPendente?.id === item.id ? (
                        <div className="solic-card__confirm">
                            <span className="solic-card__confirm-text">
                                {confirmacaoPendente.tipo === 'aceitar'
                                    ? 'Aceitar Solicitação?'
                                    : 'Recusar Solicitação?'}
                            </span>
                            <button
                                type="button"
                                className="btn btn--square btn--ghost btn--sm"
                                onClick={cancelarConfirmacao}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className={`btn btn--square btn--sm ${confirmacaoPendente.tipo === 'aceitar' ? 'btn--primary' : 'btn--danger'
                                    }`}
                                disabled={emAndamento}
                                onClick={() =>
                                    confirmacaoPendente.tipo === 'aceitar'
                                        ? aceitar(item.id, item.usuario_id)
                                        : recusar(item.id)
                                }
                            >
                                Confirmar
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                className="icon-btn icon-btn--accept"
                                title="Aceitar"
                                onClick={() => pedirConfirmacao(item.id, 'aceitar')}
                            >
                                <IconCheck />
                            </button>
                            <button
                                className="icon-btn icon-btn--reject"
                                title="Recusar"
                                onClick={() => pedirConfirmacao(item.id, 'recusar')}
                            >
                                <IconClose />
                            </button>
                        </>
                    )
                ) : item.status === "aceita" ? (
                    <span className="badge badge--primary">Aceita</span>
                ) : (
                    <span className="badge badge--danger">Recusada</span>
                )}
            </div>
        </>
    );
}