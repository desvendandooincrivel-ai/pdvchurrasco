-- Tabela de Produtos Globais (Base compartilhada)
CREATE TABLE produtos_globais (
    codigo_barras VARCHAR(50) PRIMARY KEY,
    nome_padrao VARCHAR(255) NOT NULL,
    marca VARCHAR(100),
    categoria VARCHAR(100),
    validado BOOLEAN DEFAULT false,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserindo alguns dados iniciais
INSERT INTO produtos_globais (codigo_barras, nome_padrao, categoria, validado) VALUES
('7891010101010', 'COCA COLA LATA 350ML', 'Bebidas', true),
('7892020202020', 'CERVEJA HEINEKEN LATA 350ML', 'Bebidas', true);

-- Tabela de Produtos do Cliente (Específico por Tenant/Usuário)
CREATE TABLE produtos_cliente (
    id SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL, -- Referência ao Tenant (SaaS)
    codigo_barras VARCHAR(50) REFERENCES produtos_globais(codigo_barras),
    nome_personalizado VARCHAR(255),
    preco DECIMAL(10, 2) NOT NULL,
    custo DECIMAL(10, 2),
    estoque INT DEFAULT 0,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_cliente, codigo_barras)
);
