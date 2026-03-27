import { WebSocketServer } from 'ws';
import { config } from '../lib/config';
import { logger } from '../lib/logger';
import { handleConnection } from './ws-handler';

const wss = new WebSocketServer({ port: config.WS_PORT });
const serverLogger = logger.child({ component: 'ws-server' });

wss.on('connection', handleConnection);

wss.on('listening', () => {
  serverLogger.info({ port: config.WS_PORT }, 'WebSocket server listening');
});

wss.on('error', (error: Error) => {
  if ((error as NodeJS.ErrnoException).code === 'EADDRINUSE') {
    serverLogger.fatal({ port: config.WS_PORT }, 'Port already in use');
    process.exit(1);
  }
  serverLogger.error({ error: error.message }, 'WebSocket server error');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  serverLogger.info('Shutting down WebSocket server');
  wss.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  serverLogger.info('Shutting down WebSocket server');
  wss.close(() => process.exit(0));
});
