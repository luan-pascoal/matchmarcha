import { Link, useParams } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { SiteNavLinks, SiteHeaderGuestActions, SiteHeaderLoggedActions } from '../../components/layout/SiteHeader';
import { useEffect, useState } from 'react';
import { InfosInstrutor } from './InfosIntrutor/InfosIntrutor.jsx';
import { AcoesInstrutor } from './AcoesInstrutor/AcoesInstrutor.jsx';
import { AlertaSucesso } from '../../components/alertas/AlertaSucesso.jsx';
import axios from 'axios';
import './VerInstrutor.css';

export function VerInstrutor({ usuario, dadosUsuario, carregarUsuario, cidades }) {

  const [instrutor, setInstrutor] = useState(null);
  const [veiculos, setVeiculos] = useState([]);

  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const [alertaSucesso, setAlertaSucesso] = useState(null);
  const [alertaId, setAlertaId] = useState(null);
  const [popupSolicitarAula, setPopupSolicitarAula] = useState(false);

  const { id } = useParams();

  function handleSolicitarAula(mensagem) {
    setPopupSolicitarAula(false);
    setAlertaSucesso(mensagem);
    setAlertaId(Date.now());
  }

  useEffect(() => {

    async function carregarDados() {
      setCarregando(true);
      setErro(null);

      try {

        const respostaInstrutor = await axios.get(`/api/instrutores/${id}`, {
          validateStatus: () => true,
          withCredentials: true
        });

        if (respostaInstrutor.status === 200) {
          setInstrutor(respostaInstrutor.data.instrutor);
        } else {
          const erroApi = respostaInstrutor.data?.Erro;
          const mensagem =
            typeof erroApi === 'string'
              ? erroApi
              : (erroApi && Object.values(erroApi)[0]) || 'Erro ao carregar instrutor.';
          setErro(String(mensagem));
          setInstrutor(null);
          setCarregando(false);
          return;
        }

        const respostaVeiculo = await axios.get(`/api/veiculos/${id}`, {
          validateStatus: () => true,
          withCredentials: true
        });

        if (respostaVeiculo.status === 200) {
          setVeiculos(respostaVeiculo.data.Sucesso.veiculos);
        } else {
          setVeiculos([]);
        }
      } catch {
        setErro('Falha de conexão. Verifique sua internet e tente novamente.');
        setInstrutor(null);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();

  }, [id]);

  // Carregando
  if (carregando) {
    return (
      <AppLayout headerRight={
        usuario?.logado ? <SiteHeaderLoggedActions dadosUsuario={dadosUsuario} carregarUsuario={carregarUsuario} tipoUsuario={usuario.usuario.tipo} /> : <SiteHeaderGuestActions />
      }>
        <div className="instrutor-status instrutor-status--loading" role="status" aria-live="polite">
          <div className="instrutor-status__spinner" aria-hidden="true" />
          <p className="instrutor-status__text">Carregando perfil do instrutor...</p>
        </div>
      </AppLayout>
    );
  }

  // Erro
  if (erro) {
    return (
      <AppLayout headerRight={
        usuario?.logado ? <SiteHeaderLoggedActions dadosUsuario={dadosUsuario} carregarUsuario={carregarUsuario} tipoUsuario={usuario.usuario.tipo} /> : <SiteHeaderGuestActions />
      }>
        <div className="instrutor-status instrutor-status--error" role="alert">
          <span className="instrutor-status__icon" aria-hidden="true">!</span>
          <h1 className="instrutor-status__title">Ops, algo deu errado</h1>
          <p className="instrutor-status__text">{erro}</p>
          <Link className="btn btn--square btn--primary" to="/">
            ← Voltar para a página inicial
          </Link>
        </div>
      </AppLayout>
    );
  }

  // Não encontrado
  if (!instrutor) {
    return (
      <AppLayout headerRight={
        usuario?.logado ? <SiteHeaderLoggedActions dadosUsuario={dadosUsuario} carregarUsuario={carregarUsuario} tipoUsuario={usuario.usuario.tipo} /> : <SiteHeaderGuestActions />
      }>
        <div className="instrutor-status instrutor-status--empty">
          <span className="instrutor-status__icon" aria-hidden="true">?</span>
          <h1 className="instrutor-status__title">Instrutor não encontrado</h1>
          <p className="instrutor-status__text">O perfil que você procura não existe ou foi removido.</p>
          <Link className="btn btn--square btn--primary" to="/">
            ← Voltar para a página inicial
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (

    <AppLayout headerRight={
      usuario?.logado ? <SiteHeaderLoggedActions dadosUsuario={dadosUsuario} carregarUsuario={carregarUsuario} tipoUsuario={usuario.usuario.tipo} /> : <SiteHeaderGuestActions />
    } footerRight={`Perfil de ${instrutor.nome}`}>

      <Link className="instrutor-page__back" to="/#instrutores">
        ← Voltar para instrutores
      </Link>

      <div className="instrutor-page__grid">

        {alertaSucesso && (
          <AlertaSucesso
            key={alertaId}
            mensagem={alertaSucesso}
            onClose={() => setAlertaSucesso(null)}
          />
        )}

        <InfosInstrutor
          instrutor={instrutor}
          veiculos={veiculos}
        />

        <AcoesInstrutor
          usuario={usuario}
          instrutor={instrutor}
          cidades={cidades}
          handleSolicitarAula={handleSolicitarAula}
          setPopupSolicitarAula={setPopupSolicitarAula}
          popupSolicitarAula={popupSolicitarAula}
        />

      </div>
    </AppLayout>
  );
}