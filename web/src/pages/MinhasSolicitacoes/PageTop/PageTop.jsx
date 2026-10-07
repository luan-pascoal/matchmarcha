import { AlertaSucesso } from "../../../components/alertas/AlertaSucesso"
import { AlertaErro } from "../../../components/alertas/AlertaErro";
import "./PageTop.css";

export function Pagetop({
    contagensPorStatus,
    total,
    filtroStatus,
    setFiltroStatus,
    alertaSucesso,
    alertaId,
    setAlertaSucesso,
    alertaErro,
    alertaErroId,
    setAlertaErro,
}) {

    const IconChevronDown = (p) => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );

    const filtros = [
        { key: "pendente", label: "Pendentes" },
        { key: "aceita", label: "Aceitas" },
        { key: "recusada", label: "Recusadas" },
    ];

    return (
        <>
            <div className="solic-page-top">
                {alertaSucesso && (
                    <AlertaSucesso
                        key={alertaId}
                        mensagem={alertaSucesso}
                        onClose={() => setAlertaSucesso(null)}
                    />
                )}
                {alertaErro && (
                    <AlertaErro
                        key={alertaErroId}
                        mensagem={alertaErro}
                        onClose={() => setAlertaErro(null)}
                    />
                )}
                <div className="solic-page__header">
                    <div>
                        <h1 className="solic-page__title">Minhas solicitações</h1>
                        <p className="solic-page__subtitle">
                            Aceite ou recuse os pedidos de aula enviados pelos alunos.
                        </p>
                    </div>

                    <div className="solic-header__right">
                        <div className="solic-filter">
                            <select
                                className="solic-filter__select"
                                value={filtroStatus}
                                onChange={(e) => setFiltroStatus(e.target.value)}
                                aria-label="Filtrar solicitações por status"
                            >
                                {filtros.map((item) => (
                                    <option key={item.key} value={item.key}>
                                        {item.label} ({contagensPorStatus[item.key] ?? 0})
                                    </option>
                                ))}
                            </select>
                            <IconChevronDown className="solic-filter__icon" />
                        </div>

                        <div className="solic-count-wrap">
                            <span className="solic-count">{total}</span>
                            <span className="solic-count__label">total</span>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}