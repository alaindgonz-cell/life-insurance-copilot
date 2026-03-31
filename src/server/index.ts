import 'dotenv/config';
import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import {
  handleSessionStart,
  handleAudioChunk,
  handleSessionEnd,
} from './audioHandler';
import { config } from '../lib/config';
import { logger } from '../lib/logger';
import type { WSMessage } from '../types';

const wsLogger = logger.child({ component: 'ws-server' });
const wss = new WebSocketServer({ port: config.WS_PORT });

wsLogger.info({ port: config.WS_PORT }, 'Starting WebSocket server');

wss.on('listening', () => {
  wsLogger.info({ port: config.WS_PORT }, 'WebSocket server listening');
});

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  const clientIp = req.socket.remoteAddress;
  wsLogger.info({ clientIp }, 'New connection');

  ws.on('message', async (raw) => {
    let message: WSMessage;

    try {
      message = JSON.parse(raw.toString()) as WSMessage;
    } catch {
      wsLogger.error('Invalid JSON message received');
      ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid JSON' } }));
      return;
    }

    try {
      switch (message.type) {
        case 'session_start':
          await handleSessionStart(ws, message as Parameters<typeof handleSessionStart>[1]);
          break;
        case 'audio_chunk':
          handleAudioChunk(ws, message as Parameters<typeof handleAudioChunk>[1]);
          break;
        case 'session_end':
          await handleSessionEnd(ws, message as Parameters<typeof handleSessionEnd>[1]);
          break;
        default:
          wsLogger.warn({ type: message.type }, 'Unknown message type');
      }
    } catch (error) {
      wsLogger.error({ error }, 'Error handling message');
      ws.send(JSON.stringify({ type: 'error', payload: { message: 'Internal server error' } }));
    }
  });

  ws.on('close', () => {
    wsLogger.info({ clientIp }, 'Connection closed');
  });

  ws.on('error', (error) => {
    wsLogger.error({ clientIp, error }, 'WebSocket error');
  });

  ws.send(JSON.stringify({ type: 'connected', payload: { status: 'ready' } }));
});

wss.on('error', (error) => {
  wsLogger.error({ error }, 'Server error');
});

process.on('SIGTERM', () => {
  wsLogger.info('Shutting down...');
  wss.close(() => {
    wsLogger.info('Closed');
    process.exit(0);
  });
});
