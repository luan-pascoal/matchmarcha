import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useForm } from "react-hook-form";
import { AlertaSucesso } from '../../components/alertas/AlertaSucesso';
import { AlertaVeiculo } from '../../components/alertas/AlertaVeiculo';
import { AppLayout } from '../../components/layout/AppLayout';
import { SiteNavLinks, SiteHeaderGuestActions, SiteHeaderLoggedActions } from '../../components/layout/SiteHeader';
import { InstructorCard } from './InstructorCard';
import axios from 'axios';
import './HomePage.css';

const OPCOES_CATEGORIA = [
  { valor: '', rotulo: 'Todas as categorias' },
  { valor: 'A', rotulo: 'Categoria A (moto)' },
  { valor: 'B', rotulo: 'Categoria B (carro)' },
  { valor: 'AB', rotulo: 'Categoria AB (carro e moto)' }
];

const OPCOES_PRECO = [
  { valor: '', rotulo: 'Qualquer preço' },
  { valor: '80', rotulo: 'Até R$ 80/hora' },
  { valor: '100', rotulo: 'Até R$ 100/hora' },
  { valor: '120', rotulo: 'Até R$ 120/hora' },
  { valor: '140', rotulo: 'Até R$ 140/hora' },
  { valor: '141', rotulo: 'Acima de R$ 140/hora' }
];

