import { useState, useEffect, useRef } from 'react';
import { CardAdicionar } from './CardAdicionar';
import { CardVeiculo } from './CardVeiculo';
import Voltar from '../../assets/images/icons/voltar.png';
import Proximo from '../../assets/images/icons/proximo.png';

export function Carrossel({ veiculos, erroVeiculos, onAdicionar, onEditar, onExcluir }) {

    // Como funciona? Temos duas Divs principais: 
    // <div className="carrossel__wrapper"> => Div que guarda os cards em que o usuário vê, tem overflow:hidden => o conteúdo que passa dos 
    // limites da tela é cortado e fica oculto, sem barras de rolagem. É uma janela visível.
    // <div className="carrossel__track">  => Div que guarda TODOS os cards

    const [offset, setOffset] = useState(0); //  É o quanto a div track já foi empurrada pra esquerda, em pixels
    // Começa em 0, nada foi empurrado. Quando o usuário clica na seta direita, esse número aumenta. Quando clica na esquerda, diminui
    // Considere que CARD_WIDTH = 232;
    // offset = 0  => wrapper na posição inicial
    // offset = 232 => wrapper empurrada 232px pra esquerda (1 card)
    // offset = 464  → wrapper empurrada 464px pra esquerda (2 cards)
    // Esse valor é aplicado direto no CSS: style={{ transform: `translateX(-${offset}px)` }}

    // É o limite em que o wrapper pode ser empurrado, para não passar do último card. Calculado por calMax()
    const [maxOffset, setMaxOffset] = useState(0);

    const wrapperRef = useRef(null); // Ref relacionada à <div className="carrossel__wrapper">

    const CARD_WIDTH = 272; // Largura card + gap (260px + 12px)

    const MAX_VISIBLE = 3; // Numero maximo de cards visiveis

    useEffect(() => {

        // Função responsável por calcular o maxOffset
        const calcMax = () => {

            if (!wrapperRef.current) return; //  Se o wrapper ainda não existir no DOM, sai da função sem fazer nada
            wrapperRef.current.style.width = ''; // Reseta a largura do wrapper para o valor natural antes de medir

            // getComputedStyle => retorna um objeto com todos os valores de CSS aplicados a um elemento
            const styles = getComputedStyle(wrapperRef.current);

            // Soma o padding esquerdo com o direito, tem q tranformar em float, pq getComputedStyle retorna os valores em string
            // Ex: 8px (string) => 8(float)
            const paddingHorizontal = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);

            // clientWidth => largura interna de um elemento em px
            // clientWidth inclui o padding, então subtraímos para ter só o espaço útil disponível para os cards
            const wrapperW = wrapperRef.current.clientWidth - paddingHorizontal;

            // Guarda a largura efetiva em uma variável para usar no cálculo do maxOffset
            // Se tem mais cards do que o limite visível, calcula a largura exata de MAX_VISIBLE cards (MAX_VISIBLE * CARD_WIDTH - 12)
            // Se tem MAX_VISIBLE ou menos cards, usa a largura natural do wrapper (sem restrição)
            const wrapperEfetivo = veiculos.length > MAX_VISIBLE
                ? MAX_VISIBLE * CARD_WIDTH - 12 // -12 remove o gap do último card
                : wrapperW;

            // Aplica a largura calculada diretamente no DOM.
            // Quando há poucos cards, reseta para '' para deixar o CSS decidir (sem largura forçada).
            // Quando há muitos, fixa em wrapperEfetivo — o overflow:hidden cuida de esconder o resto.
            wrapperRef.current.style.width = veiculos.length > MAX_VISIBLE
                ? `${wrapperEfetivo}px`
                : '';

            // Calcula a largura total do track
            const totalCards = veiculos.length;
            const trackW = totalCards * CARD_WIDTH - 12; // -12 remove o gap do último card

            setMaxOffset(Math.max(0, trackW - wrapperEfetivo));
            // setMaxOffset(Math.max(0, trackW - wrapperEfetivo)); // O quanto dá pra empurrar no máximo
            // Explicação detalhada: 
            // Imagina que todos os cards juntos (track) => tem 800px, e a janela visível (wrapper) => tem 500px, a diferença é 
            // de 300px (cards escondidos). Esse 300px é exatamente o máximo que você pode empurrar o track, se empurrar mais, 
            // passaria do último card e ficaria tela em branco.
            // Math.max é uma proteção => Imagina que o track é menor que wrapper (poucos veiculos), a conta daria negativo
            // Ex: trackW = 300px / wrapperW = 500px => 300 - 500 = -200  => não faz sentido
            // Math.max(0, -200) = 0  => corrige pra zero (sem scroll necessário)
        };

        calcMax(); // Calcula o maxOffset ao carregar a página

        // ResizeObserver => é a API do navegador usada para monitorar alterações no tamanho de qualquer elemento HTML 
        // Toda vez que o elemento observado (wrapper, nesse caso) mudar de tamanho, chama a função calcMax()
        const observer = new ResizeObserver(calcMax);

        // Diz ao ResizeObserver para vigiar o elemento wrapper
        if (wrapperRef.current) observer.observe(wrapperRef.current);

        // Desconecta o observer ao desmontar o componente, evitando vazamento de memória. 
        return () => observer.disconnect();

    }, [veiculos.length]); // Roda sempre que a quantidade de cards muda

    // É uma proteção para quando a tela é redimensionada pra um tamanho maior
    useEffect(() => {

        // Exemplo: Usuário rolou até o fim:  offset = 600, maxOffset = 600
        // Usuário aumenta a janela => mais cards cabem na tela
        // maxOffset recalcula: maxOffset = 300  (precisa rolar menos agora)
        // Sem o useEffect:  offset = 600, maxOffset = 300  => tela ficaria em branco (ERRO)
        // Com o useEffect:  offset vira 300 automaticamente
        if (offset > maxOffset) setOffset(maxOffset);

    }, [maxOffset]); // Roda sempre que o maxOffset muda

    // Função responsável pelo scroll, recebe uma direcao como parâmetro
    // Esse parâmetro pode ser 1 (direita) ou -1 (esquerda)
    const scroll = (direcao) => {

        // Atualiza o offset
        // prev é o valor atual do offset antes de mudar , o React passa isso automaticamente quando você usa a forma de função dentro do setState.
        setOffset(prev => {

            // Aq calculamos a próxima posição
            // Exemplo:
            // Situação atual: prev = 232 (já rolou 1 card)
            // Clicou direita (direcao = 1) => next = 232 + (1 * 232) = 464  => rola mais 1 card
            // Clicou esquerda (direcao = -1) => next = 232 + (-1 * 232) = 0   => volta 1 card
            const next = prev + direcao * CARD_WIDTH;

            // Essa é a linha de segurança => impede que o offset saia dos limites. Funciona em duas camadas:
            // Camada 1 => Math.min(next, maxOffset): trava no máximo, next = 900, maxOffset = 600
            // Math.min(900, 600) = 600  => não deixa passar do fim
            // =================================================================================================
            // Camada 2 => Math.max(0, ...): trava no mínimo
            // next = -232 (clicou esquerda no início)
            // Math.max(0, -232) = 0  ← não deixa ir pra negativo
            return Math.max(0, Math.min(next, maxOffset));
        });

    };

    const semVeiculos = veiculos.length === 0;

    if(erroVeiculos){
        return(
            // programar isso
            <div className="carrossel carrossel--vazio">
                <p className="carrossel__erro">Erro ao carregar veículos. Tente recarregar a página.</p>
            </div>
        );
    }

    // Se não há veículos, exibe só o CardAdicionar centralizado.
    if (semVeiculos) {
        return (
            <div className="carrossel carrossel--vazio">
                <CardAdicionar onClick={onAdicionar} />
            </div>
        );
    }

    return (
        <div className="carrossel">

            <div className="carrossel__controles">

                {/* Seta esquerda — invisível quando está no início */}
                <button
                    className="carrossel__seta carrossel__seta--esq"
                    onClick={() => scroll(-1)}
                    aria-label="Ver veículos anteriores"
                    style={{ visibility: offset > 0 ? 'visible' : 'hidden' }}
                >
                    <img className="carrossel__seta-icone" src={Voltar} alt="Anterior" />
                </button>

                {/* Janela visível dos cards */}
                <div className="carrossel__wrapper" ref={wrapperRef}>
                    {/* Track: contém todos os cards e se move via translateX */}
                    <div
                        className="carrossel__track"
                        style={{ transform: `translateX(-${offset}px)` }}
                    >
                        {veiculos.map(v => (
                            <CardVeiculo
                                key={v.id}
                                veiculo={v}
                                onEditar={onEditar}
                                onExcluir={onExcluir}
                            />
                        ))}
                    </div>
                </div>

                {/* Seta direita — invisível quando está no fim */}
                <button
                    className="carrossel__seta carrossel__seta--dir"
                    onClick={() => scroll(1)}
                    aria-label="Ver próximos veículos"
                    style={{ visibility: offset < maxOffset ? 'visible' : 'hidden' }}
                >
                    <img className="carrossel__seta-icone" src={Proximo} alt="Próximo" />
                </button>

            </div>

        </div>
    );

}
