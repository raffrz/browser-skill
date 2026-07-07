import { app } from '../../server.js';

export function createServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://localhost:${port}` });
    });
  });
}