export function HomePage({ usuario, dadosUsuario, carregarUsuario, cidades }) {

  const [alertaSucesso, setAlertaSucesso] = useState('');
  const [mostrarMsgVeiculo, setMostrarMsgVeiculo] = useState(false);

  const { register, watch, setValue, reset } = useForm({
    defaultValues: {
      busca: '',
      cidadeBusca: '',
      filtroCidade: '',
      filtroCategoria: '',
      filtroPreco: ''
    }
  });

  const busca = watch('busca');
  const cidadeBusca = watch('cidadeBusca');
  const filtroCidade = watch('filtroCidade');
  const filtroCategoria = watch('filtroCategoria');
  const filtroPreco = watch('filtroPreco');

  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtrosAbertos, setFiltrosAbertos] = useState(true);

  const [instrutores, setInstrutores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const msgSucesso = sessionStorage.getItem('msgSucesso');
    const mostrarVeiculo = sessionStorage.getItem('mostrarMsgVeiculo');
    if (msgSucesso) {
      setAlertaSucesso(msgSucesso);
      sessionStorage.removeItem('msgSucesso');
    }
    if (mostrarVeiculo) {
      setMostrarMsgVeiculo(true);
      sessionStorage.removeItem('mostrarMsgVeiculo');
    }
  }, []);

  useEffect(() => {
    if (mostrarMsgVeiculo) {
      document.body.classList.add('modal-aberto');
    } else {
      document.body.classList.remove('modal-aberto');
    }
    // Limpeza ao desmontar o componente
    return () => document.body.classList.remove('modal-aberto');
  }, [mostrarMsgVeiculo]);

  // Toda vez que um filtro é acionado muda o state pagina pra 1
  useEffect(() => {
    setPagina(1);
  }, [busca, filtroCidade, filtroCategoria, filtroPreco]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca);
    }, 200)
    return () => clearTimeout(timer);
  }, [busca]);

  useEffect(() => {

    setCarregando(true);
    setErro(null);

    async function carregarInstrutores() {

      const params = {};
      if (buscaDebounced) params.busca = busca;
      if (filtroCidade) params.local = filtroCidade;
      if (filtroCategoria) params.categoria = filtroCategoria;
      if (filtroPreco) params.precoMax = filtroPreco;

      const resposta = await axios.get(`/api/instrutores/pagina/${pagina}`, {
        params,
        validateStatus: () => true,
        withCredentials: true,
      });

      if (resposta.status === 200) {
        setInstrutores(resposta.data.Sucesso.instrutores);
        setTotal(resposta.data.Sucesso.total);
        setTotalPaginas(resposta.data.Sucesso.totalPaginas);
        setErro(null);
        setCarregando(false);
      }

      if (resposta.status === 422) {
        setErro(resposta.data.Erro);
        setCarregando(false);
      }

    }

    carregarInstrutores();

  }, [buscaDebounced, filtroCidade, filtroCategoria, filtroPreco, pagina]);

  const limparFiltros = () => {
    reset({
      busca: '',
      cidadeBusca: '',
      filtroCidade: '',
      filtroCategoria: '',
      filtroPreco: ''
    });
  };

  const irParaPagina = (novaPagina) => {

    setPagina(novaPagina); // Atualiza o state pagina e recarrega os instrutores

    document.getElementById('instrutores')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Da um scroll automatico até o elemento instrutores

  };

  const normalizar = (texto) =>
    texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const cidadesFiltradas = (cidades ?? []).filter((cidade) =>
    normalizar(cidade.nome).includes(normalizar(cidadeBusca))
  ).slice(0, 10);

  const temFiltroAtivo = busca || filtroCidade || filtroCategoria || filtroPreco;

  return (
    <AppLayout
      headerRight={
        usuario?.logado
          ? <SiteHeaderLoggedActions dadosUsuario={dadosUsuario} carregarUsuario={carregarUsuario} tipoUsuario={usuario?.tipo} />
          : <SiteHeaderGuestActions />
      }
      footerRight="Página Inicial"
    >
      <div className="stack stack--lg">
        {alertaSucesso && (
          <AlertaSucesso mensagem={alertaSucesso} onClose={() => setAlertaSucesso('')} />
        )}
        {mostrarMsgVeiculo && (
          <AlertaVeiculo onClose={() => setMostrarMsgVeiculo(false)} />
        )}

        <section className="home-hero" aria-labelledby="home-titulo">
          <h1 id="home-titulo" className="home-hero__title">
            Encontre instrutores perto de você
          </h1>
          <p className="home-hero__text">
            Compare valores, horários e categorias. Agende suas aulas de direção com
            profissionais autônomos em um só lugar.
          </p>
        </section>

        <section className="home-search" aria-label="Buscar instrutores">
          <div className="home-search__row">
            <div className="home-search__main">
              <div className="home-search__field">
                <label className="label" htmlFor="busca-instrutor">
                  Buscar instrutor
                </label>
                <input
                  id="busca-instrutor"
                  className="input"
                  type="search"
                  placeholder="Digite o nome do instrutor"
                  {...register('busca')}
                />
              </div>

              <button
                type="button"
                className="btn btn--square btn--ghost home-search__toggle"
                onClick={() => setFiltrosAbertos((aberto) => !aberto)}
                aria-expanded={filtrosAbertos}
                aria-controls="painel-filtros"
              >
                {filtrosAbertos ? 'Ocultar filtros' : 'Mostrar filtros'}
              </button>
            </div>

            {filtrosAbertos && (
              <div id="painel-filtros" className="home-search__filters">
                <div className="field">
                  <label className="label" htmlFor="filtro-cidade">Cidade</label>
                  <div className="cidade-autocomplete">
                    <input
                      id="filtro-cidade"
                      className="input"
                      type="text"
                      placeholder="Digite a cidade"
                      autoComplete="off"
                      {...register('cidadeBusca', {
                        onChange: () => {
                          setMostrarSugestoes(true);
                          setValue('filtroCidade', '');
                        }
                      })}
                      onFocus={() => setMostrarSugestoes(true)}
                    />
                    {mostrarSugestoes
                      && cidadeBusca.length > 0
                      && cidadesFiltradas.length > 0 && (
                        <ul className="cidade-autocomplete__list">
                          {cidadesFiltradas.map((cidade) => (
                            <li
                              key={cidade.id}
                              className="cidade-autocomplete__item"
                              onClick={() => {
                                setValue('cidadeBusca', `${cidade.nome} - ${cidade.uf}`);
                                setValue('filtroCidade', cidade.id);
                                setMostrarSugestoes(false);
                              }}
                            >
                              {cidade.nome} - {cidade.uf}
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>
                </div>

                <div className="field">
                  <label className="label" htmlFor="filtro-categoria">Categoria</label>
                  <select
                    id="filtro-categoria"
                    className="input"
                    {...register('filtroCategoria')}
                  >
                    {OPCOES_CATEGORIA.map((op) => (
                      <option key={op.valor || 'todas'} value={op.valor}>{op.rotulo}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="label" htmlFor="filtro-preco">Preço</label>
                  <select
                    id="filtro-preco"
                    className="input"
                    {...register('filtroPreco')}
                  >
                    {OPCOES_PRECO.map((op) => (
                      <option key={op.valor || 'qualquer'} value={op.valor}>{op.rotulo}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {temFiltroAtivo && (
              <div className="home-search__actions">
                <button type="button" className="btn btn--square btn--ghost" onClick={limparFiltros}>
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        </section>

        <section id="instrutores" aria-labelledby="lista-instrutores-titulo">
          <p className="instructors-grid__count">
            {total} {total === 1 ? 'instrutor encontrado' : 'instrutores encontrados'}
          </p>

          <h2 id="lista-instrutores-titulo" className="sr-only">
            Lista de instrutores
          </h2>

          <ul className="instructors-grid">
            {carregando ? (
              <li>Carregando instrutores...</li>
            ) : erro ? (
              <li className="instructors-grid__empty">{erro}</li>
            ) : instrutores.length > 0 ? (
              instrutores.map((instrutor) => (
                <li key={instrutor.instrutor_id}>
                  <InstructorCard instrutor={instrutor} />
                </li>
              ))
            ) : (
              <li className="instructors-grid__empty">
                Nenhum instrutor encontrado com esses filtros. Tente outra busca ou limpe os filtros.
              </li>
            )}
          </ul>

          {!carregando && !erro && totalPaginas > 1 && (
            <nav className="pagination" aria-label="Paginação de instrutores">
              {pagina > 1 && (
                <button
                  type="button"
                  className="pagination__nav pagination__nav--prev"
                  onClick={() => irParaPagina(pagina - 1)}
                >
                  Anterior
                </button>
              )}

              {/*
                Como a paginação ocorre?

                Array.from => cria um novo array
                Tem dois parâmetros : Array.from(objeto, função)

                Array.from({ length: totalPaginas }, (_, i) => i + 1)
                length: totalPaginas  => crie um objeto com esse tamanho (totalPaginas)

                (_, i) => i + 1 => essa função é executada para cada objeto do array
                A função em si tem dois parametros (valor, indice)
                Como o array ainda não possui valores, o primeiro parâmetro não interessa, ent passamos _
                i é o indice (começam em zero)
                i + 1, faz com que os indices que antes eram [0,1,2,3,4], se tornem: [1,2,3,4,5]

                Depois disso percorremos esse array que foi criado por .from e percorremos com .map
                A cada passada num recebe um valor 
              */}

              <ul className="pagination__list">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                  <li key={num}>
                    <button
                      type="button"
                      className={`pagination__item ${num === pagina ? 'pagination__item--active' : ''}`}
                      onClick={() => irParaPagina(num)}
                      aria-current={num === pagina ? 'page' : undefined}
                    >
                      {num}
                    </button>
                  </li>
                ))}
              </ul>

              {pagina < totalPaginas && (
                <button
                  type="button"
                  className="pagination__nav pagination__nav--next"
                  onClick={() => irParaPagina(pagina + 1)}
                >
                  Próximo
                </button>
              )}
            </nav>
          )}
        </section>
      </div>
    </AppLayout>
  );
}