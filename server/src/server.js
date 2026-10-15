import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`BlockFind API running at http://localhost:${PORT}`);
});

server.on('error', (error) => {
  console.error('Server failed to start:', error);
});