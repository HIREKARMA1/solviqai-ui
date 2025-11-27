'use client';

type GDClientEvents =
  | 'connect'
  | 'disconnect'
  | 'user_joined'
  | 'user_left'
  | 'transcript_update'
  | 'bot_response'
  | 'webrtc_offer'
  | 'webrtc_answer'
  | 'webrtc_ice'
  | 'error';

type EventHandler = (data: any) => void;

type SendMessagePayload = {
  type: string;
  [key: string]: any;
};

class GDSocketClient {
  private socket: WebSocket | null = null;
  private baseUrl: string;
  private connectedRoomId: string | null = null;
  private userId: string | null = null;
  private handlers: Map<GDClientEvents, Set<EventHandler>> = new Map();

  constructor() {
    this.baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
    ['connect', 'disconnect', 'user_joined', 'user_left', 'transcript_update', 'bot_response', 'webrtc_offer', 'webrtc_answer', 'webrtc_ice', 'error'].forEach((e) => {
      this.handlers.set(e as GDClientEvents, new Set());
    });
  }

  connect(roomId: string, userId: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }
    // Native WebSocket to existing endpoint
    const wsProto = this.baseUrl.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = `${wsProto}://${this.baseUrl.replace(/^https?:\/\//, '')}/api/v1/practice/gd/message?room_id=${encodeURIComponent(roomId)}&user_id=${encodeURIComponent(userId)}`;
    this.socket = new WebSocket(wsUrl);

    this.connectedRoomId = roomId;
    this.userId = userId;

    this.socket.addEventListener('open', () => {
      this.emitLocal('connect', { room_id: roomId, user_id: userId });
      // Notify others you joined (system)
      this.sendMessage('system', { message: 'user_joined' });
    });
    this.socket.addEventListener('message', (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        const type = (msg.type || '').toString();
        if (type === 'system' && msg.message === 'user_joined') this.emitLocal('user_joined', msg);
        else if (type === 'system' && msg.message === 'user_left') this.emitLocal('user_left', msg);
        else if (type === 'transcript_update') this.emitLocal('transcript_update', msg);
        else if (type === 'bot' || type === 'bot_response') this.emitLocal('bot_response', msg);
        else if (type === 'webrtc_offer') this.emitLocal('webrtc_offer', msg);
        else if (type === 'webrtc_answer') this.emitLocal('webrtc_answer', msg);
        else if (type === 'webrtc_ice') this.emitLocal('webrtc_ice', msg);
      } catch (e) {
        this.emitLocal('error', { error: 'invalid_message', detail: String(e) });
      }
    });
    this.socket.addEventListener('close', () => {
      this.emitLocal('disconnect', {});
    });
    this.socket.addEventListener('error', () => {
      this.emitLocal('error', { error: 'socket_error' });
    });
  }

  private emitLocal(event: GDClientEvents, payload: any) {
    const set = this.handlers.get(event);
    if (!set) return;
    set.forEach((cb) => cb(payload));
  }

  onEvent<T = any>(event: GDClientEvents, callback: (data: T) => void) {
    const set = this.handlers.get(event);
    if (!set) return;
    set.add(callback as EventHandler);
  }

  offEvent(event: GDClientEvents, callback?: (...args: any[]) => void) {
    const set = this.handlers.get(event);
    if (!set) return;
    if (callback) set.delete(callback as EventHandler);
    else set.clear();
  }

  emit(event: string, payload?: any) {
    // For native WS path, wrap requested event into message protocol
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    const data = JSON.stringify({ type: event, ...payload });
    this.socket.send(data);
  }

  sendMessage(type: string, data: Record<string, any> = {}) {
    if (!this.socket || !this.connectedRoomId || this.socket.readyState !== WebSocket.OPEN) return;
    const payload: SendMessagePayload = {
      type,
      room_id: this.connectedRoomId,
      user_id: this.userId,
      ...data,
    };
    this.socket.send(JSON.stringify(payload));
  }

  disconnect() {
    if (this.socket) {
      try {
        this.sendMessage('system', { message: 'user_left' });
      } catch {}
      this.socket.close();
      this.socket = null;
      this.connectedRoomId = null;
      this.userId = null;
    }
  }
}

let singleton: GDSocketClient | null = null;

export function useGDSocket() {
  if (!singleton) {
    singleton = new GDSocketClient();
  }
  return singleton;
}

export type { GDClientEvents };


