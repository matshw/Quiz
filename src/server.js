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
let jogadores = [];

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

    let jogador = {
        ws: ws,
        nome: '',
        pontuacao: 0,
        nivel: 0,
        pronto: false
    };

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'reiniciar') {
            jogadores.forEach(jogador => {
                jogador.pontuacao = 0;
                jogador.nivel = 0;
                jogador.pronto = false;
            });
            broadcast({ type: 'reiniciar' });
        } else if (data.type === 'login') {
            const nomeUsuario = data.username;
            if (usuariosRegistrados.includes(nomeUsuario) && !jogadores.find(j => j.nome === nomeUsuario)) {
                jogador.nome = nomeUsuario;
                jogadores.push(jogador);
                broadcast({
                    type: 'novo_jogador',
                    nome: nomeUsuario,
                    jogadores: jogadores.map(j => j.nome)
                });
            } else {
                ws.send(JSON.stringify({ type: 'error', message: 'Usuário não registrado ou já está no jogo!' }));
            }
        } else if (data.type === 'pronto') {
            jogador.pronto = true;
            if (jogadores.every(j => j.pronto)) {
                broadcast({ type: 'inicio_quiz', questao: questoes[0] });
            }
        } else if (data.type === 'resposta') {
            const respostaUsuario = data.resposta;
            const questao = questoes[jogador.nivel];

            if (questao && respostaUsuario === questao.resposta) {
                jogador.pontuacao += questao.pontos;
            }

            jogador.nivel++;
            if (jogador.nivel < questoes.length) {
                ws.send(JSON.stringify({
                    type: 'questao',
                    questao: questoes[jogador.nivel],
                    pontuacao: jogador.pontuacao
                }));
            } else {
                jogador.pronto = false;
                if (jogadores.every(j => j.nivel >= questoes.length)) {
                    broadcast({
                        type: 'end',
                        ranking: jogadores.map(j => ({
                            nome: j.nome,
                            pontuacao: j.pontuacao
                        })).sort((a, b) => b.pontuacao - a.pontuacao)
                    });
                }
            }
        }
    });

    ws.on('close', () => {
        console.log('Cliente desconectado!');
        jogadores = jogadores.filter(j => j.ws !== ws);
        broadcast({
            type: 'jogador_saiu',
            nome: jogador.nome,
            jogadores: jogadores.map(j => j.nome)
        });
    });
});

function broadcast(data) {
    jogadores.forEach(jogador => {
        jogador.ws.send(JSON.stringify(data));
    });
}

server.listen(port, () => {
    console.log(`Servidor rodando na porta http://localhost:${port}`);
});
