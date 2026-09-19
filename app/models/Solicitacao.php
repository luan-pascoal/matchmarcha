<?php

class Solicitacao{

    protected function acharCidade($id){

        return DataBase::table('tb_cidade')->select()->where("Cid_id = :id", ["id" => $id]);

    }

    protected function acharUsuario($id){

        return DataBase::table('tb_usuario')->select()->where("Usu_id = :id", ["id" => $id]);

    }

    protected function acharInstrutor($id){

        return DataBase::table('tb_instrutor')->select()->where("Ins_id = :id", ["id" => $id]);

    }

    protected function checarSolicitacoes($usuarioId, $instrutorId){

        return DataBase::table('tb_solicitacaoAula')->select()->where(
            "Slc_status = :status AND Slc_usuarioid = :usuarioId AND Slc_instrutorid = :instrutorId",
            [
                "status" => "PENDENTE",
                "usuarioId" => $usuarioId,
                "instrutorId" => $instrutorId,
            ]
        );

    }

    protected function inserirSolicitacao($categoria, $periodo, $regiao, $status, $usuarioId, $instrutorId){

        $arr = [
            "Slc_categoria" => $categoria, 
            "Slc_periodo" => $periodo, 
            "Slc_cidadeid" => $regiao, 
            "Slc_status" => $status, 
            "Slc_usuarioid" => $usuarioId, 
            "Slc_instrutorid" => $instrutorId
        ];

        return DataBase::table('tb_solicitacaoAula')->insert($arr);

    }

    protected function listarTodasSol($instrutorId, $status, $porPagina = 8, $offset = 0){

        $porPagina = (int) $porPagina;
        $offset = (int) $offset;

        $sql = "
        SELECT
            s.Slc_id           AS id,
            s.Slc_categoria    AS categoria,
            s.Slc_periodo      AS periodo,
            s.Slc_status       AS status,
            u.Usu_id AS usuario_id,
            u.Usu_nome         AS nome,
            u.Usu_foto         AS foto,
            c.Cid_nome         AS cidade,
            c.Cid_UF           AS uf
        FROM Tb_SolicitacaoAula s
            JOIN Tb_Usuario u ON u.Usu_id = s.Slc_usuarioid
                JOIN Tb_Cidade c  ON c.Cid_id = s.Slc_cidadeid
                    WHERE s.Slc_instrutorid = :instrutorId
                        AND s.Slc_status = :status
                            ORDER BY s.Slc_id DESC
                                LIMIT $porPagina OFFSET $offset
        ";

        $params = [
            ':instrutorId' => $instrutorId,
            ':status' => $status
        ];

        return Database::table('tb_solicitacaoaula')->raw($sql, $params);

    }

    protected function contarPorStatus($instrutorId){

        $sql = "
        SELECT
            Slc_status AS status,
            COUNT(*)   AS total
                FROM Tb_SolicitacaoAula
                    WHERE Slc_instrutorid = :instrutorId
                        GROUP BY Slc_status
        ";

        $params = [
            ':instrutorId' => $instrutorId
        ];

        return Database::table('tb_solicitacaoaula')->raw($sql, $params);

    }

    protected function contarTotal($instrutorId, $status){

        return DataBase::table('tb_solicitacaoaula')->columns('COUNT(*) as total')->select()
        ->where('Slc_instrutorid = :instrutorId AND Slc_status = :status', [
            ':instrutorId' => $instrutorId,
            ':status'      => $status,
        ]);

    }

    protected function acharSolicitacao($id){

        return Database::table('tb_solicitacaoaula')->select()->where('Slc_id = :id', [':id' => $id]);

    }

    protected function atualizarSolicitacao($id, $status){

        $dados = [
            "Slc_status" => $status
        ];

        return Database::table('tb_solicitacaoaula')->update($dados)->where('Slc_id = :id', [':id' => $id]);
    }
}

?>

