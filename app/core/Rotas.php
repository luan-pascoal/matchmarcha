<?php

class Rotas {

    private $listaRotas = []; 
    private $listaChamadas = []; 
    private $listaRestricaoTipo = []; 

    private $listaControllers = [
        "UsuarioController",
        "InstrutorController",
        "LoginController",
        "EuController",
        "LogoutController",
        "CidadeController",
        "CorController",
        "FipeController",
        "VeiculoController",
        "NovaSenhaController",
        "EsqueciSenhaController",
        "SolicitacaoController",
        "PusherController",
        "ContatoController",
        "MensagemController"
    ]; 

    public function adicionar($metodo, $rota, $chamada, $restricaoTipo)
    {
        $this->listaRotas[] = strtoupper($metodo) . ":" . $rota;

        $this->listaChamadas[] = $chamada;

        $this->listaRestricaoTipo[] = $restricaoTipo;
    }

    public function ir($rota)
    {
        $metodoHttp = strtoupper($_SERVER['REQUEST_METHOD']);

        $body = $this->pegarBody();

        $param = null;

        $rotaTest = $metodoHttp . ":" . $rota;

        // Se a requisição for uma rota fixa, como /usuarios/foto, ja mata aq
        $indice = array_search($rotaTest, $this->listaRotas);

        if ($indice === false) {

            // Percorre todas as rotas registradas
            foreach ($this->listaRotas as $i => $rotaDefinida) {
                
                // Ex de rotas definidas: GET /api/usuarios/{id}
                // Ex de requisição: GET /api/usuarios/{23}

                // Separa "GET:/usuarios/{id}"
                // Em "GET" e "/usuarios/{id}"
                $partes = explode(":", $rotaDefinida);

                // Método HTTP da rota cadastrada
                $metodo = $partes[0];

                // Path da rota cadastrada
                $path = $partes[1];

                // Ignora rotas de outro método (POST não entra em GET)
                if ($metodo !== $metodoHttp) {
                    continue;
                }

                // Verifica se a rota tem parâmetro tipo {id}
                if (str_contains($path, '{')) {

                    // $path está : /usuarios/{id}/
                    // trim - tira as barras do inicio e do fim, ficando só usuarios/{id}
                    // Quebra rota cadastrada em partes (/usuarios/{id})
                    $rotaParts = explode("/", trim($path, "/"));

                    // Quebra URL real (/usuarios/10) - repete o processo feito acima - dessa vez para URL da solicitação
                    $urlParts = explode("/", trim($rota, "/"));

                    // Se tamanho for diferente, não pode ser essa rota
                    if (count($rotaParts) !== count($urlParts)) {
                        continue;
                    }

                    // Assume que bate até provar contrário
                    $match = true;

                    $params = [];

                    // Percorre cada parte da URL
                    for ($j = 0; $j < count($rotaParts); $j++) {

                        $parteRota = $rotaParts[$j]; // Parte da rota cadastrada
                        $parteUrl = $urlParts[$j];   // Parte da URL real

                        /* Continuando naquele exemplo ...
                        Primeira passada:
                        $parteRota = "usuarios";
                        $parteUrl  = "usuarios";
                        "usuarios" === "usuarios" e a parteRota n tem {}
                        Vai pra próxima passada

                        Segunda passada:
                        $parteRota = "{id}";
                        $parteUrl  = "42";
                        Diferente, e a parteRota tem {}
                        Entra em if (str_starts_with($parteRota, '{') && str_ends_with($parteRota, '}')) {}
                        */

                        // Se a $parteRota começar e terminar com "{}", significada que oq esta dentro é o param
                        if (str_starts_with($parteRota, '{') && str_ends_with($parteRota, '}')) {

                            // Salva valor da URL como parâmetro
                            // $params = ["42"];
                            $params[] = $parteUrl;
                        }

                        // Se for parte fixa e não bater, ex: GET usuarios/foto
                        else if ($parteRota !== $parteUrl) {

                            // Marca como não compatível
                            $match = false;

                            // Sai do loop
                            break;
                        }
                    }

                    // Se tudo bateu
                    if ($match) {

                        // Salva índice da rota encontrada
                        $indice = $i;

                        // Pega primeiro parâmetro (ex: id)
                        $param = !empty($params) ? $params : null;

                        // sai do foreach
                        break;
                    }
                }
            }
        }

        // Se não encontrou nenhuma rota
        if ($indice === false) {
            $this->naoExiste();
        }

        $chamada = explode("::", $this->listaChamadas[$indice]);

        $classe = $chamada[0];

        $metodo = $chamada[1];

        $restricaoTipo = $this->listaRestricaoTipo[$indice];


        if (!class_exists($classe) || !method_exists($classe, $metodo)) {
            $this->naoExiste();
        }

        if (!in_array($classe, $this->listaControllers)) {
            http_response_code(403);
            echo json_encode(["erro" => "Controller não permitido"]);
            exit;
        }

        if (!Auth::autorizacao($restricaoTipo)) {
            http_response_code(403);
            echo json_encode(["erro" => "Acesso Negado"]);
            exit;
        }

        $instancia = new $classe;

        $args = [];

        if ($param !== null) {
            if (is_array($param)) {
                foreach ($param as $p) {
                    $args[] = $p;
                }
                } else {
                    $args[] = $param;
                }
        }

        if (!empty($body)) {
            $args[] = $body;
        }

        return call_user_func_array([$instancia, $metodo], $args);
    }

    public function pegarBody()
    {

        $contentType = $_SERVER["CONTENT_TYPE"] ?? '';

        // Se for JSON
        if (strpos($contentType, "application/json") !== false) {

            // transforma JSON em array PHP
            return json_decode(file_get_contents("php://input"), true);
        }

        $data = $_POST;

        // Se tiver upload de arquivo
        if (!empty($_FILES)) {
            foreach ($_FILES as $campo => $arquivo) {
                $data[$campo] = $arquivo;
            }
        }

        return $data;
    }

    public function naoExiste()
    {

        http_response_code(404);

        echo json_encode([
            "erro" => "Rota não Encontrada"
        ]);

        exit;
    }

    public function listarRotas()
    {
        echo "<pre>";

        print_r($this->listaRotas);

        print_r($this->listaChamadas);

        print_r($this->listaRestricaoTipo);

        echo "</pre>";
    }
}
?>
