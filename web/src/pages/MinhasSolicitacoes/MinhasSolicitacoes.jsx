import { useState, useEffect } from "react";
import { pusherClient } from "../../services/pusher";
import { AppLayout } from "../../components/layout/AppLayout";
import { SiteHeaderLoggedActions } from '../../components/layout/SiteHeader';
import { Pagetop } from "./PageTop/PageTop";
import { ListaSolicitacoes } from "./ListaSolicitacoes/ListaSolicitacoes";
import { Paginacao } from "./Paginacao/Paginacao";
import axios from 'axios';

export function MinhasSolicitacoes({ usuario, dadosUsuario, carregarUsuario, buscarContatos }) {

    const [carregando, setCarregando] = useState(true);
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [total, setTotal] = useState(0);
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [contagensPorStatus, setContagensPorStatus] = useState({
        pendente: 0, aceita: 0, recusada: 0
    })
    const [confirmacaoPendente, setConfirmacaoPendente] = useState(null);
    const [fotosComErro, setFotosComErro] = useState(() => new Set());

    // Estado do react que começa com um set vazio
    // Um Set é parecido com uma lista, mas não permite valores duplicados
    // Ex: const conjunto = new Set();
    // conjunto.add(10); conjunto.add(20); conjunto.add(10);
    const [acoesEmAndamento, setAcoesEmAndamento] = useState(() => new Set());

    const [filtroStatus, setFiltroStatus] = useState('pendente');

    const [alertaSucesso, setAlertaSucesso] = useState(null);
    const [alertaId, setAlertaId] = useState(null);
    const [alertaErro, setAlertaErro] = useState(null);
    const [alertaErroId, setAlertaErroId] = useState(null);

    const instrutorId = usuario.usuario.instrutor_id;

    useEffect(() => {
        setPagina(1);
    }, [filtroStatus]);

    function handleEdicaoSucesso(mensagem) {
        setAlertaSucesso(mensagem);
        setAlertaId(Date.now());
    }

    function handleErro(mensagem) {
        setAlertaErro(mensagem);
        setAlertaErroId(Date.now());
    }

    const extrairMsgErro = (erro, msgPadrao) => {
        if (!erro || typeof erro !== 'object') return msgPadrao
        const valores = Object.values(erro);
        return valores.length > 0 ? valores[0] : msgPadrao;
    }

    const pedirConfirmacao = (id, tipo) => {
        setConfirmacaoPendente({ id, tipo });
    };

    const cancelarConfirmacao = () => {
        setConfirmacaoPendente(null);
    };

    // Função assíncrona a qual recebe um parâmetro silencioso
    // { silencioso = false } => desestruturação de objeto
    // silencioso = false => se não for informado, ele assume false
    // = {} => se você passar a função sem parâmetro, não dá erro, considera o parâmetro como falso
    /* 
        Mesma coisa de fazer:
        const buscarSolicitacoes = async (opcoes = {}) => {
            const silencioso = opcoes.silencioso ?? false;
        }
    */
    const buscarSolicitacoes = async ({ silencioso = false } = {}) => {

        // Se não for silencioso, liga o carregando e limpa erro anterior
        // Busca "silenciosa" = Pusher em segundo plano, não deve mexer na tela
        if (!silencioso) {
            setCarregando(true);
        }

        const resposta = await axios.get(`/api/solicitacoes/${pagina}`, {
            params: { status: filtroStatus },
            validateStatus: () => true,
            withCredentials: true
        });

        if (resposta.status === 200) {

            const novasSolicitacoes = resposta.data.Sucesso.solicitacoes;

            // setSolicitacoes((prev) => { ... }) => Forma de atualização funcional do setState
            // prev = é o valor anterior/atual antes dessa atualização
            setSolicitacoes((prev) => {

                // acoesEmAndamento tiver 0 items, fazemos direto setSolicitacoes(novasSolicitacoes);
                if (acoesEmAndamento.size === 0) return novasSolicitacoes;

                // Se tiverem ações em andamento , percorremos o array novasSolicitacoes que acabou de chegar do bd
                return novasSolicitacoes.map((item) =>

                    /* 
                    .has => verifica se tem o valor (id da solicitação) dentro do set, retorna true ou false
                    Se tem o valor = o usuário acabou de aceitar/recusar ele e ainda não confirmou com o backend

                    => Se tiver, mantém o item atual(valor local, já atualizado otimisticamente
                    pra "aceita"/"recusada" pela função aceitar/recusar — ainda não confirmado pelo backend)
                    Se tiver, quer dizer que a solicitação existe, mas o POST ainda n terminou de ser processado
                    Deixamos o valor local (aceita/recusada)
                    prev.find( (p) => p.id === item.id ) ?? item => procura no array anterior/atual(prev) um elemento com o mesmo 
                    id. Use o resultado do find() - valor local, mas se ele for null ou undefined, use item => usa o item que 
                    acabou de chegar do bd (caso raro: item em acoesEmAndamento mas que não existe mais em prev)

                    => Se não tiver (não está em acoesEmAndamento), usa o item que chegou do bd

                    */
                    acoesEmAndamento.has(item.id)
                        ? prev.find((p) => p.id === item.id) ?? item
                        : item
                );
            });

            setTotal(resposta.data.Sucesso.total);
            setTotalPaginas(resposta.data.Sucesso.totalPaginas);
            setContagensPorStatus(resposta.data.Sucesso.contagens);

            if (!silencioso) {
                setCarregando(false);
            }

        } else {

            if (!silencioso) {
                const mensagem = extrairMsgErro(resposta.data?.Erro, 'Não foi possível carregar as solicitações.');
                handleErro(mensagem);
                setTotalPaginas(1);
                setCarregando(false);
            }

        }

    };

    // Função responsável pela criação de contatos e da primeira mensagem do contato, cujo autor é o sistema
    const criarContato = async(usuarioId) => {
        return await axios.post('/api/contatos', {
            usuario_id: usuarioId
        }, {
            validateStatus: ()=> true,
            withCredentials: true
        });
    };

    // Busca oficial => troca de filtro ou de página
    useEffect(() => {

        let cancelado = false;
        const buscar = async () => {
            if (cancelado) return;
            await buscarSolicitacoes({ silencioso: false });
        };
        buscar();
        return () => {
            cancelado = true;
        };

    }, [filtroStatus, pagina]);

    // Pusher: escuta o canal privado do instrutor e re-busca quando chega evento novo, pausando/retomando 
    // conforme a aba fica visível/invisível
    useEffect(() => {

        if (!instrutorId) return;

        // Define nome do canal
        const nomeCanal = `private-instrutor${instrutorId}`;
        // Conecta sua aplicação cliente ao Pusher Channels em um canal específico, retorna um objeto de canal
        const canal = pusherClient.subscribe(nomeCanal);

        const aoReceberEvento = () => {
            buscarSolicitacoes({ silencioso: true });
        }

        // Quando acontecer o evento nova-solicitacao, execute aoReceberEvento
        canal.bind('nova-solicitacao', aoReceberEvento);

        const handleVisibility = () => {

            // Verifica se a página está visível na tela para o usuário 
            if (document.visibilityState === 'visible') {
                buscarSolicitacoes({ silencioso: true });
            }

        }
        // Adiciona o evento visibilitychange do navegador
        // Quando a visibilidade do documento mudar, execute handleVisibility
        document.addEventListener('visibilitychange', handleVisibility);

        // Quando desmontar o component
        return (() => {

            // Desliga a escuta de eventos
            canal.unbind('nova-solicitacao', aoReceberEvento);
            // Fecha a conexão com o canal
            pusherClient.unsubscribe(nomeCanal);
            // Remove o event listener
            document.removeEventListener('visibilitychange', handleVisibility);

        })


    }, [instrutorId, filtroStatus, pagina, acoesEmAndamento]);

    const aceitar = async (solicitacaoId, usuarioId) => {

        setConfirmacaoPendente(null);

        // Ex: chamamos aceitar(42); acoesEmAndamento: Set { 10, 25 }
        // prev = estado atual do state => Set { 10, 25 }
        // new Set(prev) => Cria um novo Set copiando o anterior => Set { 10, 25 }
        // .add(id) => Adiciona o ID ao Set => Set { 10, 25, 42 }
        setAcoesEmAndamento((prev) => new Set(prev).add(solicitacaoId));

        // prev = estado atual do state solicitacoes => ultimo array de solicitacoes vindo do bd
        // .map => percorre as solicitacoes do array
        // Compara o id da solicitacao do array que esta sendo percorrido, com o id da solicitacao que está
        // sendo aceita
        // Se os ids baterem, mudamos o status dessa solicitação para aceita
        // Se os ids não baterem (Não é a solicitação que estamos procurando), portanto, mantem a solicitacao do 
        // jeito que veio do bd
        // ...s => spread operator => "abre" o objeto s e copia todas as suas propriedades pra dentro de um objeto novo
        // status: "aceita" => sobrescreve essa propriedade específica com o novo valor.
        setSolicitacoes((prev) => prev.map((s) => (
            s.id === solicitacaoId ? { ...s, status: "aceita" } : s
        )));

        const resposta = await axios.put(`/api/solicitacoes/${solicitacaoId}`, {
            status: "ACEITA"
        }, {
            validateStatus: () => true,
            withCredentials: true
        });

        if (resposta.status === 200) {
            handleEdicaoSucesso('Solicitação aceita com sucesso!');
            await buscarSolicitacoes({ silencioso: true });

            const respostaContato = await criarContato(usuarioId);
            if(respostaContato.status === 200){
                await buscarContatos({ silencioso: true });
            }else{
                const mensagemContato = extrairMsgErro(
                    respostaContato.data?.Erro, 
                    'Solicitação aceita, mas não foi possível abrir a conversa agora. Atualize a página para tentar novamente.'
                );
                handleErro(mensagemContato);
            }

        }

        if (resposta.status === 422) {
            setSolicitacoes((prev) => prev.map((s) => (s.id === solicitacaoId ? { ...s, status: "pendente" } : s)));
            const mensagemSolicitacao = extrairMsgErro(resposta.data?.Erro, 'Não foi possível aceitar a solicitação.');
            handleErro(mensagemSolicitacao);
        }

        // Depois que o post terminou
        setAcoesEmAndamento((prev) => {

            // Faz uma copia do set atual
            const novo = new Set(prev);
            // Tira o id da solicitacao, n esta mais em andamento
            novo.delete(solicitacaoId);
            // Faz setAcoesEmAndamento(novo)
            return novo;

        });

    }

    // Repete o processo so que agora, para recusar solicitacoes
    const recusar = async (id) => {

        setConfirmacaoPendente(null);

        setAcoesEmAndamento((prev) => new Set(prev).add(id));
        setSolicitacoes((prev) => prev.map((s) => (s.id === id ? { ...s, status: "recusada" } : s)));

        const resposta = await axios.put(`/api/solicitacoes/${id}`, {
            status: "RECUSADA"
        },
            {
                validateStatus: () => true,
                withCredentials: true
            });

        if (resposta.status === 200) {
            handleEdicaoSucesso('Solicitação recusada com sucesso!');
            await buscarSolicitacoes({ silencioso: true });
        }

        if (resposta.status === 422) {
            setSolicitacoes((prev) => prev.map((s) => (s.id === id ? { ...s, status: "pendente" } : s)));
            const mensagem = extrairMsgErro(resposta.data?.Erro, 'Não foi possível recusar a solicitação.');
            handleErro(mensagem);
        }

        setAcoesEmAndamento((prev) => {
            const novo = new Set(prev);
            novo.delete(id);
            return novo;
        });
    };

    const marcarFotoComErro = (id) => {
        setFotosComErro((prev) => new Set(prev).add(id));
    };

    return (
        <AppLayout
            headerRight={<SiteHeaderLoggedActions dadosUsuario={dadosUsuario} carregarUsuario={carregarUsuario} tipoUsuario={usuario.usuario.tipo} />}
            footerRight={`Solicitações de ${usuario.usuario.nome}`}
        >
            <div className="stack stack--lg">
                
                <Pagetop
                    contagensPorStatus={contagensPorStatus}
                    total={total}
                    filtroStatus={filtroStatus}
                    setFiltroStatus={setFiltroStatus}
                    setAlertaSucesso={setAlertaSucesso}
                    alertaSucesso={alertaSucesso}
                    alertaId={alertaId}
                    setAlertaErro={setAlertaErro}
                    alertaErro={alertaErro}
                    alertaErroId={alertaErroId}
                />

                <ListaSolicitacoes
                    solicitacoes={solicitacoes}
                    confirmacaoPendente={confirmacaoPendente}
                    pedirConfirmacao={pedirConfirmacao}
                    cancelarConfirmacao={cancelarConfirmacao}
                    aceitar={aceitar}
                    recusar={recusar}
                    fotosComErro={fotosComErro}
                    marcarFotoComErro={marcarFotoComErro}
                    acoesEmAndamento={acoesEmAndamento}
                />

                {!carregando && (
                    <Paginacao
                        pagina={pagina}
                        totalPaginas={totalPaginas}
                        setPagina={setPagina}
                    />
                )}

            </div>
        </AppLayout>
    );
}
