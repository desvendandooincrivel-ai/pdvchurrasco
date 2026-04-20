const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do PostgreSQL (ajuste conforme seu ambiente)
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'pdvchurrasco',
  password: 'sua_senha',
  port: 5432,
});

// Buscar produto na base global por código de barras
app.get('/api/global-products/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const result = await pool.query(
      'SELECT * FROM produtos_globais WHERE codigo_barras = $1',
      [barcode]
    );

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Produto não encontrado na base global' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar produto global' });
  }
});

// Cadastrar novo produto na base global (validado = false)
app.post('/api/global-products', async (req, res) => {
  try {
    const { codigo_barras, nome_padrao, marca, categoria } = req.body;
    
    // Nomes padronizados: uppercase e sem múltiplos espaços
    const nomeNormalizado = nome_padrao.toUpperCase().replace(/\s+/g, ' ').trim();

    const result = await pool.query(
      `INSERT INTO produtos_globais (codigo_barras, nome_padrao, marca, categoria, validado)
       VALUES ($1, $2, $3, $4, false)
       ON CONFLICT (codigo_barras) DO NOTHING
       RETURNING *`,
      [codigo_barras, nomeNormalizado, marca, categoria]
    );

    if (result.rows.length > 0) {
      res.status(201).json(result.rows[0]);
    } else {
      res.status(409).json({ message: 'Produto já existe na base global' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao cadastrar produto global' });
  }
});

// Cadastrar produto do cliente
app.post('/api/client-products', async (req, res) => {
  try {
    const { id_cliente, codigo_barras, nome_personalizado, preco, custo, estoque } = req.body;
    
    const result = await pool.query(
      `INSERT INTO produtos_cliente (id_cliente, codigo_barras, nome_personalizado, preco, custo, estoque)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id_cliente, codigo_barras) DO UPDATE 
       SET preco = EXCLUDED.preco, custo = EXCLUDED.custo, estoque = EXCLUDED.estoque
       RETURNING *`,
      [id_cliente, codigo_barras, nome_personalizado, preco, custo, estoque || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao cadastrar produto do cliente' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});
