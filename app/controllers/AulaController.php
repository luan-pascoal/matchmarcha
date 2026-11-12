<?php

class AulaController extends Aula {

    // Atributos da tabela Tb_Aula
    private $aulaId;
    private $data;
    private $horarioInicio;
    private $horarioFim;
    private $categoria;
    private $cidadeId;
    private $usuarioId;
    private $instrutorId;

    // Atributos auxiliares
    private $tipoSessao;
    private $agora;
    private $aulaAtual = null;
    private $alteracoes = [];

    /************************************************************
    *                        MÉTODOS                            *
    *        Métodos responsáveis pelas requisições HTTP        *
    ************************************************************/

    public function listarTodas(){

        $erros = [];
        $this->tipoSessao = $_SESSION['USER']['tipo'] ?? null;
        $this->definirAgora();

        $erros = $this->validarSessao($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        if($this->tipoSessao === 'instrutor'){
            $resultado = $this->listarAulasInstrutor($_SESSION['USER']['instrutor_id'], $this->agora);
        } else {
            $resultado = $this->listarAulasAluno($_SESSION['USER']['id'], $this->agora);
        }

        if($resultado === false){
            http_response_code(422);
            echo json_encode(["Erro" => ["bd" => "Erro ao consultar aulas"]]);
            return;
        }

        http_response_code(200);
        echo json_encode([
            "Sucesso" => [
                "aulas" => $resultado
            ]
        ]);
        return;
    }

    public function criarAula($data){

        $erros = [];

        $this->tipoSessao = $_SESSION['USER']['tipo'] ?? null;
        $this->definirAgora();

        $this->usuarioId = $data["usuarioId"] ?? null;
        $this->data = $data["data"] ?? null;
        $this->horarioInicio = $data["horario_inicio"] ?? null;
        $this->horarioFim = $data["horario_fim"] ?? null;
        $this->cidadeId = $data["cidadeId"] ?? null;
        $this->categoria = $data["categoria"] ?? null;

        $erros = $this->validarInstrutor($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        $erros = $this->validarUsuarioId($erros);
        $erros = $this->validarData($erros);
        $erros = $this->validarHorarios($erros);
        $erros = $this->validarCategoria($erros);
        $erros = $this->validarCidadeId($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        $erros = $this->validarContatoAluno($erros);
        $erros = $this->validarCidadeExiste($erros);
        $erros = $this->validarCategoriaDoInstrutor($erros);
        $erros = $this->validarNaoPassado($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        $erros = $this->validarConflitos($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        $idAula = $this->inserirAula(
            $this->usuarioId,
            $this->instrutorId,
            $this->data,
            $this->horarioInicio,
            $this->horarioFim,
            $this->categoria,
            $this->cidadeId
        );

        if($idAula === false){
            http_response_code(422);
            echo json_encode(["Erro" => ["bd" => "Erro interno ao criar aula"]]);
            return;
        }

        http_response_code(200);
        echo json_encode([
            "Sucesso" => [
                "idAula" => (int) $idAula
            ]
        ]);

        $this->notificarAtualizacao((int) $idAula);

        return;
    }

    public function editarAula($idAula, $data){

        $erros = [];

        $this->aulaId = $idAula;
        $this->tipoSessao = $_SESSION['USER']['tipo'] ?? null;
        $this->definirAgora();

        $erros = $this->validarInstrutor($erros);
        $erros = $this->validarIdAula($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        $erros = $this->validarAulaDoInstrutor($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        $erros = $this->validarAulaAgendada($erros, 'editar');

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        // Monta os valores finais da aula (o que foi enviado ou o que já existe) para validar tudo em conjunto
        $erros = $this->montarAlteracoes($erros, $data);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        $erros = $this->validarData($erros);
        $erros = $this->validarHorarios($erros);
        $erros = $this->validarCategoria($erros);
        $erros = $this->validarCidadeId($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        if(array_key_exists("cidadeId", $this->alteracoes)){
            $erros = $this->validarCidadeExiste($erros);
        }

        if(array_key_exists("categoria", $this->alteracoes)){
            $erros = $this->validarCategoriaDoInstrutor($erros);
        }

        $erros = $this->validarNaoPassado($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        $mudouPeriodo = array_key_exists("data", $this->alteracoes)
            || array_key_exists("horario_inicio", $this->alteracoes)
            || array_key_exists("horario_fim", $this->alteracoes);

        if($mudouPeriodo){
            $erros = $this->validarConflitos($erros);

            if(!empty($erros)){
                http_response_code(422);
                echo json_encode(["Erro" => $erros]);
                return;
            }
        }

        // Atualiza somente as colunas que vieram na requisição
        $arr = [];

        if(array_key_exists("data", $this->alteracoes)) $arr["Au_data"] = $this->data;
        if(array_key_exists("horario_inicio", $this->alteracoes)) $arr["Au_horario_inicio"] = $this->horarioInicio;
        if(array_key_exists("horario_fim", $this->alteracoes)) $arr["Au_horario_fim"] = $this->horarioFim;
        if(array_key_exists("cidadeId", $this->alteracoes)) $arr["Au_cidadeid"] = $this->cidadeId;
        if(array_key_exists("categoria", $this->alteracoes)) $arr["Au_categoria"] = $this->categoria;

        $resultado = $this->atualizarAula($this->aulaId, $arr);

        if($resultado === false){
            http_response_code(422);
            echo json_encode(["Erro" => ["bd" => "Erro interno ao editar aula"]]);
            return;
        }

        http_response_code(200);
        echo json_encode([
            "Sucesso" => [
                "idAula" => (int) $this->aulaId
            ]
        ]);

        $this->notificarAtualizacao((int) $this->aulaId);

        return;
    }

    public function excluirAula($idAula){

        $erros = [];

        $this->aulaId = $idAula;
        $this->tipoSessao = $_SESSION['USER']['tipo'] ?? null;
        $this->definirAgora();

        $erros = $this->validarInstrutor($erros);
        $erros = $this->validarIdAula($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        $erros = $this->validarAulaDoInstrutor($erros);

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        $erros = $this->validarAulaAgendada($erros, 'cancelar');

        if(!empty($erros)){
            http_response_code(422);
            echo json_encode(["Erro" => $erros]);
            return;
        }

        // Soft delete: a aula continua no banco com status CANCELADA
        $resultado = $this->cancelarAula($this->aulaId);

        if($resultado === false){
            http_response_code(422);
            echo json_encode(["Erro" => ["bd" => "Erro interno ao cancelar aula"]]);
            return;
        }

        http_response_code(200);
        echo json_encode([
            "Sucesso" => [
                "idAula" => (int) $this->aulaId
            ]
        ]);

        $this->notificarAtualizacao((int) $this->aulaId);

        return;
    }

    // Horário atual de São Paulo (Y-m-d H:i:s), usado no status calculado e nas validações de "passado"
    private function definirAgora(){

        $this->agora = (new DateTime('now', new DateTimeZone('America/Sao_Paulo')))->format('Y-m-d H:i:s');

    }

    // Avisa aluno e instrutor para refazerem a consulta de aulas
    private function notificarAtualizacao($idAula){

        try {

            $pusher = PusherService::getInstance();

            $pusher->trigger(
                "private-usuario" . $this->usuarioId,
                "aula-atualizada",
                ["aulaId" => $idAula]
            );

            $pusher->trigger(
                "private-instrutor" . $this->instrutorId,
                "aula-atualizada",
                ["aulaId" => $idAula]
            );

        } catch (Throwable $e) {
            // A resposta HTTP já foi enviada; falha no Pusher não deve gerar saída extra
        }

    }

    /************************************************************
    *                        Validações                         *
    *           Regras de validação dos dados da aula           *
    ************************************************************/

    private function validarSessao($erros){

        $tiposPermitidos = ["usuario", "instrutor"];

        if(empty($this->tipoSessao) || !in_array($this->tipoSessao, $tiposPermitidos, true)){
            $erros["sessao"] = "Sessão inválida";
            return $erros;
        }

        $idSessao = $this->tipoSessao === 'instrutor'
            ? ($_SESSION['USER']['instrutor_id'] ?? null)
            : ($_SESSION['USER']['id'] ?? null);

        if(empty($idSessao)){
            $erros["sessao"] = "Sessão inválida";
            return $erros;
        }

        return $erros;
    }

    private function validarInstrutor($erros){

        $erros = $this->validarSessao($erros);

        if(!empty($erros)){
            return $erros;
        }

        if($this->tipoSessao !== 'instrutor'){
            $erros["permissao"] = "Apenas instrutores podem gerenciar aulas";
            return $erros;
        }

        $this->instrutorId = (int) $_SESSION['USER']['instrutor_id'];
        return $erros;
    }

    private function validarIdAula($erros){

        $idAula = filter_var($this->aulaId, FILTER_VALIDATE_INT);

        if($idAula === false || $idAula <= 0){
            $erros["idAula"] = "Aula inválida";
            return $erros;
        }

        $this->aulaId = $idAula;
        return $erros;
    }

    // Busca a aula e garante que ela pertence ao instrutor logado
    private function validarAulaDoInstrutor($erros){

        $resultado = $this->acharAulaPorId($this->aulaId, $this->agora);

        if($resultado === false || empty($resultado)){
            $erros["idAula"] = "Aula não encontrada";
            return $erros;
        }

        if((int) $resultado[0]->Au_instrutorid !== $this->instrutorId){
            $erros["idAula"] = "Aula não encontrada";
            return $erros;
        }

        $this->aulaAtual = $resultado[0];
        $this->usuarioId = (int) $resultado[0]->Au_usuarioid;

        return $erros;
    }

    // Só aulas AGENDADAS (status calculado) podem ser editadas ou canceladas
    private function validarAulaAgendada($erros, $acao){

        $status = $this->aulaAtual->Au_status;

        if($status === 'CANCELADA'){
            $erros["status"] = $acao === 'cancelar'
                ? "Essa aula já foi cancelada"
                : "Aulas canceladas não podem ser editadas";
            return $erros;
        }

        if($status === 'CONCLUIDA'){
            $erros["status"] = $acao === 'cancelar'
                ? "Aulas concluídas não podem ser canceladas"
                : "Aulas concluídas não podem ser editadas";
            return $erros;
        }

        return $erros;
    }

    // Na edição: separa os campos enviados e completa os demais com os valores atuais da aula
    private function montarAlteracoes($erros, $data){

        $permitidos = ["data", "horario_inicio", "horario_fim", "cidadeId", "categoria"];

        if(is_array($data)){
            foreach($permitidos as $campo){
                if(array_key_exists($campo, $data)){
                    $this->alteracoes[$campo] = $data[$campo];
                }
            }
        }

        if(empty($this->alteracoes)){
            $erros["corpo"] = "Nenhum campo para atualizar";
            return $erros;
        }

        $this->data = $this->valorFinal("data", $this->aulaAtual->Au_data);
        $this->horarioInicio = $this->valorFinal("horario_inicio", substr($this->aulaAtual->Au_horario_inicio, 0, 5));
        $this->horarioFim = $this->valorFinal("horario_fim", substr($this->aulaAtual->Au_horario_fim, 0, 5));
        $this->cidadeId = $this->valorFinal("cidadeId", $this->aulaAtual->Au_cidadeid);
        $this->categoria = $this->valorFinal("categoria", $this->aulaAtual->Au_categoria);

        return $erros;
    }

    private function valorFinal($campo, $valorAtual){

        return array_key_exists($campo, $this->alteracoes)
            ? $this->alteracoes[$campo]
            : $valorAtual;
    }

    private function validarUsuarioId($erros){

        $usuarioId = filter_var($this->usuarioId, FILTER_VALIDATE_INT);

        if($usuarioId === false || $usuarioId <= 0){
            $erros["usuarioId"] = "Aluno inválido";
            return $erros;
        }

        $this->usuarioId = $usuarioId;
        return $erros;
    }

    private function validarData($erros){

        if(empty($this->data) || !is_string($this->data)){
            $erros["data"] = "Informe a data da aula";
            return $erros;
        }

        $data = DateTime::createFromFormat('Y-m-d', $this->data);

        if($data === false || $data->format('Y-m-d') !== $this->data){
            $erros["data"] = "Data inválida";
            return $erros;
        }

        return $erros;
    }

    private function validarHorarios($erros){

        // HH:MM de 00:00 a 23:59
        $padrao = '/^([01]\d|2[0-3]):[0-5]\d$/';

        $inicioValido = is_string($this->horarioInicio) && preg_match($padrao, $this->horarioInicio) === 1;
        $fimValido = is_string($this->horarioFim) && preg_match($padrao, $this->horarioFim) === 1;

        if(!$inicioValido){
            $erros["horario_inicio"] = "Horário de início inválido";
        }

        if(!$fimValido){
            $erros["horario_fim"] = "Horário de término inválido";
        }

        if(!$inicioValido || !$fimValido){
            return $erros;
        }

        // Mesmo formato HH:MM, então a comparação de texto equivale à comparação de horário
        if(strcmp($this->horarioFim, $this->horarioInicio) <= 0){
            $erros["horario_fim"] = "O horário de término deve ser posterior ao de início";
            return $erros;
        }

        return $erros;
    }

    private function validarCategoria($erros){

        $categoriasPermitidas = ["A", "B", "AB"];

        if(!in_array($this->categoria, $categoriasPermitidas, true)){
            $erros["categoria"] = "Categoria inválida";
            return $erros;
        }

        return $erros;
    }

    private function validarCidadeId($erros){

        $cidadeId = filter_var($this->cidadeId, FILTER_VALIDATE_INT);

        if($cidadeId === false || $cidadeId <= 0){
            $erros["cidadeId"] = "Cidade inválida";
            return $erros;
        }

        $this->cidadeId = $cidadeId;
        return $erros;
    }

    private function validarContatoAluno($erros){

        $contato = new Contato();
        $resultado = $contato->acharContatoAlunoInstrutor($this->usuarioId, $this->instrutorId);

        if($resultado === false || empty($resultado)){
            $erros["usuarioId"] = "Você não tem contato com esse aluno";
            return $erros;
        }

        return $erros;
    }

    private function validarCidadeExiste($erros){

        $cidade = new Cidade();
        $resultado = $cidade->acharCidadePorId($this->cidadeId);

        if($resultado === false || empty($resultado)){
            $erros["cidadeId"] = "Cidade não encontrada";
            return $erros;
        }

        return $erros;
    }

    // A categoria da aula precisa estar entre as que o instrutor leciona (Ins_aulatipo: A, B ou AB)
    private function validarCategoriaDoInstrutor($erros){

        $instrutor = new Instrutor();
        $resultado = $instrutor->acharTipoAula($this->instrutorId);

        if($resultado === false || empty($resultado)){
            $erros["categoria"] = "Não foi possível validar a categoria";
            return $erros;
        }

        $tipoInstrutor = trim($resultado[0]->Ins_aulatipo);
        $categoriasDoInstrutor = $tipoInstrutor === "AB" ? ["A", "B", "AB"] : [$tipoInstrutor];

        if(!in_array($this->categoria, $categoriasDoInstrutor, true)){
            $erros["categoria"] = "Você não leciona a categoria " . $this->categoria;
            return $erros;
        }

        return $erros;
    }

    // Na criação: o início não pode ter passado.
    // Na edição: só valida o que foi alterado (data/início => início no futuro; só término => término no futuro),
    // assim é possível editar outros campos de uma aula que já começou e ainda não terminou.
    private function validarNaoPassado($erros){

        $agoraMinuto = substr($this->agora, 0, 16);
        $criando = ($this->aulaAtual === null);

        if($criando || array_key_exists("data", $this->alteracoes) || array_key_exists("horario_inicio", $this->alteracoes)){

            if(strcmp($this->data . ' ' . $this->horarioInicio, $agoraMinuto) < 0){
                $erros["data"] = "Não é possível agendar uma aula em um horário que já passou";
            }

            return $erros;
        }

        if(array_key_exists("horario_fim", $this->alteracoes)){

            if(strcmp($this->data . ' ' . $this->horarioFim, $agoraMinuto) <= 0){
                $erros["horario_fim"] = "O horário de término já passou";
            }

        }

        return $erros;
    }

    // Sobreposição [início, fim): conflita quando início < fim existente e fim > início existente.
    // Aulas que apenas se encostam não conflitam. Aulas canceladas não contam. Na edição, ignora a própria aula.
    private function validarConflitos($erros){

        $ignorarAulaId = $this->aulaId ?? 0;

        $conflitosInstrutor = $this->buscarConflitos(
            'Au_instrutorid',
            $this->instrutorId,
            $this->data,
            $this->horarioInicio,
            $this->horarioFim,
            $ignorarAulaId
        );

        $conflitosAluno = $this->buscarConflitos(
            'Au_usuarioid',
            $this->usuarioId,
            $this->data,
            $this->horarioInicio,
            $this->horarioFim,
            $ignorarAulaId
        );

        if($conflitosInstrutor === false || $conflitosAluno === false){
            $erros["bd"] = "Erro ao verificar conflitos de horário";
            return $erros;
        }

        if(!empty($conflitosInstrutor)){
            $erros["horario"] = "Você já tem uma aula marcada nesse horário";
        }

        if(!empty($conflitosAluno)){
            $erros["horarioAluno"] = "O aluno já tem uma aula marcada nesse horário";
        }

        return $erros;
    }
}
?>