const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = 3000;

// Configuração do banco de dados MySQL
const db = mysql.createConnection({
    host: 'localhost', // ou o IP do seu servidor MySQL
    user: 'root',      // seu usuário do MySQL
    password: 'root',  // sua senha do MySQL
    database: 'guara_viagens',
    port: 3306
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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configurar sessões
app.use(session({
    secret: 'sua_chave_secreta_aqui', // altere para uma string secreta forte
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // usar true se estiver com HTTPS
}));

// Servir arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));

/* =========================================
   ROTAS PARA AS PÁGINAS HTML
   ========================================= */

// Página de cadastro de usuário (ex.: cadastro-usuario.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'cadastro-usuario.html'));
});

app.get('/cadastro-usuario.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'cadastro-usuario.html'));
});

// Página de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'login.html'));
});

// Página inicial (index)
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'index.html'));
});

// Página de cadastro de viagens
app.get('/cadastro-viagem.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'cadastro-viagem.html'));
});

// Página de edição de viagens
app.get('/editar-viagem.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'editar-viagem.html'));
});


/* =========================================
   ROTAS DE USUÁRIOS (LOGIN E CADASTRO)
   ========================================= */

// Rota de login: valida e, se correto, salva o usuário na sessão
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
        // Salva o usuário na sessão
        req.session.user = results[0];
        res.json({ message: 'Login efetuado com sucesso!', user: results[0] });
    });
});

// Rota de cadastro de usuário com verificação de duplicidade
app.post('/cadastrar', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.redirect('/'); // volta para a página de cadastro se faltar algum campo
    }
    const sqlCheck = "SELECT * FROM usuarios WHERE username = ?";
    db.query(sqlCheck, [username], (err, results) => {
        if (err) {
            console.error("Erro ao consultar o usuário:", err);
            return res.redirect('/');
        }
        if (results.length > 0) {
            console.log("Usuário já existe!");
            return res.redirect('/');
        }
        const sqlInsert = "INSERT INTO usuarios (username, password) VALUES (?, ?)";
        db.query(sqlInsert, [username, password], (err, result) => {
            if (!err) {
                console.log("Dados Inseridos Com Sucesso!");
                // Configura a sessão do usuário com as informações recém inseridas
                req.session.user = {
                    id: result.insertId,
                    username: username
                    // Evite armazenar a senha em sessão por questões de segurança
                };
                // Redireciona para o index já logado
                res.redirect('/index');
            } else {
                console.log("Não Foi Possivel Inserir os Dados!", err);
                res.redirect('/');
            }
        });
    });
});
/* =========================================
   ROTAS DE VIAGENS (Usando Sessão)
   ========================================= */

// Listar as 6 próximas viagens do usuário logado (ordenadas pela data)
app.get('/viagens', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Não autorizado' });
    }
    const usuario_id = req.session.user.id;
    // Retorna as próximas 6 viagens (as mais próximas primeiro)
    const sql = 'SELECT * FROM viagens WHERE usuario_id = ? ORDER BY data_viagem ASC LIMIT 6';
    db.query(sql, [usuario_id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar viagens:', err);
            return res.status(500).json({ error: 'Erro no servidor' });
        }
        res.json(results);
    });
});

// Inserir uma nova viagem para o usuário logado
app.post('/add-viagem', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Não autorizado' });
    }
    const { destino, data_viagem, preco, vagas } = req.body;
    const usuario_id = req.session.user.id;
    if (!destino || !data_viagem || !preco || !vagas) {
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

// Excluir uma viagem (do usuário logado)
app.delete('/viagem/:id', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Não autorizado' });
    }
    const { id } = req.params;
    const usuario_id = req.session.user.id;
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

// Atualizar uma viagem (do usuário logado)
app.put('/viagem/:id', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Não autorizado' });
    }
    const { id } = req.params;
    const { destino, data_viagem, preco, vagas } = req.body;
    const usuario_id = req.session.user.id;
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
    console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});
