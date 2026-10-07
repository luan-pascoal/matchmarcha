<?php

class FipeController {

    private $fipe_base = 'https://fipe.parallelum.com.br/api/v2';
    private $tiposPermitidos = [
        'cars', 
        'motorcycles'
    ];
    
    private function fipe_get(string $caminho){

        $url = $this->fipe_base . $caminho;

    
        $opcoes = [
            "http" => [
                "method" => "GET",
                "timeout" => 10,
                "header" => implode("\r\n", [
                    'Accept: application/json',
                    'X-Subscription-Token: ' . $_ENV['FIPE_TOKEN'],
                ]),
            ]
        ];

        // stream_context_create => contexto da requisição
        $resposta = file_get_contents($url, false, stream_context_create($opcoes));

        if($resposta === false){
            http_response_code(502);
            echo json_encode(["Erro" => ["bd" => "Erro interno ao exibir os veiculos. Tente novamente."]]);
            exit;
        }

        echo $resposta;
        exit;
    }

    private function validarTipo(string $tipo){

        if(!in_array($tipo, $this->tiposPermitidos, true)){
            http_response_code(400);
            echo json_encode(["Erro" => ["veiculo" => "Tipo de veículo inválido."]]);
            exit;
        }

    }

    public function marcas(string $tipo){
        $this->validarTipo($tipo);
        $this->fipe_get("/$tipo/brands");
    }

    public function modelos(string $tipo, string $marca){
        $this->validarTipo($tipo);
        $this->fipe_get("/$tipo/brands/$marca/models");
    }   

    public function anos(string $tipo, string $marca, string $modelo){
        $this->validarTipo($tipo);
        $this->fipe_get("/$tipo/brands/$marca/models/$modelo/years");
    }
}


?>