import Carro from '../../assets/images/icons/carro.png';
import Moto from '../../assets/images/icons/moto.png';

export function CardVeiculo({ veiculo, onEditar, onExcluir }) {

    const isMoto = veiculo.tipo === 'M';
    const temPedalAux =  veiculo.pedalAux === 'S';

    return (
        <article className="veiculo-card">

            {/* Imagem / logo da marca */}
            <div className="veiculo-card__img">
                <img className="veiculo-card__img-placeholder" src={`/logos/${veiculo.marca}.png`} alt={`Logo ${veiculo.marca}`} />
            </div>

            {/* Tipo + marca + modelo */}
            <div className="veiculo-card__header">
                <img
                    className="veiculo-card__tipo-icon"
                    src={
                        isMoto 
                        ? Moto
                        : Carro
                    }
                    alt={isMoto ? 'Moto' : 'Carro'}
                    title={isMoto ? 'Moto' : 'Carro'}
                />
                <div>
                    <p className="veiculo-card__marca">{veiculo.marca}</p>
                    <h3 className="veiculo-card__modelo">{veiculo.modelo}</h3>
                </div>
            </div>

            {/* Informações */}
            <ul className="veiculo-card__info">
                <li><span className="veiculo-card__info-label">Ano</span><span>{veiculo.ano}</span></li>
                <li><span className="veiculo-card__info-label">Câmbio</span><span>{veiculo.cambio}</span></li>
                <li><span className="veiculo-card__info-label">Direção</span><span>{veiculo.direcao}</span></li>
                <li><span className="veiculo-card__info-label">Cor</span><span>{veiculo.cor}</span></li>
                {!isMoto && (
                    <li>
                        <span className="veiculo-card__info-label">Pedal aux</span>
                        <span className={`veiculo-card__pedal ${temPedalAux ? 'veiculo-card__pedal--sim' : 'veiculo-card__pedal--nao'}`}>
                            {temPedalAux ? 'Sim' : 'Não'}
                        </span>
                    </li>
                )}
                {isMoto && (
                    <li><span className="veiculo-card__info-label">Cilindrada</span><span>{veiculo.cilindrada} cc</span></li>
                )}
            </ul>

            {
            /* 
                Ações 

                Cada card possui um botão de editar e um de excluir

                Exemplo: se tem 3 carros (3 cards) => 1 Civic, 1 Gol, 1 Uno

                Quando você está no card do Gol:
                E clica em Editar => roda a função onEditar e passa o gol como parametro
                E clica em Excluir => roda a função onExcluir e passa o gol como parametro

                No component MeusVeiuclos, temos as funções onEditar e onExcluir: 
                onEditar={(veiculo) => { setVeiculoEditando(veiculo); setPopupEditar(true); }}
                onExcluir={(veiculo) => { setVeiculoExcluindo(veiculo); setPopupExcluir(true); }}

                setVeiculoEditando e setVeiculoExcluindo deixam de ser null e recebem o gol
                e setPopupEditar e setPopupExcluir deixam de ser false e tornam true,
                abrindo o popup de edição ou exclusão

                Isso acontece, pois oq condiciona o popup estar aberto ou fechado é justo esses states:
                <PopupEditar
                    aberto={popupEditar}
                />
                <PopupExcluir
                    aberto={popupExcluir}
                />
            */
            }
            <div className="veiculo-card__acoes">
                <button className="btn btn--ghost veiculo-card__btn-editar" onClick={() => onEditar(veiculo)} title="Editar veículo">
                    Editar
                </button>
                <button className="btn btn--danger veiculo-card__btn-excluir" onClick={() => onExcluir(veiculo)} title="Excluir veículo">
                    Remover
                </button>
            </div>

        </article>
    );
}
