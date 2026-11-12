<?php

class FeriadoController {

    private $brasilapi_base = 'https://brasilapi.com.br/api/feriados/v1';

    private function brasilapi_get(string $caminho){

        $url = $this->brasilapi_base . $caminho;

        $opcoes = [
            "http" => [
                "method" => "GET",
                "timeout" => 10,
                "header" => implode("\r\n", [
                    'Accept: application/json',
                ]),
            ]
        ];

        // stream_context_create => contexto da requisição
        $resposta = file_get_contents($url, false, stream_context_create($opcoes));

        if($resposta === false){
            http_response_code(502);
            echo json_encode(["Erro" => ["bd" => "Erro interno ao exibir os feriados. Tente novamente."]]);
            exit;
        }

        echo $resposta;
        exit;
    }

    private function validarAno(string $ano){

        // Precisa ter 4 dígitos e estar no intervalo que a BrasilAPI atende
        if(!preg_match('/^\d{4}$/', $ano) || (int) $ano < 1900 || (int) $ano > 2199){
            http_response_code(400);
            echo json_encode(["Erro" => ["ano" => "Ano inválido."]]);
            exit;
        }

    }

    public function listarTodos(string $ano){
        $this->validarAno($ano);
        $this->brasilapi_get("/$ano");
    }
}


?>