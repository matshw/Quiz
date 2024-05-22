const http = require('http');
const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, '../public')));

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

let questoes = [];
let usuariosRegistrados = [];

fs.readFile(path.join(__dirname, '../public/usuarios.json'), 'utf8', (erro, data) => {
    if (erro) {
        console.error('Erro ao ler usuários', erro);
        return;
    }
    usuariosRegistrados = JSON.parse(data);
});

fs.readFile(path.join(__dirname, '../public/quiz.json'), 'utf8', (erro, data) => {
    if (erro) {
        console.error('Erro ao ler perguntas', erro);
        return;
    }
    questoes = JSON.parse(data);
});

wss.on('connection', (ws) => {
    console.log('Cliente conectado!');

    let nivel = 0;
    let pontuacao = 0;
    let authenticated = false;

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'login') {
            const nomeUsuario = data.username;
            if (usuariosRegistrados.includes(nomeUsuario)) {
                authenticated = true;
                ws.send(JSON.stringify({
                    type: 'bemvindo',
                    message: `Bem-vindo ao Quiz, ${nomeUsuario}`
                }));
    
                ws.send(JSON.stringify({
                    type: 'questao',
                    questao: questoes[nivel],
                    pontuacao: pontuacao
                }));
            } else {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Usuário não registrado!'
                }));
            }
        } else if (authenticated && data.type === 'resposta') {
            const respostaUsuario = data.resposta;
            const respostaCerta = questoes[nivel].resposta;

            if (respostaUsuario === respostaCerta) {
                pontuacao += questoes[nivel].pontos;
            }

            nivel++;
            if (nivel < questoes.length) {
                ws.send(JSON.stringify({
                    type: 'questao',
                    questao: questoes[nivel],
                    pontuacao: pontuacao
                }));
            } else {
                ws.send(JSON.stringify({
                    type: 'end',
                    pontuacao: pontuacao
                }));
            }
        }
    });

    ws.on('close', () => {
        console.log('Cliente desconectado!');
    });
});

server.listen(port, () => {
    console.log(`Servidor rodando na porta http://localhost:${port}`);
});
