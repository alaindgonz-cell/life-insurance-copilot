import { WebSocket } from 'ws';
import { logger } from '../lib/logger';

export function handleConnection(ws: WebSocket): void {
  const childLogger = logger.child({ component: 'ws-handler' });
  childLogger.info('Client connected');

  ws.on('message', (data: Buffer) => {
    childLogger.debug({ size: data.length }, 'Message received');
    // Phase 2 will implement audio stream handling here
  });

  ws.on('close', () => {
    childLogger.info('Client disconnected');
  });

  ws.on('error', (error: Error) => {
    childLogger.error({ error: error.message }, 'WebSocket error');
  });

  // Send acknowledgment
  ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));
}
