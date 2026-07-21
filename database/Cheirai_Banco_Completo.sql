-- Cheiraí Database
CREATE DATABASE IF NOT EXISTS cheirai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cheirai;

SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS historico,produto,sugestao_prazo,local_armazenamento,categoria,usuario;
SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE usuario(
 id INT AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(120) NOT NULL,
 email VARCHAR(150) NOT NULL UNIQUE,
 senha VARCHAR(255) NOT NULL,
 criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE categoria(
 id INT AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(80) NOT NULL,
 icone VARCHAR(80),
 criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE local_armazenamento(
 id INT AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(80) NOT NULL,
 icone VARCHAR(80),
 criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE produto(
 id INT AUTO_INCREMENT PRIMARY KEY,
 id_usuario INT NOT NULL,
 id_categoria INT,
 id_local INT,
 nome VARCHAR(150) NOT NULL,
 data_abertura DATE NOT NULL,
 prazo_validade INT NOT NULL,
 data_vencimento DATE,
 status ENUM('ok','atencao','vence_hoje','vencido') DEFAULT 'ok',
 codigo_barras VARCHAR(64),
 observacao TEXT,
 criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(id_usuario) REFERENCES usuario(id),
 FOREIGN KEY(id_categoria) REFERENCES categoria(id),
 FOREIGN KEY(id_local) REFERENCES local_armazenamento(id)
);

CREATE TABLE historico(
 id INT AUTO_INCREMENT PRIMARY KEY,
 id_produto INT NOT NULL,
 id_usuario INT NOT NULL,
 tipo ENUM('consumido','descartado') NOT NULL,
 estava_vencido BOOLEAN DEFAULT FALSE,
 data_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(id_produto) REFERENCES produto(id),
 FOREIGN KEY(id_usuario) REFERENCES usuario(id)
);

CREATE TABLE sugestao_prazo(
 id INT AUTO_INCREMENT PRIMARY KEY,
 nome_alimento VARCHAR(120) NOT NULL,
 prazo_dias INT NOT NULL,
 id_categoria INT,
 FOREIGN KEY(id_categoria) REFERENCES categoria(id)
);

DELIMITER //
CREATE TRIGGER trg_produto_bi BEFORE INSERT ON produto
FOR EACH ROW
BEGIN
 SET NEW.data_vencimento=DATE_ADD(NEW.data_abertura,INTERVAL NEW.prazo_validade DAY);
 IF NEW.data_vencimento<CURDATE() THEN SET NEW.status='vencido';
 ELSEIF NEW.data_vencimento=CURDATE() THEN SET NEW.status='vence_hoje';
 ELSEIF DATEDIFF(NEW.data_vencimento,CURDATE())<=3 THEN SET NEW.status='atencao';
 ELSE SET NEW.status='ok';
 END IF;
END//
CREATE TRIGGER trg_produto_bu BEFORE UPDATE ON produto
FOR EACH ROW
BEGIN
 SET NEW.data_vencimento=DATE_ADD(NEW.data_abertura,INTERVAL NEW.prazo_validade DAY);
END//
CREATE TRIGGER trg_hist_bi BEFORE INSERT ON historico
FOR EACH ROW
BEGIN
 DECLARE st ENUM('ok','atencao','vence_hoje','vencido');
 SELECT status INTO st FROM produto WHERE id=NEW.id_produto;
 SET NEW.estava_vencido=(st='vencido');
 IF st='vencido' AND NEW.tipo='consumido' THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Produto vencido só pode ser descartado';
 END IF;
END//
CREATE EVENT IF NOT EXISTS ev_status_diario
ON SCHEDULE EVERY 1 DAY STARTS TIMESTAMP(CURRENT_DATE)+INTERVAL 1 DAY
DO
UPDATE produto SET status=
CASE
WHEN data_vencimento<CURDATE() THEN 'vencido'
WHEN data_vencimento=CURDATE() THEN 'vence_hoje'
WHEN DATEDIFF(data_vencimento,CURDATE())<=3 THEN 'atencao'
ELSE 'ok' END;//
DELIMITER ;

INSERT INTO categoria(nome,icone) VALUES
('Laticínios','milk'),('Carnes','meat'),('Frutas','apple'),('Legumes','carrot'),
('Condimentos','spice'),('Bebidas','drink'),('Congelados','snow'),
('Padaria','bread'),('Outros','box');

INSERT INTO local_armazenamento(nome,icone) VALUES
('Geladeira','fridge'),('Freezer','freezer'),('Armário','cabinet'),('Bancada','counter');

INSERT INTO sugestao_prazo(nome_alimento,prazo_dias,id_categoria) VALUES
('Leite',3,1),('Queijo',7,1),('Iogurte',5,1),('Manteiga',30,1),
('Frango cozido',3,2),('Carne bovina',3,2),('Peixe',2,2),('Presunto',5,2),
('Maçã',15,3),('Banana',5,3),('Laranja',10,3),('Morango',3,3),
('Tomate',7,4),('Alface',5,4),('Cenoura',15,4),('Brócolis',5,4),
('Maionese aberta',30,5),('Mostarda',90,5),('Ketchup',90,5),('Molho de tomate',5,5),
('Suco',5,6),('Pão',4,8);
