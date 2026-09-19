import { Routes, Route } from 'react-router-dom';
import { PrivateRoute } from './routes/PrivateRoute';
import { HomePage } from './pages/Home/HomePage';
import { Login } from './pages/Login/Login';
import { CadastroAluno } from './pages/CadastroAluno/CadastroAluno';
import { EditarPerfil } from './pages/EditarPerfil/EditarPerfil';
import { ErrorPage } from './components/error/ErrorPage';
import { EditarSenha } from './pages/EditarPerfil/EditarSenha/EditarSenha';
import { VerInstrutor } from './pages/VerInstrutor/VerInstrutor';
import { CadastroInstrutor } from './pages/CadastroInstrutor/CadastroInstrutor';
import { MeusVeiculos } from './pages/MeusVeiculos/MeusVeiculos';
import { EsqueciSenha } from './pages/EsqueciSenha/EsqueciSenha';
import { NovaSenha } from './pages/NovaSenha/NovaSenha';
import { MinhasSolicitacoes } from './pages/MinhasSolicitacoes/MinhasSolicitacoes';
import { Chat } from './pages/Chat/Chat';
import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {

  window.axios = axios;

  const [usuario, setUsuario] = useState(undefined);
  const [dadosUsuario, setDadosUsuario] = useState(undefined);
  const [cidades, setCidades] = useState([]);
  const [cores, setCores] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [erroVeiculos, setErroVeiculos] = useState(false);
  const [contatos, setContatos] = useState([]);
  const [erroContatos, setErroContatos] = useState('');

  // Busca os dados completos do perfil pelo ID e atualiza o state dadosUsuario
  const buscarDadosUsuario = async (id, tipo) => {
    if (!id) return;
    const api = tipo === 'usuario'
      ? `/api/usuarios/${id}`
      : `/api/instrutores/${id}`;
    const resposta = await axios.get(api, {
      withCredentials: true,
      validateStatus: () => true
    });
    if (resposta.status === 200) {
      const dados = tipo === 'usuario'
        ? resposta.data.usuario
        : resposta.data.instrutor;
      setDadosUsuario(dados);
    }
  };

  // Verifica a sessão ativa (/api/eu), atualiza o state usuario e já carrega o perfil completo via buscarDadosUsuario()
  const carregarUsuario = async () => {
    try {
      const response = await axios.get('/api/eu', {
        withCredentials: true,
        validateStatus: () => true
      });
      const dadosLogin = response.data;
      setUsuario(dadosLogin);
      if (dadosLogin?.logado && dadosLogin?.usuario?.id) {
        const id = dadosLogin.usuario.tipo === 'instrutor'
          ? dadosLogin.usuario.instrutor_id
          : dadosLogin.usuario.id;
        await buscarDadosUsuario(id, dadosLogin.usuario.tipo);
        await carregarVeiculos(dadosLogin.usuario.tipo, dadosLogin.usuario.instrutor_id);
      }
    } catch {
      setUsuario(null);
    }
  };

  const buscarVeiculos = async (id) => {
    try {
      const resposta = await axios.get(`/api/veiculos/${id}`, {
        validateStatus: () => true,
        withCredentials: true,
      });
      if (resposta.status === 200) {
        setVeiculos(resposta.data.Sucesso.veiculos);
        setErroVeiculos(false);
      } else {
        setErroVeiculos(true);
      }
    } catch {
      setErroVeiculos(true);
    }
  };

  const buscarContatos = async ({ silencioso = false } = {}) => {
    const resposta = await axios.get('/api/contatos', {
      validateStatus: () => true,
      withCredentials: true,
    });
    if(resposta.status === 200){
      setContatos(resposta.data.Sucesso.contatos);
      setErroContatos('');
    } else if (!silencioso) {
      setErroContatos('Não foi possível carregar os contatos');
      setContatos([]);
    }
  }

  // Verifica se o usuario logado é um instrutor, se sim já carrega os seus veiculos 
  const carregarVeiculos = async (tipoUsuario, id) => {
    if (tipoUsuario !== 'instrutor') return;
    await buscarVeiculos(id);
  };

  // Atualiza só os dados do perfil sem refazer a verificação de sessão 
  const atualizarUsuario = async () => {
    if (!usuario?.usuario) return;
    const tipo = usuario.usuario.tipo;
    const id = tipo === 'instrutor'
      ? usuario.usuario.instrutor_id
      : usuario.usuario.id;
    if (!id) return;
    await buscarDadosUsuario(id, tipo); // passa os dois argumentos
  };

  const carregarCidades = async () => {
    try {
      const resposta = await axios.get('/api/cidades');
      setCidades(resposta.data.cidades ?? []);
    } catch {
      setCidades([]);
    }
  };

  const carregarCores = async () => {
    try {
      const resposta = await axios.get('/api/cores');
      setCores(resposta.data.cores ?? []);
    } catch {
      setCores([]);
    }
  };

  // Roda uma vez na montagem do componente para inicializar a sessão
  useEffect(() => {
    carregarUsuario();
    carregarCidades();
    carregarCores();
  }, []);

  return (
    <Routes>
      <Route index element={
        <HomePage
          usuario={usuario}
          dadosUsuario={dadosUsuario}
          carregarUsuario={carregarUsuario}
          cidades={cidades}
        />
      }
      />

      <Route path="/cadastro-aluno" element={
        <PrivateRoute usuario={usuario} tipo="visitante">
          <CadastroAluno carregarUsuario={carregarUsuario} />
        </PrivateRoute>
      } />

      <Route path="/login" element={
        <PrivateRoute usuario={usuario} tipo="visitante">
          <Login carregarUsuario={carregarUsuario} />
        </PrivateRoute>
      } />


      <Route path="/cadastro-instrutor" element={
        <PrivateRoute usuario={usuario} tipo="visitante">
          <CadastroInstrutor carregarUsuario={carregarUsuario} cidades={cidades} />
        </PrivateRoute>
      } />


      <Route
        path="/instrutor/:id"
        element={
          <VerInstrutor
            usuario={usuario}
            dadosUsuario={dadosUsuario}
            carregarUsuario={carregarUsuario}
            cidades={cidades}
          />
        }
      />

      <Route
        path="/editar-perfil"
        element={
          <PrivateRoute usuario={usuario} tipo="logado">
            <EditarPerfil
              usuario={usuario}
              dadosUsuario={dadosUsuario}
              atualizarUsuario={atualizarUsuario}
              carregarUsuario={carregarUsuario}
              cidades={cidades}
            />
          </PrivateRoute>
        }
      />
      <Route
        path="/editar-senha"
        element={
          <PrivateRoute usuario={usuario} tipo="logado">
            <EditarSenha usuario={usuario} dadosUsuario={dadosUsuario} carregarUsuario={carregarUsuario} />
          </PrivateRoute>
        }
      />
      <Route
        path="/veiculos"
        element={
          <PrivateRoute usuario={usuario} tipo="instrutor">
            <MeusVeiculos
              usuario={usuario}
              dadosUsuario={dadosUsuario}
              carregarUsuario={carregarUsuario}
              cores={cores}
              veiculos={veiculos}
              recarregarVeiculos={buscarVeiculos}
              erroVeiculos={erroVeiculos}
            />
          </PrivateRoute>
        }
      />

      <Route
        path="/esqueci-senha"
        element={
          <PrivateRoute usuario={usuario} tipo="visitante">
            <EsqueciSenha />
          </PrivateRoute>
        }
      />

      <Route
        path="/nova-senha"
        element={
          <PrivateRoute usuario={usuario} tipo="visitante">
            <NovaSenha />
          </PrivateRoute>
        }
      />

      <Route
        path="/minhas-solicitacoes"
        element={
          <PrivateRoute usuario={usuario} tipo="instrutor">
            <MinhasSolicitacoes
              usuario={usuario}
              dadosUsuario={dadosUsuario}
              carregarUsuario={carregarUsuario}
              buscarContatos={buscarContatos}
            />
          </PrivateRoute>
        }
      />

      <Route
        path="/chat"
        element={
          <PrivateRoute usuario={usuario} tipo="logado">
            <Chat
              usuario={usuario}
              dadosUsuario={dadosUsuario}
              carregarUsuario={carregarUsuario}
              contatos={contatos}
              erroContatos={erroContatos}
              buscarContatos={buscarContatos}
            />
          </PrivateRoute>
        }

      />

      <Route path="/mensagens" element={<ErrorPage tipo="desenvolvimento" />} />
      <Route path="/minhas-aulas" element={<ErrorPage tipo="desenvolvimento" />} />
      <Route path="/ajuda" element={<ErrorPage tipo="desenvolvimento" />} />
      <Route path="/termos" element={<ErrorPage tipo="desenvolvimento" />} />

      <Route path="/esqueci-senha" element={<ErrorPage tipo="desenvolvimento" />} />

      <Route path="*" element={<ErrorPage tipo="404" />} />
    </Routes>
  );
}

export default App;