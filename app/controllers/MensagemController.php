<?php

class MensagemController extends Mensagem {

    private $idContato;
    private $texto;
    private $remetente;
    private $usuarioId;
    private $instrutorId;
    private $msgId;
    private $msgAtual;

    /************************************************************
    *                        MÉTODOS                            *     
    *        Métodos responsáveis pelas requisições HTTP        *
    ************************************************************/

    public function listarTodas($idContato){

        $erros = [];
        $this->idContato = $idContato;
        $this->remetente = $_SESSION['USER']['tipo'] ?? null;

        $erros = $this->validarIdContato($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        $erros = $this->validarContatoPertence($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        $resultado = $this->listarMensagensContato($this->idContato, $this->remetente);

        if($resultado === false){
            http_response_code(422);
            echo json_encode(["Erro" => ["bd" => "Erro ao consultar mensagens"]]);
            return;
        }

        http_response_code(200);
        echo json_encode ([
            "Sucesso" => [
                "mensagens" => $resultado
            ]
        ]);
        return;
    }

    public function criarMensagem($idContato, $data){

        $erros = [];

        $this->idContato = $idContato;
        $this->texto = $data["texto"] ?? null;
        $this->remetente = $_SESSION['USER']['tipo'] ?? null;

        $erros = $this->validarIdContato($erros);
        $erros = $this->validarRemetente($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        $erros = $this->validarContatoPertence($erros);
        $erros = $this->validarTexto($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        $idMensagem = $this->inserirMensagem($this->idContato, $this->texto, $this->remetente);

        if($idMensagem === false){
            http_response_code(422);
            echo json_encode(["Erro" => ["bd" => "Erro interno ao enviar mensagem"]]);
            return;
        }
        
        $mensagem = [
            "Msg_id" => (int)$idMensagem,
            "Msg_texto" => $this->texto,
            "Msg_remetente" => $this->remetente,
            "Msg_datacriacao" => date("Y-m-d H:i:s"),
            "Msg_datadelete" => null
        ];

        http_response_code(200);
        echo json_encode([
            "Sucesso" => [
                "mensagem" => $mensagem
            ]
        ]);

        $idDestinatario = $this->remetente === "usuario"
            ? $this->instrutorId
            : $this->usuarioId;

        $canalDestinatario = $this->remetente === "usuario"
            ? "private-instrutor" . $idDestinatario
            : "private-usuario" . $idDestinatario;

        $pusher = PusherService::getInstance();

        $pusher->trigger(
            "private-contato" . $this->idContato,
            "nova-mensagem", 
            $mensagem
        );

        $pusher->trigger(
            $canalDestinatario,
            "mensagem-recebida",
            [
                "contatoId" => $this->idContato,
                "mensagem" => $mensagem
            ]
        );

        return;
    }

    public function criarComArquivo($idContato, $data){

        $erros = [];

        $this->idContato = $idContato;
        $this->texto = $data["texto"] ?? null;
        $this->anexo = $data["anexo"] ?? null;
        $this->remetente = $_SESSION['USER']['tipo'] ?? null;

        $erros = $this->validarIdContato($erros);
        $erros = $this->validarRemetente($erros);
        $erros = $this->validarAnexo($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        $erros = $this->validarContatoPertence($erros);

        if(!empty($this->texto)){
            $erros = $this->validarTexto($erros);
        } else {
            $this->texto = null;
        }

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        $this->anexoCaminho = $this->salvarAnexo($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        $idMensagem = $this->inserirMensagem(
            $this->idContato,
            $this->texto,
            $this->remetente,
            $this->anexoCaminho,
            $this->anexoTipo
        );

        if($idMensagem === false){
            http_response_code(422);
            echo json_encode(["Erro" => ["bd" => "Erro interno ao enviar mensagem"]]);
            return;
        }

        $mensagem = [
            "Msg_id" => (int)$idMensagem,
            "Msg_texto" => $this->texto,
            "Msg_remetente" => $this->remetente,
            "Msg_anexocaminho" => $this->anexoCaminho,
            "Msg_anexotipo" => $this->anexoTipo,
            "Msg_datacriacao" => date("Y-m-d H:i:s"),
            "Msg_datadelete" => null
        ];

        http_response_code(200);
        echo json_encode([
            "Sucesso" => [
                "mensagem" => $mensagem
            ]
        ]);

        $idDestinatario = $this->remetente === "usuario"
            ? $this->instrutorId
            : $this->usuarioId;

        $canalDestinatario = $this->remetente === "usuario"
            ? "private-instrutor" . $idDestinatario
            : "private-usuario" . $idDestinatario;

        $pusher = PusherService::getInstance();

        $pusher->trigger(
            "private-contato" . $this->idContato,
            "nova-mensagem",
            $mensagem
        );

        $pusher->trigger(
            $canalDestinatario,
            "mensagem-recebida",
            [
                "contatoId" => $this->idContato,
                "mensagem" => $mensagem
            ]
        );

        return;
    }


    public function editarMensagem($idMsg, $data){

        $erros = [];

        $this->msgId = $idMsg;
        $this->texto = $data["texto"] ?? null;
        $this->remetente = $_SESSION['USER']['tipo'] ?? null;

        $erros = $this->validarIdMsg($erros);
        $erros = $this->validarRemetente($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        $erros = $this->validarMensagemEditavel($erros);
        $erros = $this->validarTexto($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;            
        }

        $resultado = $this->atualizarMensagem($this->msgId, $this->texto);

        if($resultado === false){
            http_response_code(422);
            echo json_encode(["Erro" => ["bd" => "Erro interno ao editar mensagem"]]);
            return;
        }

        $mensagem = [
            "Msg_id" => (int) $this->msgId,
            "Msg_texto" => $this->texto,
            "Msg_contatoid" => (int) $this->msgAtual->Msg_contatoid
        ];


        $pusher = PusherService::getInstance();

        $pusher->trigger(
            "private-contato" . $this->msgAtual->Msg_contatoid,
            "mensagem-editada",
            $mensagem
        );
        
        http_response_code(200);
        echo json_encode([
            "Sucesso" => [
                "mensagem" => $mensagem
            ]
        ]);
        return;

    }

    public function ocultarMensagem($idMsg){

        $erros = [];
        $this->msgId = $idMsg;
        $this->remetente = $_SESSION['USER']['tipo'] ?? null;
        $idUsuario = $_SESSION['USER']['id'] ?? null;
        $idInstrutor = $_SESSION['USER']['instrutor_id'] ?? null;

        $erros = $this->validarIdMsg($erros);
        $erros = $this->validarRemetente($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }        

        $resultado = $this->acharMsgPorId($this->msgId);

        if($resultado === false || empty($resultado)){
            http_response_code(422);
            echo json_encode(["Erro" => ["bd" => "Mensagem inválida"]]);
            return;
        }

        $mensagem = $resultado[0];

        if($mensagem->Msg_datadelete !== null){
            http_response_code(422);
            echo json_encode(["Erro" => ["idMensagem" => "Mensagem não encontrada"]]);
            return;
        }

        $contato = new Contato();
        $resultado = $contato->acharContatoDoUsuario($mensagem->Msg_contatoid, $idUsuario, $idInstrutor);

        if($resultado === false || empty($resultado)){
            http_response_code(422);
            echo json_encode(["Erro" => ["bd" => "Não foi possível remover essa mensagem"]]);
            return;
        }  

        $jaOculta = $this->remetente === 'usuario'
            ? $mensagem->Msg_ocultoUsuario
            : $mensagem->Msg_ocultoInstrutor;

        if($jaOculta !== null){
            http_response_code(422);
            echo json_encode(["Erro" => ["idMensagem" => "Mensagem já foi removida"]]);
            return;
        }

        $resultado = $this->ocultarMsg($this->msgId, $this->remetente);

        if($resultado === false){
            http_response_code(422);
            echo json_encode(["Erro" => ["bd" => "Erro interno ao remover mensagem"]]);
            return;
        }

        http_response_code(200);
        echo json_encode([
            "Sucesso" => [
                "idMsg" => (int) $this->msgId
            ]
        ]);

        return;

    }

    public function excluirMensagem($idMsg){

        $erros = [];
        $this->msgId = $idMsg;
        $this->remetente = $_SESSION['USER']['tipo'] ?? null;

        $erros = $this->validarIdMsg($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        $erros = $this->validarMensagemEditavel($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        $resultado = $this->removerMsg($this->msgId);

        if($resultado === false){
            http_response_code(422);
            echo json_encode(["Erro" => ["bd" => "Erro interno ao remover mensagem"]]);
            return;            
        }

        $pusher = PusherService::getInstance();

        $pusher -> trigger (
            "private-contato" . $this->msgAtual->Msg_contatoid,
            "mensagem-removida",
            [
                "Msg_id" => (int) $this->msgId
            ]
        );
        
        http_response_code(200);
        echo json_encode([
            "Sucesso" => [
                "idMsg" => (int) $this->msgId
            ]
        ]);

        return;
    }

    /************************************************************
    *                        Validações                         *     
    *         Regras de validação dos dados do veículo          *
    ************************************************************/

    private function validarIdContato($erros){

        $idContato = filter_var($this->idContato, FILTER_VALIDATE_INT);

        if($idContato === false){
            $erros["idContato"] = "Contato Inválido";
            return $erros;
        }

        $this->idContato = $idContato;
        return $erros;
    }

    private function validarContatoPertence($erros){

        $idUsuario = $_SESSION['USER']['id'] ?? null;
        $idInstrutor = $_SESSION['USER']['instrutor_id'] ?? null;

        $contato = new Contato();
        $resultado = $contato->acharContatoDoUsuario($this->idContato, $idUsuario, $idInstrutor);

        if($resultado === false || empty($resultado)){
            $erros["idContato"] = "Contato não encontrado";
            return $erros;
        }

        $this->usuarioId = $resultado[0]->Ctt_usuarioid;
        $this->instrutorId = $resultado[0]->Ctt_instrutorid;

        return $erros;
    }

    private function validarRemetente($erros){

        $tiposPermitidos = ["usuario", "instrutor"];

        if(empty($this->remetente) || !in_array($this->remetente, $tiposPermitidos)){
            $erros["remetente"] = "Sessão inválida";
            return $erros;
        }

        return $erros;
    }

    private function validarTexto($erros){

        if(empty($this->texto) || trim($this->texto) === ""){
            $erros["texto"] = "A mensagem não pode estar vazia";
            return $erros;
        }

        if(mb_strlen($this->texto) > 1024){
            $erros["texto"] = "A mensagem não pode ter mais de 1024 caracteres";
            return $erros;
        }

        $this->texto = trim($this->texto);
        return $erros;
    }

    private function validarIdMsg($erros){

        $idMensagem = filter_var($this->msgId, FILTER_VALIDATE_INT);

        if($idMensagem === false){
            $erros["idMensagem"] = "Mensagem inválida";
            return $erros;
        }

        $this->msgId = $idMensagem;
        return $erros;
    }

    private function validarMensagemEditavel($erros){

        $resultado = $this->acharMsgPorId($this->msgId);

        if($resultado === false || empty($resultado)){
            $erros["idMensagem"] = "Mensagem não encontrada";
            return $erros;
        }

        $mensagem = $resultado[0];

        if($mensagem->Msg_datadelete !== null){
            $erros["idMensagem"] = "Mensagem não encontrada";
            return $erros;
        }

        if($mensagem->Msg_remetente === "sistema"){
            $erros["idMensagem"] = "Essa mensagem não pode ser editada";
            return $erros;
        }

        if($mensagem->Msg_remetente !== $this->remetente){
            $erros["idMensagem"] = "Você não tem permissão para editar esta mensagem";
            return $erros;            
        }

        // strtotime() => converte uma string de data para timestamp
        $minutosPassados = (strtotime('now') - strtotime($mensagem->Msg_datacriacao)) / 60;

        if($minutosPassados > 30){
            $erros["prazo"] = "O prazo para editar esta mensagem expirou";
            return $erros;
        }

        $this->msgAtual = $mensagem;
        return $erros;
    }

    private function validarAnexo($erros){

        $tiposImagem = ["image/png", "image/jpeg", "image/webp", "image/gif"];

        $tiposDocumento = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain"
        ];

        if(!isset($this->anexo['tmp_name']) || empty($this->anexo['tmp_name'])){
            $erros["anexo"] = "Nenhum arquivo enviado";
            return $erros;
        }

        $ehImagem = in_array($this->anexo["type"], $tiposImagem);
        $ehDocumento = in_array($this->anexo["type"], $tiposDocumento);

        if(!$ehImagem && !$ehDocumento){
            $erros["anexo"] = "Tipo de arquivo não permitido";
            return $erros;
        }

        if($ehImagem && $this->anexo["size"] > 2 * 1024 * 1024){
            $erros["anexo"] = "Arquivo muito grande (máx 2 MB)";
            return $erros;
        }

        if($ehDocumento && $this->anexo["size"] > 10 * 1024 * 1024){
            $erros["anexo"] = "Arquivo muito grande (máx 10 MB)";
            return $erros;
        }

        $this->anexoTipo = $ehImagem ? "imagem" : "documento";

        return $erros;
    }

    private function salvarAnexo($erros){

        $nomeArquivo = uniqid() . '_' . basename($this->anexo["name"]);

        $caminho = __DIR__ . '/../../uploads/chat/' . $nomeArquivo;

        if(!move_uploaded_file($this->anexo['tmp_name'], $caminho)){
            $erros["anexo"] = "Erro ao salvar o arquivo";
            return null;
        }

        return $nomeArquivo;
    }
}
?>