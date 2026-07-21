-- =============================================================
--  CHEIRAI — Modelo ER Completo (v2)
--  Gerado para MySQL Workbench
--  Versão 2.0 · 2026
--  Cobre 100% dos requisitos funcionais v1.0
-- =============================================================

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

DROP SCHEMA IF EXISTS `cheirai`;
CREATE SCHEMA `cheirai` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `cheirai`;

-- =============================================================
-- Módulo 1 — AUTENTICAÇÃO
-- Tabela: familia
-- Grupo familiar compartilhado com até 6 membros
-- =============================================================
CREATE TABLE IF NOT EXISTS `familia` (
  `id_familia`    INT          NOT NULL AUTO_INCREMENT,
  `nome_familia`  VARCHAR(100) NOT NULL,
  `criado_em`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_familia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Grupo familiar — máx. 6 membros (validado por trigger)';

-- =============================================================
-- Módulo 1 — AUTENTICAÇÃO
-- Tabela: usuario
-- Suporta login email/senha, Google e Apple ID
-- Idioma: pt, en, es | Tema: claro, escuro, automático
-- =============================================================
CREATE TABLE IF NOT EXISTS `usuario` (
  `id_usuario`        INT           NOT NULL AUTO_INCREMENT,
  `id_familia`        INT           NULL                        COMMENT 'NULL = sem família',
  `nome`              VARCHAR(120)  NOT NULL,
  `email`             VARCHAR(255)  NOT NULL,
  `senha`             VARCHAR(255)  NULL                        COMMENT 'NULL se login exclusivamente social',
  `idioma`            ENUM('pt','en','es')              NOT NULL DEFAULT 'pt',
  `tema`              ENUM('claro','escuro','automatico') NOT NULL DEFAULT 'automatico',
  -- Login social (Módulo 1)
  `google_id`         VARCHAR(255)  NULL                        COMMENT 'ID do provedor Google',
  `apple_id`          VARCHAR(255)  NULL                        COMMENT 'ID do provedor Apple',
  `criado_em`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `uq_usuario_email`     (`email`),
  UNIQUE KEY `uq_usuario_google`    (`google_id`),
  UNIQUE KEY `uq_usuario_apple`     (`apple_id`),
  CONSTRAINT `fk_usuario_familia`
    FOREIGN KEY (`id_familia`) REFERENCES `familia` (`id_familia`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Conta de usuário — login email, Google ou Apple ID';

-- =============================================================
-- Módulo 1 — AUTENTICAÇÃO
-- Tabela: sessao
-- Controle de dispositivos e sessões ativas (Módulo 9)
-- =============================================================
CREATE TABLE IF NOT EXISTS `sessao` (
  `id_sessao`      INT           NOT NULL AUTO_INCREMENT,
  `id_usuario`     INT           NOT NULL,
  `dispositivo`    VARCHAR(200)  NOT NULL                       COMMENT 'Nome/modelo do dispositivo',
  `plataforma`     ENUM('ios','android','web') NOT NULL,
  `token`          VARCHAR(512)  NOT NULL,
  `ultimo_acesso`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `criado_em`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_sessao`),
  CONSTRAINT `fk_sessao_usuario`
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Dispositivos e sessões ativas por usuário';

-- =============================================================
-- Módulo 6 — ORGANIZAÇÃO
-- Tabela: categoria
-- Padrão do sistema (id_usuario NULL) ou personalizada pelo usuário
-- =============================================================
CREATE TABLE IF NOT EXISTS `categoria` (
  `id_categoria`   INT          NOT NULL AUTO_INCREMENT,
  `id_usuario`     INT          NULL                            COMMENT 'NULL = categoria padrão do sistema',
  `nome_categoria` VARCHAR(80)  NOT NULL,
  `icone`          VARCHAR(50)  NULL,
  `criado_em`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_categoria`),
  CONSTRAINT `fk_categoria_usuario`
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Categorias de produto — padrão + personalizáveis';

-- =============================================================
-- Módulo 6 — ORGANIZAÇÃO
-- Tabela: local_armazenamento
-- Padrão do sistema (id_usuario NULL) ou personalizado pelo usuário
-- =============================================================
CREATE TABLE IF NOT EXISTS `local_armazenamento` (
  `id_local`   INT         NOT NULL AUTO_INCREMENT,
  `id_usuario` INT         NULL                                 COMMENT 'NULL = local padrão do sistema',
  `nome_local` VARCHAR(80) NOT NULL,
  `icone`      VARCHAR(50) NULL,
  `criado_em`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_local`),
  CONSTRAINT `fk_local_usuario`
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Locais de armazenamento — padrão + personalizáveis';

-- =============================================================
-- Módulo 7 — SUGESTÕES INTELIGENTES
-- Tabela: sugestao_prazo
-- Base de alimentos comuns com prazos pré-definidos
-- =============================================================
CREATE TABLE IF NOT EXISTS `sugestao_prazo` (
  `id_sugestao`   INT          NOT NULL AUTO_INCREMENT,
  `nome_alimento` VARCHAR(150) NOT NULL,
  `prazo_dias`    SMALLINT     NOT NULL                         COMMENT 'Prazo sugerido em dias (1–365)',
  `id_categoria`  INT          NULL,
  PRIMARY KEY (`id_sugestao`),
  CONSTRAINT `chk_sugestao_prazo` CHECK (`prazo_dias` BETWEEN 1 AND 365),
  CONSTRAINT `fk_sugestao_categoria`
    FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Base de sugestões automáticas de prazo por alimento';

-- =============================================================
-- Módulos 2, 3, 4 — CADASTRO / VALIDADE / DASHBOARD
-- Tabela: produto
-- Regras:
--   • prazo_validade entre 1 e 365 dias
--   • data_abertura não pode ser futura
--   • status calculado automaticamente via trigger
--   • id_produto_origem para duplicação rápida
--   • sincronizado / atualizado_local para sync offline
-- =============================================================
CREATE TABLE IF NOT EXISTS `produto` (
  `id_produto`        INT           NOT NULL AUTO_INCREMENT,
  `id_usuario`        INT           NOT NULL,
  `id_categoria`      INT           NULL,
  `id_local`          INT           NULL,
  `id_produto_origem` INT           NULL                        COMMENT 'Preenchido ao duplicar produto (Módulo 2)',
  `nome_produto`      VARCHAR(150)  NOT NULL,
  `codigo_barras`     VARCHAR(50)   NULL                        COMMENT 'Leitura via câmera (Módulo 2)',
  `data_abertura`     DATE          NOT NULL                    COMMENT 'Não pode ser data futura',
  `prazo_validade`    SMALLINT      NOT NULL                    COMMENT 'Dias pós-abertura (1–365)',
  `data_vencimento`   DATE          NOT NULL                    COMMENT 'Calculada: abertura + prazo (trigger)',
  `status`            ENUM('ok','atencao','vence_hoje','vencido') NOT NULL DEFAULT 'ok' COMMENT 'Atualizado a meia-noite',
  `observacao`        TEXT          NULL,
  -- Sincronização offline (Módulo 10)
  `sincronizado`      TINYINT(1)    NOT NULL DEFAULT 0          COMMENT '0 = pendente sync, 1 = sincronizado',
  `atualizado_local`  DATETIME      NULL                        COMMENT 'Timestamp da última edição offline',
  `criado_em`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_produto`),
  CONSTRAINT `chk_prazo_validade`   CHECK (`prazo_validade` BETWEEN 1 AND 365),
  CONSTRAINT `chk_data_abertura`    CHECK (`data_abertura` <= CURRENT_DATE),
  CONSTRAINT `fk_produto_usuario`
    FOREIGN KEY (`id_usuario`)       REFERENCES `usuario` (`id_usuario`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_produto_categoria`
    FOREIGN KEY (`id_categoria`)     REFERENCES `categoria` (`id_categoria`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_produto_local`
    FOREIGN KEY (`id_local`)         REFERENCES `local_armazenamento` (`id_local`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_produto_origem`
    FOREIGN KEY (`id_produto_origem`) REFERENCES `produto` (`id_produto`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Produto cadastrado após abertura';

-- =============================================================
-- Módulo 5 — NOTIFICAÇÕES
-- Tabela: notificacao
-- Alertas configuráveis por produto ou globais
-- Tipos: antes_vencimento, dia_vencimento, produto_vencido
-- =============================================================
CREATE TABLE IF NOT EXISTS `notificacao` (
  `id_notificacao`  INT        NOT NULL AUTO_INCREMENT,
  `id_usuario`      INT        NOT NULL,
  `id_produto`      INT        NULL                             COMMENT 'NULL = configuração global',
  `tipo`            ENUM('antes_vencimento','dia_vencimento','produto_vencido') NOT NULL DEFAULT 'antes_vencimento',
  `dias_alerta`     TINYINT    NOT NULL DEFAULT 3               COMMENT 'X dias antes do vencimento',
  `horario_envio`   TIME       NOT NULL DEFAULT '08:00:00',
  `ativo`           TINYINT(1) NOT NULL DEFAULT 1,
  `criado_em`       DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`   DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_notificacao`),
  CONSTRAINT `fk_notificacao_usuario`
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_notificacao_produto`
    FOREIGN KEY (`id_produto`) REFERENCES `produto` (`id_produto`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Alertas push — globais e por produto';

-- =============================================================
-- Módulo 8 — HISTÓRICO
-- Tabela: historico
-- Regra: produto vencido só pode ser DESCARTADO
-- Exportação CSV/PDF controlada pelos campos exportado_*
-- =============================================================
CREATE TABLE IF NOT EXISTS `historico` (
  `id_historico`    INT      NOT NULL AUTO_INCREMENT,
  `id_produto`      INT      NOT NULL,
  `id_usuario`      INT      NOT NULL,
  `data_acao`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tipo`            ENUM('consumido','descartado') NOT NULL      COMMENT 'Vencido = somente descartado',
  `estava_vencido`  TINYINT(1) NOT NULL DEFAULT 0               COMMENT '1 = produto já estava vencido na ação',
  -- Exportação de histórico (Módulo 8)
  `exportado_csv`   TINYINT(1) NOT NULL DEFAULT 0,
  `exportado_pdf`   TINYINT(1) NOT NULL DEFAULT 0,
  `exportado_em`    DATETIME   NULL,
  PRIMARY KEY (`id_historico`),
  -- Garante que produto vencido só pode ser descartado
  CONSTRAINT `chk_vencido_descartado`
    CHECK (
      `estava_vencido` = 0
      OR (`estava_vencido` = 1 AND `tipo` = 'descartado')
    ),
  CONSTRAINT `fk_historico_produto`
    FOREIGN KEY (`id_produto`) REFERENCES `produto` (`id_produto`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_historico_usuario`
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Registro de produtos consumidos ou descartados';

-- =============================================================
-- ÍNDICES para performance
-- =============================================================
CREATE INDEX `idx_produto_usuario`      ON `produto`       (`id_usuario`);
CREATE INDEX `idx_produto_vencimento`   ON `produto`       (`data_vencimento`);
CREATE INDEX `idx_produto_status`       ON `produto`       (`status`);
CREATE INDEX `idx_produto_sync`         ON `produto`       (`sincronizado`);
CREATE INDEX `idx_historico_usuario`    ON `historico`     (`id_usuario`);
CREATE INDEX `idx_historico_data`       ON `historico`     (`data_acao`);
CREATE INDEX `idx_notificacao_usuario`  ON `notificacao`   (`id_usuario`);
CREATE INDEX `idx_sugestao_nome`        ON `sugestao_prazo`(`nome_alimento`);
CREATE INDEX `idx_produto_nome`         ON `produto`       (`nome_produto`);  -- busca com autocompletar (Módulo 4)

-- =============================================================
-- TRIGGER: limita família a 6 membros (Módulo 1)
-- =============================================================
DELIMITER $$

CREATE TRIGGER `trg_limite_familia`
BEFORE INSERT ON `usuario`
FOR EACH ROW
BEGIN
  DECLARE total INT;
  IF NEW.id_familia IS NOT NULL THEN
    SELECT COUNT(*) INTO total FROM `usuario` WHERE `id_familia` = NEW.id_familia;
    IF total >= 6 THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'A família já atingiu o limite de 6 membros.';
    END IF;
  END IF;
END$$

-- =============================================================
-- TRIGGER: calcula data_vencimento e status no INSERT (Módulo 3)
-- =============================================================
CREATE TRIGGER `trg_produto_before_insert`
BEFORE INSERT ON `produto`
FOR EACH ROW
BEGIN
  SET NEW.data_vencimento = DATE_ADD(NEW.data_abertura, INTERVAL NEW.prazo_validade DAY);
  SET NEW.status = CASE
    WHEN NEW.data_vencimento < CURDATE()               THEN 'vencido'
    WHEN NEW.data_vencimento = CURDATE()               THEN 'vence_hoje'
    WHEN DATEDIFF(NEW.data_vencimento, CURDATE()) <= 3 THEN 'atencao'
    ELSE 'ok'
  END;
END$$

-- =============================================================
-- TRIGGER: recalcula data_vencimento e status no UPDATE (Módulo 3)
-- =============================================================
CREATE TRIGGER `trg_produto_before_update`
BEFORE UPDATE ON `produto`
FOR EACH ROW
BEGIN
  SET NEW.data_vencimento = DATE_ADD(NEW.data_abertura, INTERVAL NEW.prazo_validade DAY);
  SET NEW.status = CASE
    WHEN NEW.data_vencimento < CURDATE()               THEN 'vencido'
    WHEN NEW.data_vencimento = CURDATE()               THEN 'vence_hoje'
    WHEN DATEDIFF(NEW.data_vencimento, CURDATE()) <= 3 THEN 'atencao'
    ELSE 'ok'
  END;
END$$

DELIMITER ;

-- =============================================================
-- EVENT: recalcula status de todos os produtos a meia-noite (Módulo 3)
-- =============================================================
SET GLOBAL event_scheduler = ON;

DELIMITER $$

CREATE EVENT IF NOT EXISTS `evt_atualizar_status_produtos`
ON SCHEDULE EVERY 1 DAY
STARTS (DATE(NOW()) + INTERVAL 1 DAY)
DO
BEGIN
  UPDATE `produto`
  SET `status` = CASE
    WHEN `data_vencimento` < CURDATE()               THEN 'vencido'
    WHEN `data_vencimento` = CURDATE()               THEN 'vence_hoje'
    WHEN DATEDIFF(`data_vencimento`, CURDATE()) <= 3 THEN 'atencao'
    ELSE 'ok'
  END;
END$$

DELIMITER ;

-- =============================================================
-- DADOS INICIAIS — Categorias padrão (Módulo 6)
-- =============================================================
INSERT INTO `categoria` (`id_usuario`, `nome_categoria`, `icone`) VALUES
  (NULL, 'Laticínios',  '🧀'),
  (NULL, 'Carnes',      '🥩'),
  (NULL, 'Frutas',      '🍎'),
  (NULL, 'Legumes',     '🥦'),
  (NULL, 'Condimentos', '🧂'),
  (NULL, 'Bebidas',     '🧃'),
  (NULL, 'Congelados',  '🧊'),
  (NULL, 'Padaria',     '🍞'),
  (NULL, 'Outros',      '📦');

-- =============================================================
-- DADOS INICIAIS — Locais de armazenamento padrão (Módulo 6)
-- =============================================================
INSERT INTO `local_armazenamento` (`id_usuario`, `nome_local`, `icone`) VALUES
  (NULL, 'Geladeira', '❄️'),
  (NULL, 'Freezer',   '🧊'),
  (NULL, 'Armário',   '🗄️'),
  (NULL, 'Bancada',   '🍽️');

-- =============================================================
-- DADOS INICIAIS — Sugestões de prazo (Módulo 7)
-- =============================================================
INSERT INTO `sugestao_prazo` (`nome_alimento`, `prazo_dias`, `id_categoria`) VALUES
  ('Leite integral',         3,  1),
  ('Iogurte natural',        7,  1),
  ('Queijo fatiado',         5,  1),
  ('Manteiga',               30, 1),
  ('Frango cru',             2,  2),
  ('Carne bovina',           3,  2),
  ('Linguiça',               5,  2),
  ('Maçã cortada',           3,  3),
  ('Banana descascada',      2,  3),
  ('Morango',                5,  3),
  ('Molho de tomate aberto', 5,  5),
  ('Maionese aberta',        30, 5),
  ('Ketchup aberto',         60, 5),
  ('Suco de laranja',        3,  6),
  ('Refrigerante aberto',    3,  6),
  ('Pão de forma',           7,  8),
  ('Bolo caseiro',           5,  8);

-- =============================================================
-- Restaurar configurações originais
-- =============================================================
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
