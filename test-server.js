const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'Test server is working!',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5000
  }));
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, 'localhost', () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📊 Test endpoint: http://localhost:${PORT}/`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`💡 Port ${PORT} is already in use.`);
  }
  process.exit(1);
});

