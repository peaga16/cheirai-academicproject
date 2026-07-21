-- =============================================================
-- CHEIRAÍ — Modelo ER Completo e executável (v2.1)
-- MySQL 8.0+
-- Baseado no modelo ER e nos requisitos fornecidos pelo projeto.
-- =============================================================

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

DROP SCHEMA IF EXISTS `cheirai`;
CREATE SCHEMA `cheirai` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `cheirai`;

CREATE TABLE `familia` (
  `id_familia` INT NOT NULL AUTO_INCREMENT,
  `nome_familia` VARCHAR(100) NOT NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_familia`)
) ENGINE=InnoDB COMMENT='Grupo familiar compartilhado com até 6 membros';

CREATE TABLE `usuario` (
  `id_usuario` INT NOT NULL AUTO_INCREMENT,
  `id_familia` INT NULL,
  `nome` VARCHAR(120) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `senha` VARCHAR(255) NULL COMMENT 'NULL quando o acesso for exclusivamente social',
  `idioma` ENUM('pt','en','es') NOT NULL DEFAULT 'pt',
  `tema` ENUM('claro','escuro','automatico') NOT NULL DEFAULT 'automatico',
  `google_id` VARCHAR(255) NULL,
  `apple_id` VARCHAR(255) NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `uq_usuario_email` (`email`),
  UNIQUE KEY `uq_usuario_google` (`google_id`),
  UNIQUE KEY `uq_usuario_apple` (`apple_id`),
  CONSTRAINT `fk_usuario_familia` FOREIGN KEY (`id_familia`)
    REFERENCES `familia` (`id_familia`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Conta do usuário';

CREATE TABLE `sessao` (
  `id_sessao` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `dispositivo` VARCHAR(200) NOT NULL,
  `plataforma` ENUM('ios','android','web') NOT NULL,
  `token` VARCHAR(512) NOT NULL,
  `ultimo_acesso` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_sessao`),
  CONSTRAINT `fk_sessao_usuario` FOREIGN KEY (`id_usuario`)
    REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Dispositivos e sessões ativas';

CREATE TABLE `categoria` (
  `id_categoria` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NULL COMMENT 'NULL = categoria padrão',
  `nome_categoria` VARCHAR(80) NOT NULL,
  `icone` VARCHAR(50) NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_categoria`),
  CONSTRAINT `fk_categoria_usuario` FOREIGN KEY (`id_usuario`)
    REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Categorias padrão e personalizadas';

CREATE TABLE `local_armazenamento` (
  `id_local` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NULL COMMENT 'NULL = local padrão',
  `nome_local` VARCHAR(80) NOT NULL,
  `icone` VARCHAR(50) NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_local`),
  CONSTRAINT `fk_local_usuario` FOREIGN KEY (`id_usuario`)
    REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Locais padrão e personalizados';

