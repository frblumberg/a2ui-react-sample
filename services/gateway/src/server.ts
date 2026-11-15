import {createServer} from 'node:http';
import {createGateway} from './app';

const port = Number(process.env.PORT ?? 8787);
createServer(createGateway()).listen(port, () => {
  console.log(`Agent-Gateway läuft auf http://localhost:${port}`);
});
