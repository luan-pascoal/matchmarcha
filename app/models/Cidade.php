<?php

class Cidade {

    protected function listarTodasCidades(){
        return DataBase::table('Tb_Cidade')->select()->where("1=1");
    }

    public function acharCidadePorId($cidadeId){
        return DataBase::table('Tb_Cidade')->select()->where("Cid_id = :cidadeId", ["cidadeId" => $cidadeId]);
    }
}

?>

