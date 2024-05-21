const WebSocket = require('ws');

const port = 8080;
const server = new WebSocket.Server({ port });

server.on('connection', (ws) => {
    console.log('Novo cliente conectado');

    ws.on('message', (message) => {
        console.log(`Mensagem recebida: ${message}`);
        server.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('Cliente desconectado');
    });

    ws.send('Bem-vindo ao servidor WebSocket!');
});

console.log(`Servidor WebSocket está rodando na porta ${port}`);