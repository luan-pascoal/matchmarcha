<?php

class Mensagem {

    protected function listarMensagensContato($idContato, $remetente){

        $colunaOculto = $remetente === 'usuario' ? 'Msg_ocultousuario' : 'Msg_ocultoinstrutor';

        return DataBase::table('tb_mensagem')->raw("
        SELECT Msg_id, Msg_texto, Msg_remetente, Msg_anexocaminho, Msg_anexotipo, Msg_datacriacao, Msg_datadelete
            FROM tb_mensagem
                WHERE Msg_contatoid = :idContato
                    AND {$colunaOculto} IS NULL
                        ORDER BY Msg_datacriacao ASC
        ",[
        "idContato" => $idContato
        ]);
    
    }

    protected function inserirMensagem($idContato, $texto, $remetente, $anexoCaminho = null, $anexoTipo = null){

        $arr = [
            "Msg_texto" => $texto,
            "Msg_remetente" => $remetente,
            "Msg_anexocaminho" => $anexoCaminho,
            "Msg_anexotipo" => $anexoTipo,
            "Msg_contatoid" => $idContato
        ];

        return DataBase::table('tb_mensagem')->insert($arr);

    }

    protected function acharMsgPorId($msgId){

        return DataBase::table('tb_mensagem')->select()->where("Msg_id = :msgId", ["msgId" => $msgId]);

    }

    protected function atualizarMensagem($msgId, $texto){

        $arr = [
            "Msg_texto" => $texto,
            "Msg_dataupdate" => date("Y-m-d H:i:s")
        ];

        return DataBase::table('tb_mensagem')->update($arr)->where("Msg_id = :msgId", ["msgId" => $msgId]);

    }

    protected function ocultarMsg($msgId, $tipoUsuario){

        $coluna = $tipoUsuario === 'usuario' ? 'Msg_ocultousuario' : 'Msg_ocultoinstrutor';

        $arr = [
            $coluna => date("Y-m-d H:i:s")
        ];

        return DataBase::table('tb_mensagem')->update($arr)->where("Msg_id = :msgId", ["msgId" => $msgId]);

    }

    protected function removerMsg($msgId){

        $arr = [
            "Msg_datadelete" => date("Y-m-d H:i:s")
        ];

    return DataBase::table('tb_mensagem')->update($arr)->where("Msg_id = :msgId", ["msgId" => $msgId]);

    }
 
}
?>