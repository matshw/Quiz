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

fs.readFile(path.join(__dirname, '../public/quiz.json'), 'utf8', (err, data) => {
    if (err) {
        console.error('erro ao ler perguntas', err);
        return;
    }
    questoes = JSON.parse(data);
});

wss.on('connection', (ws) => {
    console.log('Cliente conectado!');

    let nivel = 0;
    let pontuacao = 0;

    ws.send(JSON.stringify({
        type: 'questao',
        questao: questoes[nivel]
    }));

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'resposta') {
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
    console.log(`servidor rodando na porta http://localhost:${port}`);
});
