const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/message' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Hello, world!' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const port = 3000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
