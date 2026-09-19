<?php

class ContatoController extends Contato{

    private $idUsuario;
    private $idInstrutor;

    /************************************************************
    *                        MÉTODOS                            *     
    *        Métodos responsáveis pelas requisições HTTP        *
    ************************************************************/

    public function criarContato($data){

        $erros = [];
        $session = new Session();

        $this->idUsuario = $data["usuario_id"] ?? null;
        $this->idInstrutor = $_SESSION['USER']['instrutor_id'] ?? null;

        $erros = $this->validarInstrutorLogado($erros);
        $erros = $this->validaridUsuario($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        $erros = $this->validarSolicitacaoAceita($erros);
        $erros = $this->validarContatoDuplicado($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }      
        
        $msgSistema = 
        "Olá! Sua solicitação foi aceita. A partir de agora vocês podem conversar por aqui para combinar dias, 
        horários e detalhes das aulas.
        ";

        $contatoId = $this->inserirContato(
            $this->idUsuario,
            $this->idInstrutor,
        );

        if($contatoId === false){
            http_response_code(422);
            echo json_encode(["Erro" => ["bd" => "Erro interno ao criar o contato"]]);
            return;
        }

        $mensagem = $this->criarPrimeiraMsg(
            $contatoId,
            $msgSistema
        );

        if($mensagem === false){
            http_response_code(422);
            echo json_encode(["Erro" => ["bd" => "Erro interno ao criar o contato"]]);
            return;            
        }

        $pusher = PusherService::getInstance();
        $pusher->trigger(
            'private-usuario' . $this->idUsuario,
            'novo-contato',
            [
                'contatoId' => $contatoId,
            ]
        );

        http_response_code(200);
        echo json_encode([
            "Sucesso" => true,
            "Mensagem" => "Contato criado com sucesso",
            "contatoId" => $contatoId
        ]);
        return;

    }

    public function listarTodos(){

        $tipo = $_SESSION['USER']['tipo'] ?? null;

        if($tipo === 'usuario'){
            $idUsuario = $_SESSION['USER']['id'] ?? null;
            $resultado = $this->listarContatosUsuario($idUsuario);
        }elseif($tipo === 'instrutor'){
            $idInstrutor = $_SESSION['USER']['instrutor_id'] ?? null;
            $resultado = $this->listarContatosInstrutor($idInstrutor);
        }else{
            http_response_code(422);
            echo json_encode(["Erro" => ["tipo" => "Usuário inválido"]]);
            return;
        }

        if($resultado === false){
            http_response_code(422);
            echo json_encode(["Erro" => ["bd" => "Erro ao consultar contatos"]]);
            return;
        }

        http_response_code(200);
        echo json_encode([
            "Sucesso" => [
                "contatos" => $resultado
            ]
        ]);
        return;
    }

    /************************************************************
    *                        Validações                         *     
    *         Regras de validação dos dados do veículo          *
    ************************************************************/

    private function validarInstrutorLogado($erros){

        if(empty($this->idInstrutor)){
            $erros["instrutorId"] = "Apenas instrutores podem criar contatos";
        }

        return $erros;
    }

    private function validaridUsuario($erros){

        if(empty($this->idUsuario)){
            $erros["idUsuario"] = "Usuário inválido";
            return $erros;
        }

        $idUsuario = filter_var($this->idUsuario, FILTER_VALIDATE_INT);

        if($idUsuario === false){
            $erros["idUsuario"] = "Usuário inválido";
            return $erros;
        }

        $resultado = $this->acharUsuario($idUsuario);

        if($resultado === false || empty($resultado)){
            $erros["idUsuario"] = "Usuário inválido";
            return $erros;            
        }

        $this->idUsuario = $idUsuario;
        return $erros;

    }

    private function validarSolicitacaoAceita($erros){

        $resultado = $this->acharSolicitacaoAceita($this->idUsuario, $this->idInstrutor);

        if($resultado === false || empty($resultado)){
            $erros["solicitacao"] = "Não existe uma solicitação aceita entre você e este usuário";
        }

        return $erros;

    }

    private function validarContatoDuplicado($erros){

        $resultado = $this->acharContatoDuplicado($this->idUsuario, $this->idInstrutor);

        if($resultado !== false && !empty($resultado)){
            $erros["contato"] = "Você já possui uma conversa ativa com este usuário";
        }

        return $erros;
    }
}

?>