CREATE TABLE `sugestao_prazo` (
  `id_sugestao` INT NOT NULL AUTO_INCREMENT,
  `nome_alimento` VARCHAR(150) NOT NULL,
  `prazo_dias` SMALLINT NOT NULL,
  `id_categoria` INT NULL,
  PRIMARY KEY (`id_sugestao`),
  CONSTRAINT `chk_sugestao_prazo` CHECK (`prazo_dias` BETWEEN 1 AND 365),
  CONSTRAINT `fk_sugestao_categoria` FOREIGN KEY (`id_categoria`)
    REFERENCES `categoria` (`id_categoria`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Sugestões automáticas de prazo';

CREATE TABLE `produto` (
  `id_produto` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `id_categoria` INT NOT NULL,
  `id_local` INT NOT NULL,
  `id_produto_origem` INT NULL COMMENT 'Produto que originou uma duplicação rápida',
  `nome_produto` VARCHAR(150) NOT NULL,
  `codigo_barras` VARCHAR(50) NULL,
  `data_abertura` DATE NOT NULL,
  `prazo_validade` SMALLINT NOT NULL,
  `data_vencimento` DATE NOT NULL,
  `status` ENUM('ok','atencao','vence_hoje','vencido') NOT NULL DEFAULT 'ok',
  `observacao` TEXT NULL,
  `sincronizado` TINYINT(1) NOT NULL DEFAULT 0,
  `atualizado_local` DATETIME NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_produto`),
  CONSTRAINT `chk_prazo_validade` CHECK (`prazo_validade` BETWEEN 1 AND 365),
  CONSTRAINT `fk_produto_usuario` FOREIGN KEY (`id_usuario`)
    REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_produto_categoria` FOREIGN KEY (`id_categoria`)
    REFERENCES `categoria` (`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_produto_local` FOREIGN KEY (`id_local`)
    REFERENCES `local_armazenamento` (`id_local`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_produto_origem` FOREIGN KEY (`id_produto_origem`)
    REFERENCES `produto` (`id_produto`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Produto cadastrado após a abertura';

CREATE TABLE `notificacao` (
  `id_notificacao` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `id_produto` INT NULL COMMENT 'NULL = preferência global',
  `tipo` ENUM('antes_vencimento','dia_vencimento','produto_vencido') NOT NULL DEFAULT 'antes_vencimento',
  `dias_alerta` TINYINT NOT NULL DEFAULT 3,
  `horario_envio` TIME NOT NULL DEFAULT '08:00:00',
  `ativo` TINYINT(1) NOT NULL DEFAULT 1,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_notificacao`),
  CONSTRAINT `chk_dias_alerta` CHECK (`dias_alerta` BETWEEN 0 AND 30),
  CONSTRAINT `fk_notificacao_usuario` FOREIGN KEY (`id_usuario`)
    REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_notificacao_produto` FOREIGN KEY (`id_produto`)
    REFERENCES `produto` (`id_produto`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Alertas globais e por produto';

CREATE TABLE `historico` (
  `id_historico` INT NOT NULL AUTO_INCREMENT,
  `id_produto` INT NOT NULL,
  `id_usuario` INT NOT NULL,
  `data_acao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tipo` ENUM('consumido','descartado') NOT NULL,
  `estava_vencido` TINYINT(1) NOT NULL DEFAULT 0,
  `exportado_csv` TINYINT(1) NOT NULL DEFAULT 0,
  `exportado_pdf` TINYINT(1) NOT NULL DEFAULT 0,
  `exportado_em` DATETIME NULL,
  PRIMARY KEY (`id_historico`),
  UNIQUE KEY `uq_historico_produto` (`id_produto`),
  CONSTRAINT `chk_vencido_descartado` CHECK (
    `estava_vencido` = 0 OR (`estava_vencido` = 1 AND `tipo` = 'descartado')
  ),
  CONSTRAINT `fk_historico_produto` FOREIGN KEY (`id_produto`)
    REFERENCES `produto` (`id_produto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_historico_usuario` FOREIGN KEY (`id_usuario`)
    REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Registro de consumo e descarte';

CREATE INDEX `idx_produto_usuario` ON `produto` (`id_usuario`);
CREATE INDEX `idx_produto_vencimento` ON `produto` (`data_vencimento`);
CREATE INDEX `idx_produto_status` ON `produto` (`status`);
CREATE INDEX `idx_produto_nome` ON `produto` (`nome_produto`);
CREATE INDEX `idx_produto_sync` ON `produto` (`sincronizado`);
CREATE INDEX `idx_historico_usuario` ON `historico` (`id_usuario`);
CREATE INDEX `idx_historico_data` ON `historico` (`data_acao`);
CREATE INDEX `idx_notificacao_usuario` ON `notificacao` (`id_usuario`);
CREATE INDEX `idx_sugestao_nome` ON `sugestao_prazo` (`nome_alimento`);

DELIMITER $$

CREATE TRIGGER `trg_limite_familia_insert`
BEFORE INSERT ON `usuario`
FOR EACH ROW
BEGIN
  DECLARE total INT DEFAULT 0;
  IF NEW.id_familia IS NOT NULL THEN
    SELECT COUNT(*) INTO total FROM `usuario` WHERE `id_familia` = NEW.id_familia;
    IF total >= 6 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A família já atingiu o limite de 6 membros.';
    END IF;
  END IF;
END$$

CREATE TRIGGER `trg_limite_familia_update`
BEFORE UPDATE ON `usuario`
FOR EACH ROW
BEGIN
  DECLARE total INT DEFAULT 0;
  IF NEW.id_familia IS NOT NULL AND NOT (NEW.id_familia <=> OLD.id_familia) THEN
    SELECT COUNT(*) INTO total FROM `usuario` WHERE `id_familia` = NEW.id_familia;
    IF total >= 6 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A família já atingiu o limite de 6 membros.';
    END IF;
  END IF;
END$$

CREATE TRIGGER `trg_produto_before_insert`
BEFORE INSERT ON `produto`
FOR EACH ROW
BEGIN
  IF NEW.data_abertura > CURDATE() THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A data de abertura não pode ser futura.';
  END IF;
  IF NEW.prazo_validade < 1 OR NEW.prazo_validade > 365 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'O prazo deve estar entre 1 e 365 dias.';
  END IF;
  SET NEW.data_vencimento = DATE_ADD(NEW.data_abertura, INTERVAL NEW.prazo_validade DAY);
  SET NEW.status = CASE
    WHEN NEW.data_vencimento < CURDATE() THEN 'vencido'
    WHEN NEW.data_vencimento = CURDATE() THEN 'vence_hoje'
    WHEN DATEDIFF(NEW.data_vencimento, CURDATE()) <= 3 THEN 'atencao'
    ELSE 'ok'
  END;
END$$

CREATE TRIGGER `trg_produto_before_update`
BEFORE UPDATE ON `produto`
FOR EACH ROW
BEGIN
  IF NEW.data_abertura > CURDATE() THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A data de abertura não pode ser futura.';
  END IF;
  IF NEW.prazo_validade < 1 OR NEW.prazo_validade > 365 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'O prazo deve estar entre 1 e 365 dias.';
  END IF;
  SET NEW.data_vencimento = DATE_ADD(NEW.data_abertura, INTERVAL NEW.prazo_validade DAY);
  SET NEW.status = CASE
    WHEN NEW.data_vencimento < CURDATE() THEN 'vencido'
    WHEN NEW.data_vencimento = CURDATE() THEN 'vence_hoje'
    WHEN DATEDIFF(NEW.data_vencimento, CURDATE()) <= 3 THEN 'atencao'
    ELSE 'ok'
  END;
END$$

CREATE TRIGGER `trg_historico_before_insert`
BEFORE INSERT ON `historico`
FOR EACH ROW
BEGIN
  DECLARE vencido TINYINT DEFAULT 0;
  SELECT data_vencimento < CURDATE() INTO vencido
  FROM `produto` WHERE `id_produto` = NEW.id_produto;
  SET NEW.estava_vencido = vencido;
  IF vencido = 1 AND NEW.tipo = 'consumido' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Produto vencido só pode ser descartado.';
  END IF;
END$$

CREATE EVENT IF NOT EXISTS `evt_atualizar_status_produtos`
ON SCHEDULE EVERY 1 DAY
STARTS (DATE(NOW()) + INTERVAL 1 DAY)
DO
BEGIN
  UPDATE `produto`
  SET `status` = CASE
    WHEN `data_vencimento` < CURDATE() THEN 'vencido'
    WHEN `data_vencimento` = CURDATE() THEN 'vence_hoje'
    WHEN DATEDIFF(`data_vencimento`, CURDATE()) <= 3 THEN 'atencao'
    ELSE 'ok'
  END;
END$$

DELIMITER ;

INSERT INTO `categoria` (`id_usuario`, `nome_categoria`, `icone`) VALUES
  (NULL, 'Laticínios', '🧀'), (NULL, 'Carnes', '🥩'), (NULL, 'Frutas', '🍎'),
  (NULL, 'Legumes', '🥦'), (NULL, 'Condimentos', '🧂'), (NULL, 'Bebidas', '🧃'),
  (NULL, 'Congelados', '🧊'), (NULL, 'Padaria', '🍞'), (NULL, 'Outros', '📦');

INSERT INTO `local_armazenamento` (`id_usuario`, `nome_local`, `icone`) VALUES
  (NULL, 'Geladeira', '❄️'), (NULL, 'Freezer', '🧊'),
  (NULL, 'Armário', '🗄️'), (NULL, 'Bancada', '🍽️');

INSERT INTO `sugestao_prazo` (`nome_alimento`, `prazo_dias`, `id_categoria`) VALUES
  ('Leite integral', 3, 1), ('Iogurte natural', 7, 1), ('Queijo fatiado', 5, 1),
  ('Manteiga', 30, 1), ('Frango cru', 2, 2), ('Carne bovina', 3, 2),
  ('Linguiça', 5, 2), ('Maçã cortada', 3, 3), ('Banana descascada', 2, 3),
  ('Morango', 5, 3), ('Molho de tomate aberto', 5, 5), ('Maionese aberta', 30, 5),
  ('Ketchup aberto', 60, 5), ('Suco de laranja', 3, 6),
  ('Refrigerante aberto', 3, 6), ('Pão de forma', 7, 8), ('Bolo caseiro', 5, 8);

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

-- Para executar a atualização automática diária, habilite o agendador uma vez
-- com um usuário que possua permissão administrativa:
-- SET GLOBAL event_scheduler = ON;
