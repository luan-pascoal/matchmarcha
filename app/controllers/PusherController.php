<?php

class PusherController{

    public function autenticar($data){

        $session = new Session();
        $usuario = $session->get('USER');

        if(empty($usuario) || empty($usuario['LOGGED_IN'])){
            http_response_code(422);
            echo json_encode(["Erro" => "Usuário não autenticado"]);
            return;
        }

        // channel_name e socket_id são informações enviadas por pusher-js no frontend
        $canal = $data["channel_name"] ?? null; // nome do canal que ele quer entrar (ex: private-instrutor-42)
        $socketId = $data["socket_id"] ?? null; // identifica a conexão WebSocket específica daquele navegador

        if(empty($canal) || empty($socketId)){
            http_response_code(422);
            echo json_encode(["Erro" => "Dados de autenticação do canal ausentes."]);
            return;
        }

        $autorizado = $this->verificarPermissao($canal, $usuario);

        if(!$autorizado){
            http_response_code(422);
            echo json_encode(["Erro" => "Você não tem permissão para acessar este canal."]);
            return;           
        }

        // authorizeChannel => método da biblioteca pusher-php-server
        // Gera uma assinatura criptográfica (usando o secret que está no env), e retorna 
        // uma string JSON assinada que o cliente usa para confirmar a entrada no canal restrito
        $pusher = PusherService::getInstance();
        $auth = $pusher->authorizeChannel($canal, $socketId);

        http_response_code(200);
        // Devolve isso como uma como uma string JSON pronta, por isso n usamos json_encode
        echo $auth;
    }

    private function verificarPermissao($canal, $usuario){

        // Canal das solicitações de aulas dos instrutores
        if(preg_match('/^private-instrutor(\d+)$/', $canal, $matches)){

            // Verifica se o usuario é um instrutor e verifica se 
            // $matches[0] => texto que correspondeu à expressão inteira => private-instrutor42
            // $matches[1] => texto que correspondeu à primeira sub-expressão entre parênteses capturada => 42
            // Só retorna true se for instrutor e o id do instrutor bater com o id do channel
           return $usuario['tipo'] === 'instrutor' && (int)$usuario['instrutor_id'] === (int) $matches[1];
        }

        // Canal que recebe os novos contatos dos usuários
        if(preg_match('/^private-usuario(\d+)$/', $canal, $matches)){

            return $usuario['tipo'] === 'usuario' && (int)$usuario['id'] === (int) $matches[1];

        }

        // Canal dos chats - divididos por contato
        if(preg_match('/^private-contato(\d+)$/', $canal, $matches)){

            $idContato = (int) $matches[1];
            $idUsuario = $usuario["tipo"] === "usuario" ? $usuario["id"] : null;
            $idInstrutor = $usuario["tipo"] === "instrutor" ? $usuario["instrutor_id"] : null;

            $contato = new Contato();
            $resultado = $contato->acharContatoDoUsuario($idContato, $idUsuario, $idInstrutor);

            return $resultado !== false && !empty($resultado);

        }

        return false;

    }
}

?>