CREATE DATABASE IF NOT EXISTS MatchMarcha;
USE MatchMarcha;

-- =========================
-- TABELA USUARIO
-- =========================
CREATE TABLE IF NOT EXISTS Tb_Usuario (
    Usu_id           INT AUTO_INCREMENT PRIMARY KEY,
    Usu_nome         VARCHAR(255)  NOT NULL,
    Usu_email        VARCHAR(255)  NOT NULL UNIQUE,
    Usu_senha        VARCHAR(255)  NOT NULL,
    Usu_cpf          VARCHAR(16)   NOT NULL UNIQUE,
    Usu_genero       CHAR(1)       NOT NULL,
    Usu_foto         VARCHAR(255)  NOT NULL,
    Usu_datacriacao  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Usu_statusonline VARCHAR(16)   NOT NULL,
    Usu_ultimaonline TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TABELA CIDADE
-- =========================
CREATE TABLE IF NOT EXISTS Tb_Cidade (
    Cid_id   INT AUTO_INCREMENT PRIMARY KEY,
    Cid_nome VARCHAR(128) NOT NULL,
    Cid_UF   CHAR(2)      NOT NULL
);

-- =========================
-- TABELA MARCA
-- =========================
CREATE TABLE IF NOT EXISTS Tb_Marca (
    Mrc_id   INT AUTO_INCREMENT PRIMARY KEY,
    Mrc_nome VARCHAR(128) NOT NULL
);

-- =========================
-- TABELA MODELO
-- =========================
CREATE TABLE IF NOT EXISTS Tb_Modelo (
    Mod_id      INT AUTO_INCREMENT PRIMARY KEY,
    Mod_nome    VARCHAR(128) NOT NULL,
    Mod_ano     INT          NOT NULL,
    Mod_marcaid INT          NOT NULL,

    CONSTRAINT fk_modelo_marca
        FOREIGN KEY (Mod_marcaid)
        REFERENCES Tb_Marca(Mrc_id)
);

-- =========================
-- TABELA COR
-- =========================
CREATE TABLE IF NOT EXISTS Tb_Cor (
    Cor_id   INT AUTO_INCREMENT PRIMARY KEY,
    Cor_nome VARCHAR(128) NOT NULL
);

-- =========================
-- TABELA PERIODO
-- =========================
CREATE TABLE IF NOT EXISTS Tb_Periodo (
    Per_id   INT AUTO_INCREMENT PRIMARY KEY,
    Per_nome VARCHAR(10) NOT NULL
);

-- =========================
-- TABELA INSTRUTOR
-- =========================
CREATE TABLE IF NOT EXISTS Tb_Instrutor (
    Ins_id        INT         AUTO_INCREMENT PRIMARY KEY,
    Ins_usuarioid INT         NOT NULL,
    Ins_cnh       VARCHAR(16) NOT NULL UNIQUE,
    Ins_aulapreco FLOAT       NOT NULL,
    Ins_aulatipo  CHAR(1)     NOT NULL,
    Ins_cidadeid  INT         NOT NULL,
    Ins_descricao VARCHAR(500) NULL,

    CONSTRAINT fk_instrutor_usuario
        FOREIGN KEY (Ins_usuarioid)
        REFERENCES Tb_Usuario(Usu_id),

    CONSTRAINT fk_instrutor_cidade
        FOREIGN KEY (Ins_cidadeid)
        REFERENCES Tb_Cidade(Cid_id)
);

-- =========================
-- TABELA INSTRUTOR PERIODO
-- =========================
CREATE TABLE IF NOT EXISTS Tb_InstrutorPeriodo (
    Inp_id          INT AUTO_INCREMENT PRIMARY KEY,
    Inp_instrutorid INT NOT NULL,
    Inp_periodoid   INT NOT NULL,

    CONSTRAINT fk_instrutorperiodo_instrutor
        FOREIGN KEY (Inp_instrutorid)
        REFERENCES Tb_Instrutor(Ins_id),

    CONSTRAINT fk_instrutorperiodo_periodo
        FOREIGN KEY (Inp_periodoid)
        REFERENCES Tb_Periodo(Per_id)
);

-- =========================
-- TABELA CONTATO
-- =========================
CREATE TABLE IF NOT EXISTS Tb_Contato (
    Ctt_id          INT AUTO_INCREMENT PRIMARY KEY,
    Ctt_datacriacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Ctt_datadelete  TIMESTAMP NULL     DEFAULT NULL,
    Ctt_usuarioid   INT       NOT NULL,
    Ctt_instrutorid INT       NOT NULL,

    CONSTRAINT fk_contato_usuario
        FOREIGN KEY (Ctt_usuarioid)
        REFERENCES Tb_Usuario(Usu_id),

    CONSTRAINT fk_contato_instrutor
        FOREIGN KEY (Ctt_instrutorid)
        REFERENCES Tb_Instrutor(Ins_id)
);

-- =========================
-- TABELA MENSAGEM
-- =========================
CREATE TABLE IF NOT EXISTS Tb_Mensagem (
    Msg_id              INT AUTO_INCREMENT PRIMARY KEY,
    Msg_texto           VARCHAR(1024) NULL     DEFAULT NULL,
    Msg_remetente       VARCHAR(32)   NOT NULL,
    Msg_anexocaminho    VARCHAR(255)  NULL     DEFAULT NULL,
    Msg_anexotipo       VARCHAR(16)   NULL     DEFAULT NULL,
    Msg_datacriacao     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Msg_dataupdate      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Msg_datadelete      TIMESTAMP     NULL     DEFAULT NULL,
    Msg_ocultoUsuario   TIMESTAMP     NULL     DEFAULT NULL,
    Msg_ocultoInstrutor TIMESTAMP     NULL     DEFAULT NULL,
    Msg_contatoid       INT           NOT NULL,

    CONSTRAINT fk_mensagem_contato
        FOREIGN KEY (Msg_contatoid)
        REFERENCES Tb_Contato(Ctt_id)
);


-- =========================
-- TABELA AULA
-- =========================
CREATE TABLE IF NOT EXISTS Tb_Aula (
    Au_id          INT AUTO_INCREMENT PRIMARY KEY,
    Au_data        DATE    NOT NULL,
    Au_horario     TIME    NOT NULL,
    Au_categoria   CHAR(1) NOT NULL,
    Au_cidadeid    INT     NOT NULL,
    Au_usuarioid   INT     NOT NULL,
    Au_instrutorid INT     NOT NULL,
    Au_status      VARCHAR(16) NOT NULL DEFAULT 'AGENDADA',

    CONSTRAINT fk_aula_cidade
        FOREIGN KEY (Au_cidadeid)
        REFERENCES Tb_Cidade(Cid_id),

    CONSTRAINT fk_aula_usuario
        FOREIGN KEY (Au_usuarioid)
        REFERENCES Tb_Usuario(Usu_id),

    CONSTRAINT fk_aula_instrutor
        FOREIGN KEY (Au_instrutorid)
        REFERENCES Tb_Instrutor(Ins_id)
);


-- =========================
-- TABELA SOLICITACAO AULA
-- =========================
CREATE TABLE IF NOT EXISTS Tb_SolicitacaoAula (
    Slc_id          INT         AUTO_INCREMENT PRIMARY KEY,
    Slc_categoria   VARCHAR(16) NOT NULL,
    Slc_periodo     VARCHAR(16) NOT NULL,
    Slc_cidadeid    INT         NOT NULL,
    Slc_status      VARCHAR(16) NOT NULL,
    Slc_usuarioid   INT         NOT NULL,
    Slc_instrutorid INT         NOT NULL,

    CONSTRAINT fk_solicitacao_usuario
        FOREIGN KEY (Slc_usuarioid)
        REFERENCES Tb_Usuario(Usu_id),

    CONSTRAINT fk_solicitacao_instrutor
        FOREIGN KEY (Slc_instrutorid)
        REFERENCES Tb_Instrutor(Ins_id),

    CONSTRAINT fk_solicitacao_cidade
        FOREIGN KEY (Slc_cidadeid)
        REFERENCES Tb_Cidade(Cid_id)
);

-- =========================
-- TABELA REDEFINIR SENHA
-- =========================
CREATE TABLE IF NOT EXISTS Tb_RedefinirSenha (
    Rdf_id            INT AUTO_INCREMENT PRIMARY KEY,
    Rdf_selector      VARCHAR(255) NOT NULL,
    Rdf_token         VARCHAR(255) NOT NULL,
    Rdf_dataexpiracao TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Rdf_usuarioid     INT          NOT NULL,

    CONSTRAINT fk_redefinir_usuario
        FOREIGN KEY (Rdf_usuarioid)
        REFERENCES Tb_Usuario(Usu_id)
);

-- =========================
-- TABELA VEICULO
-- =========================
CREATE TABLE IF NOT EXISTS Tb_Veiculo (
    Vcl_id          INT AUTO_INCREMENT PRIMARY KEY,
    Vcl_cambio      VARCHAR(16) NOT NULL,
    Vcl_tipo        CHAR(1)     NOT NULL,
    Vcl_cilindrada  FLOAT,
    Vcl_pedalaux    CHAR(1)     NOT NULL,
    Vcl_direcao     VARCHAR(32) NOT NULL,
    Vcl_corid       INT         NOT NULL,
    Vcl_modeloid    INT         NOT NULL,
    Vcl_instrutorid INT         NOT NULL,

    CONSTRAINT fk_veiculo_cor
        FOREIGN KEY (Vcl_corid)
        REFERENCES Tb_Cor(Cor_id),

    CONSTRAINT fk_veiculo_modelo
        FOREIGN KEY (Vcl_modeloid)
        REFERENCES Tb_Modelo(Mod_id),

    CONSTRAINT fk_veiculo_instrutor
        FOREIGN KEY (Vcl_instrutorid)
        REFERENCES Tb_Instrutor(Ins_id)
);