<?php

class Contato{

    protected function acharUsuario($idUsuario){

        return DataBase::table('tb_usuario')->select()->where("Usu_id = :idUsuario", ["idUsuario" => $idUsuario]);

    }

    protected function acharSolicitacaoAceita($idUsuario, $idInstrutor){

        return DataBase::table('tb_solicitacaoaula')->select()->where(
            "Slc_usuarioid = :idUsuario AND Slc_instrutorid = :idInstrutor AND Slc_status = :status",
            [
                "idUsuario" => $idUsuario,
                "idInstrutor" => $idInstrutor,
                "status" => "ACEITA",
            ]
        );

    }

    protected function acharContatoDuplicado($idUsuario, $idInstrutor){
    
        return DataBase::table('tb_contato')->select()->where(
            "Ctt_usuarioid = :idUsuario AND Ctt_instrutorid = :idInstrutor AND Ctt_datadelete IS NULL",
            [
                "idUsuario" => $idUsuario,
                "idInstrutor" => $idInstrutor
            ]
        );

    }

    protected function inserirContato($idUsuario, $idInstrutor){

        $arr = [
            "Ctt_usuarioid" => $idUsuario,
            "Ctt_instrutorid" => $idInstrutor
        ];

        return DataBase::table('tb_contato')->insert($arr);

    }

    protected function criarPrimeiraMsg($idContato, $msgSistema){

        $arr = [
            "Msg_texto" => $msgSistema, 
            "Msg_remetente" => "sistema", 
            "Msg_contatoid" => $idContato
        ];

        return DataBase::table('tb_mensagem')->insert($arr);

    }

    /*
    
        ROW_NUMBER() => coloca um número em cada uma das linhas, ROW_NUMBER() sozinho não sabe 
        em que ordem colocar os números, para isso, temos OVER()
        OVER() => é a regra usada para numerar essas linhas, são elas:
        PARTITION BY Msg_contatoid => separa as mensagens por contato
        ORDER BY Msg_datadescricao DESC => dentro de cada contato, coloque as msgs da mais nova para a antiga

        Exemplo - PARTITION BY Msg_contatoid:
        CONTATO 10:                  CONTATO 20:
        Oi             10:00         Olá            09:00
        Tudo bem?      10:05         Tudo certo     09:30
        Sim            10:10

        ORDER BY Msg_datacriacao DESC:
        CONTATO 10:                   CONTATO 20:
        Sim            10:10          Tudo certo     09:30
        Tudo bem?      10:05          Olá            09:00
        Oi             10:00

        ROW_NUMBER():
        CONTATO 10:                   CONTATO 20:
        Sim            10:10    → 1   Tudo certo     09:30    → 1
        Tudo bem?      10:05    → 2   Olá            09:00    → 2
        Oi             10:00    → 3

        WHERE rn = 1 => pega só a primeira mensagem

    */

    // Descobre quais instrutores, este usuario tem contato
    protected function listarContatosUsuario($idUsuario){

        return DataBase::table('tb_contato')->raw("
            SELECT c.Ctt_id, c.Ctt_usuarioid, c.Ctt_instrutorid,
                u.Usu_id AS outro_id, u.Usu_nome AS outro_nome, u.Usu_foto AS outro_foto,
                    m.Msg_texto, m.Msg_remetente, m.Msg_anexocaminho, m.Msg_anexotipo, m.Msg_datacriacao
            FROM tb_contato c
                JOIN tb_instrutor i ON i.Ins_id = c.Ctt_instrutorid
                    JOIN tb_usuario u ON u.Usu_id = i.Ins_usuarioid
                        JOIN (
                            SELECT Msg_contatoid, Msg_texto, Msg_remetente, Msg_anexocaminho, Msg_anexotipo, Msg_datacriacao,
                                ROW_NUMBER() OVER (
                                    PARTITION BY Msg_contatoid
                                    ORDER BY Msg_datacriacao DESC
                                ) AS rn
                                    FROM tb_mensagem
                                        WHERE Msg_datadelete IS NULL
                                        AND Msg_ocultousuario IS NULL
                        ) m ON m.Msg_contatoid = c.Ctt_id AND m.rn = 1
            WHERE c.Ctt_datadelete IS NULL
            AND c.Ctt_usuarioid = :idUsuario
            ORDER BY m.Msg_datacriacao DESC
        ",[
            "idUsuario" => $idUsuario
        ]);
    }

    // Descobre quais alunos, este instrutor tem contato
    protected function listarContatosInstrutor($idInstrutor){

        return DataBase::table('tb_contato')->raw("
            SELECT c.Ctt_id, c.Ctt_usuarioid, c.Ctt_instrutorid,
                u.Usu_id AS outro_id, u.Usu_nome AS outro_nome, u.Usu_foto AS outro_foto,
                    m.Msg_texto, m.Msg_remetente, m.Msg_anexocaminho, m.Msg_anexotipo, m.Msg_datacriacao
                FROM tb_contato c
                    JOIN tb_usuario u ON u.Usu_id = c.Ctt_usuarioid
                    JOIN (
                        SELECT Msg_contatoid, Msg_texto, Msg_remetente, Msg_anexocaminho, Msg_anexotipo, Msg_datacriacao,
                            ROW_NUMBER() OVER (
                                PARTITION BY Msg_contatoid
                                ORDER BY Msg_datacriacao DESC
                        ) AS rn
            FROM tb_mensagem
                WHERE Msg_datadelete IS NULL
                AND Msg_ocultoinstrutor IS NULL
            ) m ON m.Msg_contatoid = c.Ctt_id AND m.rn = 1
            WHERE c.Ctt_datadelete IS NULL
            AND c.Ctt_instrutorid = :idInstrutor
            ORDER BY m.Msg_datacriacao DESC
        ",[
            "idInstrutor" => $idInstrutor
        ]);
    }
    
    public function acharContatoDoUsuario($idContato, $idUsuario, $idInstrutor){

        return DataBase::table('tb_contato')->select()->where(
            "Ctt_id = :idContato AND Ctt_datadelete IS NULL AND (Ctt_usuarioid = :idUsuario OR 
            Ctt_instrutorid = :idInstrutor)",[
                "idContato" => $idContato,
                "idUsuario" => $idUsuario,
                "idInstrutor" => $idInstrutor
            ]
        );
        
    }

}

?>