const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Configuração do banco de dados MySQL
const db = mysql.createConnection({
    host: 'localhost', // ou o IP do seu servidor MySQL
    user: 'root',      // seu usuário do MySQL
    password: 'root',  // sua senha do MySQL
    database: 'guara_viagens'
});

// Conectar ao banco de dados
db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:', err);
        return;
    }
    console.log('Conectado ao MySQL');
});

// Middlewares
app.use(cors());
app.use(bodyParser.json());

/* Rotas de Usuários */

// Cadastro de usuário
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Preencha todos os campos' });
    }
    const checkSql = 'SELECT * FROM usuarios WHERE username = ?';
    db.query(checkSql, [username], (err, results) => {
        if (err) {
            console.error('Erro ao verificar usuário:', err);
            return res.status(500).json({ error: 'Erro no servidor' });
        }
        if (results.length > 0) {
            return res.status(400).json({ error: 'Usuário já cadastrado' });
        }
        const sql = 'INSERT INTO usuarios (username, password) VALUES (?, ?)';
        db.query(sql, [username, password], (err, result) => {
            if (err) {
                console.error('Erro ao cadastrar usuário:', err);
                return res.status(500).json({ error: 'Erro no servidor' });
            }
            res.json({ message: 'Usuário cadastrado com sucesso!', userId: result.insertId });
        });
    });
});

// Login de usuário
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Preencha todos os campos' });
    }
    const sql = 'SELECT * FROM usuarios WHERE username = ? AND password = ?';
    db.query(sql, [username, password], (err, results) => {
        if (err) {
            console.error('Erro no login:', err);
            return res.status(500).json({ error: 'Erro no servidor' });
        }
        if (results.length === 0) {
            return res.status(400).json({ error: 'Usuário ou senha inválidos' });
        }
        res.json({ message: 'Login efetuado com sucesso!', user: results[0] });
    });
});

/* Rotas de Viagens */

// Inserir uma nova viagem (deve receber o campo usuario_id)
app.post('/add-viagem', (req, res) => {
    const { destino, data_viagem, preco, vagas, usuario_id } = req.body;
    if (!destino || !data_viagem || !preco || !vagas || !usuario_id) {
        return res.status(400).json({ error: 'Preencha todos os campos' });
    }
    const sql = 'INSERT INTO viagens (destino, data_viagem, preco, vagas, usuario_id) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [destino, data_viagem, preco, vagas, usuario_id], (err, result) => {
        if (err) {
            console.error('Erro ao inserir viagem:', err);
            return res.status(500).json({ error: 'Erro no servidor' });
        }
        res.json({ message: 'Viagem cadastrada com sucesso!', id: result.insertId });
    });
});

// Listar as viagens de um usuário específico
app.get('/viagens/:usuario_id', (req, res) => {
    const { usuario_id } = req.params;
    const sql = 'SELECT * FROM viagens WHERE usuario_id = ? ORDER BY data_viagem ASC';
    db.query(sql, [usuario_id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar viagens:', err);
            return res.status(500).json({ error: 'Erro no servidor' });
        }
        res.json(results);
    });
});

// Deletar uma viagem (apenas se pertencer ao usuário)
app.delete('/viagem/:id/:usuario_id', (req, res) => {
    const { id, usuario_id } = req.params;
    const sql = 'DELETE FROM viagens WHERE id = ? AND usuario_id = ?';
    db.query(sql, [id, usuario_id], (err, result) => {
        if (err) {
            console.error('Erro ao deletar viagem:', err);
            return res.status(500).json({ error: 'Erro no servidor' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Viagem não encontrada ou não pertence ao usuário' });
        }
        res.json({ message: 'Viagem cancelada com sucesso!' });
    });
});

// Atualizar uma viagem (apenas se pertencer ao usuário)
app.put('/viagem/:id/:usuario_id', (req, res) => {
    const { id, usuario_id } = req.params;
    const { destino, data_viagem, preco, vagas } = req.body;
    if (!destino || !data_viagem || !preco || !vagas) {
        return res.status(400).json({ error: 'Preencha todos os campos' });
    }
    const sql = 'UPDATE viagens SET destino = ?, data_viagem = ?, preco = ?, vagas = ? WHERE id = ? AND usuario_id = ?';
    db.query(sql, [destino, data_viagem, preco, vagas, id, usuario_id], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar viagem:', err);
            return res.status(500).json({ error: 'Erro no servidor' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Viagem não encontrada ou não pertence ao usuário' });
        }
        res.json({ message: 'Viagem atualizada com sucesso!' });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
