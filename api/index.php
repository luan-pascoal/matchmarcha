<?php
session_start();

require_once __DIR__ . '/../config/init.php';

//header('Access-Control-Allow-Origin: https://matchmarcha.vercel.app');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

date_default_timezone_set("America/Sao_Paulo");


$rota = new Rotas();

/************************************************************
*                    Rotas Públicas                         *     
************************************************************/

// Cadastro de Usuário
$rota->adicionar('POST','/usuarios','UsuarioController::cadastrar', 'nenhuma');
// Login de Usuário 
$rota->adicionar('POST','/login','LoginController::fazerLogin', 'nenhuma');
// Logout de Usuário
$rota->adicionar('DELETE','/logout', 'LogoutController::fazerLogout', 'nenhuma');
// Identificação de Usuário
$rota->adicionar('GET','/eu','EuController::autorizacao', 'nenhuma');
// Exibir Dados de um Usuario Específico
$rota->adicionar('GET','/usuarios/{id}','UsuarioController::listarUnico','nenhuma');
// Retorna Todas Cidades Cadastradas
$rota->adicionar('GET','/cidades','CidadeController::listarTodas','nenhuma');
// Cadastro de Instrutor
$rota->adicionar('POST','/instrutores','InstrutorController::cadastrarInstrutor', 'nenhuma');
// Exibir Dados de um Instrutor Específico
$rota->adicionar('GET','/instrutores/{id}','InstrutorController::listarUnicoInstrutor','nenhuma');
// Retorna Todas Cores Cadastradas
$rota->adicionar('GET','/cores','CorController::listarTodas','nenhuma');
// Retorna todos os instrutores (com filtro ou n)
$rota->adicionar('GET', '/instrutores/pagina/{pagina}', 'InstrutorController::listarTodos', 'nenhuma');
// Exibir veículos de um instrutor
$rota->adicionar('GET', '/veiculos/{id}', 'VeiculoController::listarTodos', 'nenhuma');
// Rota que possibilita o envio de um email para a funcionalidade Esqueci Senha
$rota->adicionar('POST', '/esqueci-senha', 'EsqueciSenhaController::recuperarSenha', 'nenhuma');
// Rota que possibilita a redefinição de senha da funcionalidade Esqueci Senha
$rota->adicionar('POST', '/nova-senha', 'NovaSenhaController::redefinirSenha', 'nenhuma');



/************************************************************
*                    Rotas Privadas                         *     
************************************************************/

// Atualiza Dados do Usuario 
$rota->adicionar('PUT','/usuarios','UsuarioController::editarUsuario','logado');
// Atualiza Foto do Usuario 
$rota->adicionar('POST','/usuarios/foto','UsuarioController::editarFoto','logado');
// Atualiza Senha do Usuario 
$rota->adicionar('PUT','/usuarios/senha','UsuarioController::editarSenha','logado');
// Remove a Conta do Usuario 
$rota->adicionar('DELETE','/usuarios','UsuarioController::removerConta','logado');
// Atualiza Dados Relacionados às Aulas do Instutor
$rota->adicionar('PUT','/instrutores','InstrutorController::editarInstrutor', 'logado');
// Atualiza Descricao e Cidade do Instrutor
$rota->adicionar('PUT','/instrutores/perfil','InstrutorController::editarDescrCidade', 'logado');
// Remove a Conta do Instrutor
$rota->adicionar('DELETE','/instrutores','InstrutorController::removerContaInstrutor','logado');
// Retorna as marcas de veiuclos
$rota->adicionar('GET', '/fipe/marcas/{tipo}', 'FipeController::marcas', 'instrutor');
// Retorna os modelos de veiuclos
$rota->adicionar('GET', '/fipe/modelos/{tipo}/{marca}', 'FipeController::modelos','instrutor');
// Retorna os anos de modelos especificos 
$rota->adicionar('GET', '/fipe/anos/{tipo}/{marca}/{modelo}', 'FipeController::anos', 'instrutor');
// Adicionar um veículo
$rota->adicionar('POST', '/veiculos', 'VeiculoController::cadastrar', 'instrutor');
// Editar veículo
$rota->adicionar('PUT', '/veiculos/{id}', 'VeiculoController::editarVeiculo', 'instrutor');
// Remover veículo
$rota->adicionar('DELETE', '/veiculos/{id}', 'VeiculoController::removerVeiculo', 'instrutor');
// Cria uma solicitacao de contato
$rota->adicionar('POST','/solicitacoes','SolicitacaoController::criarSolicitacao','logado');
// Autentica inscrição em canal privado do Pusher
$rota->adicionar('POST','/pusher/auth','PusherController::autenticar','logado');
// Retorna todas as solicitações de contato
$rota->adicionar('GET','/solicitacoes/{pagina}','SolicitacaoController::listarTodas','logado');
// Aceita/Recusa solicitações de contato
$rota->adicionar('PUT','/solicitacoes/{id}','SolicitacaoController::atualizarStatus','instrutor');
// Criação de Contato
$rota->adicionar('POST','/contatos','ContatoController::criarContato','instrutor');
// Retorna todos os contatos de um usuario
$rota->adicionar('GET','/contatos','ContatoController::listarTodos','logado');
// Retorna todos as mensagens de um determinado contato
$rota->adicionar('GET','/mensagens/{idContato}','MensagemController::listarTodas','logado');
// Responsável por criar mensagens
$rota->adicionar('POST','/mensagens/{idContato}','MensagemController::criarMensagem','logado');
// Responsável por criar mensagens com arquivos
$rota->adicionar('POST','/mensagens/arquivo/{idContato}','MensagemController::criarComArquivo','logado');
// Responsável por editar mensagens 
$rota->adicionar('PUT','/mensagens/{idMsg}','MensagemController::editarMensagem','logado');
// Responsável por remover mensagens para somente para o autor
$rota->adicionar('DELETE','/mensagens/{idMsg}/ocultar','MensagemController::ocultarMensagem','logado');
// Responsável por remover mensagens para os dois participantes do chat
$rota->adicionar('DELETE','/mensagens/{idMsg}','MensagemController::excluirMensagem','logado');

$url = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// remove o prefixo do projeto, que não faz parte da rota
$base = "/MatchMarcha/api";
$url = str_replace($base, '', $url);

// caso alguém acesse /api/index.php/usuarios, limpa o index.php do meio
$url = str_replace('/index.php', '', $url);

// remove barra final: /usuarios/ vira /usuarios
$url = rtrim($url, '/');

// se sobrou vazio (acessou só /api/), define como "/"
// evita string vazia que quebraria o array_search das rotas
if ($url === '') {

    $url = '/';

}

$rota->ir($url);


// $rota->listarRotas();
?>