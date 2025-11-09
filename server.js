const net = require('net');

const DEFAULT_PORT = Number(process.env.PORT) || 4000;
const MAX_BUFFER = 8 * 1024; 
const clients = new Map();

function send(socket, message) {
  socket.write(message + '\n');
}

function broadcast(message, exceptSocket) {
  for (const socket of clients.keys()) {
    if (socket !== exceptSocket) {
      send(socket, message);
    }
  }
}

function usernameTaken(name) {
  for (const info of clients.values()) {
    if (info.username && info.username.toLowerCase() === name.toLowerCase()) {
      return true;
    }
  }
  return false;
}

function handleLogin(socket, rawLine) {
  const parts = rawLine.split(/\s+/);
  parts.shift(); 
  const username = parts.join(' ').trim();

  if (!username) {
    send(socket, 'ERR invalid-username');
    return;
  }

  if (usernameTaken(username)) {
    send(socket, 'ERR username-taken');
    return;
  }

  const client = clients.get(socket);
  client.username = username;

  send(socket, 'OK');
  broadcast(`INFO ${username} connected`, socket);
}

function handleLoggedIn(socket, line) {
  const client = clients.get(socket);
  const upper = line.split(/\s+/)[0].toUpperCase();

  if (upper === 'MSG') {
    const text = line.slice(3).trim();
    if (!text) {
      send(socket, 'ERR empty-message');
      return;
    }

    const payload = `MSG ${client.username} ${text}`;
    for (const [otherSocket] of clients) {
      send(otherSocket, payload);
    }
    return;
  }

  if (upper === 'WHO') {
    for (const info of clients.values()) {
      if (info.username) {
        send(socket, `USER ${info.username}`);
      }
    }
    return;
  }

  if (upper === 'PING') {
    send(socket, 'PONG');
    return;
  }

  send(socket, 'ERR unknown-command');
}

function handleLine(socket, rawLine) {
  const line = rawLine.replace(/\r?\n/g, '').trim();
  if (!line) {
    return;
  }

  const client = clients.get(socket);
  if (!client) {
    return;
  }

  if (!client.username) {
    if (line.toUpperCase().startsWith('LOGIN ')) {
      handleLogin(socket, line);
    } else {
      send(socket, 'ERR not-logged-in');
    }
    return;
  }

  handleLoggedIn(socket, line);
}

const server = net.createServer((socket) => {
  socket.setEncoding('utf8');
  clients.set(socket, { username: '', buffer: '' });

  socket.on('data', (chunk) => {
    const client = clients.get(socket);
    if (!client) return;

    client.buffer += chunk;
    let newlineIndex;

    while ((newlineIndex = client.buffer.indexOf('\n')) >= 0) {
      const rawLine = client.buffer.slice(0, newlineIndex);
      client.buffer = client.buffer.slice(newlineIndex + 1);

      handleLine(socket, rawLine);
    }

    if (client.buffer.length > MAX_BUFFER) {
      clients.delete(socket);
      socket.destroy();
    }
  });

  socket.on('close', () => {
    const client = clients.get(socket);
    if (!client) return;
    clients.delete(socket);

    if (client.username) {
      broadcast(`INFO ${client.username} disconnected`, socket);
    }
  });

  socket.on('error', () => {
    socket.destroy();
  });
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

server.listen(DEFAULT_PORT, () => {
  console.log(`TCP chat server listening on port ${DEFAULT_PORT}`);
});
 
