<?php
 
class Aula {
 
    // Status calculado na consulta: CANCELADA é gravado no banco; CONCLUIDA e AGENDADA dependem do horário.
    // Usa o parâmetro :agora (horário de São Paulo, formato Y-m-d H:i:s) e só pode aparecer uma vez por query.
    private $sqlStatus = "
        CASE
            WHEN a.Au_status = 'CANCELADA' THEN 'CANCELADA'
            WHEN TIMESTAMP(a.Au_data, a.Au_horario_fim) < :agora THEN 'CONCLUIDA'
            ELSE 'AGENDADA'
        END
    ";
 
    protected function listarAulasAluno($usuarioId, $agora){
 
        return DataBase::table('Tb_Aula')->raw("
        SELECT a.Au_id, a.Au_data, a.Au_horario_inicio, a.Au_horario_fim, a.Au_categoria, a.Au_cidadeid,
               {$this->sqlStatus} AS Au_status,
               a.Au_instrutorid AS outro_id,
               u.Usu_nome AS outro_nome
            FROM Tb_Aula a
                INNER JOIN Tb_Instrutor i ON i.Ins_id = a.Au_instrutorid
                INNER JOIN Tb_Usuario u ON u.Usu_id = i.Ins_usuarioid
                    WHERE a.Au_usuarioid = :usuarioId
                        ORDER BY a.Au_data ASC, a.Au_horario_inicio ASC
        ",[
        "agora" => $agora,
        "usuarioId" => $usuarioId
        ]);
 
    }
 
    protected function listarAulasInstrutor($instrutorId, $agora){
 
        return DataBase::table('Tb_Aula')->raw("
        SELECT a.Au_id, a.Au_data, a.Au_horario_inicio, a.Au_horario_fim, a.Au_categoria, a.Au_cidadeid,
               {$this->sqlStatus} AS Au_status,
               a.Au_usuarioid AS outro_id,
               u.Usu_nome AS outro_nome
            FROM Tb_Aula a
                INNER JOIN Tb_Usuario u ON u.Usu_id = a.Au_usuarioid
                    WHERE a.Au_instrutorid = :instrutorId
                        ORDER BY a.Au_data ASC, a.Au_horario_inicio ASC
        ",[
        "agora" => $agora,
        "instrutorId" => $instrutorId
        ]);
 
    }
 
    protected function acharAulaPorId($aulaId, $agora){
 
        return DataBase::table('Tb_Aula')->raw("
        SELECT a.Au_id, a.Au_data, a.Au_horario_inicio, a.Au_horario_fim, a.Au_categoria, a.Au_cidadeid,
               a.Au_usuarioid, a.Au_instrutorid,
               {$this->sqlStatus} AS Au_status
            FROM Tb_Aula a
                WHERE a.Au_id = :aulaId
        ",[
        "agora" => $agora,
        "aulaId" => $aulaId
        ]);
 
    }
 
    // Procura aulas não canceladas que se sobrepõem ao período [inicio, fim) na data informada.
    // $coluna: 'Au_instrutorid' (agenda do instrutor) ou 'Au_usuarioid' (agenda do aluno).
    // $ignorarAulaId: usado na edição para ignorar a própria aula (0 = não ignora nenhuma).
    protected function buscarConflitos($coluna, $id, $data, $inicio, $fim, $ignorarAulaId = 0){
 
        if(!in_array($coluna, ['Au_instrutorid', 'Au_usuarioid'], true)){
            return false;
        }
 
        return DataBase::table('Tb_Aula')->raw("
        SELECT Au_id
            FROM Tb_Aula
                WHERE {$coluna} = :id
                    AND Au_data = :data
                    AND Au_status <> 'CANCELADA'
                    AND Au_horario_inicio < :fim
                    AND Au_horario_fim > :inicio
                    AND Au_id <> :ignorarAulaId
        ",[
        "id" => $id,
        "data" => $data,
        "inicio" => $inicio,
        "fim" => $fim,
        "ignorarAulaId" => $ignorarAulaId
        ]);
 
    }
 
    protected function inserirAula($usuarioId, $instrutorId, $data, $inicio, $fim, $categoria, $cidadeId){
 
        $arr = [
            "Au_data" => $data,
            "Au_horario_inicio" => $inicio,
            "Au_horario_fim" => $fim,
            "Au_categoria" => $categoria,
            "Au_cidadeid" => $cidadeId,
            "Au_usuarioid" => $usuarioId,
            "Au_instrutorid" => $instrutorId
        ];
 
        return DataBase::table('Tb_Aula')->insert($arr);
 
    }
 
    // $arr já vem com os nomes das colunas (Au_data, Au_horario_inicio...) e só com os campos alterados
    protected function atualizarAula($aulaId, $arr){
 
        return DataBase::table('Tb_Aula')->update($arr)->where("Au_id = :aulaId", ["aulaId" => $aulaId]);
 
    }
 
    protected function cancelarAula($aulaId){
 
        $arr = [
            "Au_status" => "CANCELADA"
        ];
 
        return DataBase::table('Tb_Aula')->update($arr)->where("Au_id = :aulaId", ["aulaId" => $aulaId]);
 
    }
 
}
?>