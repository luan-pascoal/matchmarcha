<?php

class Instrutor{

    public function acharCidade($id){

        return DataBase::table('tb_cidade')->select()->where("Cid_id = :id", ["id" => $id]);

    }

    public function checarCnh($cnh){

        return DataBase::table('tb_instrutor') -> select() -> where("Ins_cnh = :cnh", ["cnh" => $cnh]);

    }

    public function checarInstrutor($id){

        return DataBase::table('Tb_Instrutor')->select()->where("Ins_usuarioid = :id", ["id" => $id]);

    }

    public function inserirInstrutor($usuarioId, $cnh, $categoria, $preco, $cidadeId){

        $arr = [
            "Ins_usuarioid" => $usuarioId,
            "Ins_cnh" => $cnh,
            "Ins_aulatipo" => $categoria,
            "Ins_aulapreco" => $preco,
            "Ins_cidadeid" => $cidadeId,
        ];

        return DataBase::table('tb_instrutor') -> insert($arr);

    }

    public function listarUnicoInstrutor($id){

        return DataBase::table('tb_instrutor')->raw(" 
            SELECT
            u.Usu_id,
            u.Usu_nome,
            u.Usu_email,
            u.Usu_cpf,
            u.Usu_genero,
            u.Usu_foto,
            i.Ins_id,
            i.Ins_cnh,
            i.Ins_aulapreco,
            i.Ins_aulatipo,
            i.Ins_descricao,
            c.Cid_id,
            c.Cid_nome,
            p.Per_id,
            p.Per_nome
            FROM Tb_Instrutor i
                INNER JOIN Tb_Usuario u
                ON u.Usu_id = i.Ins_usuarioid
                    INNER JOIN Tb_Cidade c
                    ON c.Cid_id = i.Ins_cidadeid
                        LEFT JOIN Tb_InstrutorPeriodo ip
                        ON ip.Inp_instrutorid = i.Ins_id
                            LEFT JOIN Tb_Periodo p
                            ON p.Per_id = ip.Inp_periodoid
            WHERE i.Ins_id = :id
            ORDER BY FIELD(p.Per_nome, 'Manhã', 'Tarde', 'Noite')", [':id' => $id]
        );
    }

    public function listarTodosInstrutor($busca = null, $local = null, $categoria = null, $precoMax = null, $porPagina = 12, $offset = 0){

        $porPagina = (int) $porPagina;
        $offset = (int) $offset;
        
        $sql = "
        SELECT
        i.Ins_id           AS instrutor_id,
        u.Usu_nome         AS nome,
        u.Usu_foto         AS foto,
        i.Ins_aulatipo     AS categoria,
        i.Ins_aulapreco    AS preco,
        c.Cid_nome         AS cidade,
        c.Cid_UF           AS uf,
        GROUP_CONCAT(DISTINCT p.Per_nome ORDER BY FIELD(p.Per_nome, 'Manhã', 'Tarde', 'Noite') SEPARATOR ', ') AS periodos
        FROM Tb_Instrutor i
            JOIN Tb_Usuario u                ON u.Usu_id = i.Ins_usuarioid
                JOIN Tb_Cidade  c                ON c.Cid_id = i.Ins_cidadeid
                    LEFT JOIN Tb_InstrutorPeriodo ip ON ip.Inp_instrutorid = i.Ins_id
                        LEFT JOIN Tb_Periodo p           ON p.Per_id = ip.Inp_periodoid
        WHERE 1=1
        ";

        $params = [];

        if(!empty($busca)){
            $sql .= " AND (u.Usu_nome LIKE :busca )";
            $params[':busca']  = '%' . $busca . '%';
        }

        if(!empty($local)){
            $sql .= " AND i.Ins_cidadeid = :local";
            $params[':local'] =  $local;
        }

        if(!empty($categoria)){
            $sql .= " AND i.Ins_aulatipo = :categoria";
            $params[':categoria'] = $categoria;
        }

        if($precoMax !==null && $precoMax !=""){

            if((int)$precoMax === 141){
                $sql .= " AND i.Ins_aulapreco > 140";
            }else{
                $sql .= " AND i.Ins_aulapreco <= :precoMax";
                $params[':precoMax'] = (int)$precoMax;
            }
            
        }

        $sql .= "
        GROUP BY i.Ins_id, u.Usu_nome, u.Usu_foto, i.Ins_aulatipo, i.Ins_aulapreco, c.Cid_nome, c.Cid_UF
            ORDER BY u.Usu_nome
                LIMIT $porPagina OFFSET $offset
        ";

        return DataBase::table('tb_instrutor')->raw($sql, $params);
    }


    public function contarTotal($busca = null, $local = null, $categoria = null, $precoMax = null){

        $sql = "
        SELECT COUNT(DISTINCT i.Ins_id) AS total
            FROM Tb_Instrutor i
                JOIN Tb_Usuario u ON u.Usu_id = i.Ins_usuarioid
                    JOIN Tb_Cidade c ON c.Cid_id = i.Ins_cidadeid
            WHERE 1=1
        ";

        $params = [];

        if(!empty($busca)){
            $sql .= " AND (u.Usu_nome LIKE :busca)";
            $params[':busca']  = '%' . $busca . '%';
        }

        if(!empty($local)){
            $sql .= " AND i.Ins_cidadeid = :local";
            $params[':local'] =  $local;
        }

        if (!empty($categoria)) {
            $sql .= " AND i.Ins_aulatipo = :categoria";
            $params[':categoria'] = $categoria;
        }

        if ($precoMax !== null && $precoMax !== '') {

            if ((int) $precoMax === 141) {
                $sql .= " AND i.Ins_aulapreco > 140";
                } else {
                    $sql .= " AND i.Ins_aulapreco <= :precoMax";
                    $params[':precoMax'] = (int) $precoMax;
                }
        }

        return DataBase::table('tb_instrutor')->raw($sql, $params);
    }


    public function atualizarDescrCidade($id, $cidadeId, $descricao){

        $dados = [
            "Ins_cidadeid" => $cidadeId,
            "Ins_descricao" => $descricao
        ];

        return DataBase::table('tb_instrutor')->update($dados)->where("Ins_id = :id", ["id" => $id]);

    }

    public function atualizarInstrutor($id, $preco, $categoria){

        $dados = [
            "Ins_aulapreco" => $preco,
            "Ins_aulatipo" => $categoria
        ];

        return DataBase::table('tb_instrutor')->update($dados)->where("Ins_id = :id", ["id" => $id]);
    }
    
    public function removerInstrutor($id){

        return DataBase::table('tb_instrutor')->delete()->where("Ins_id = :id",["id" => $id]);
        
    }

    public function acharTipoAula($instrutorId){
        return DataBase::table('Tb_Instrutor')->select()->where("Ins_id = :instrutorId", ["instrutorId" => $instrutorId]);
    }

}

?>

