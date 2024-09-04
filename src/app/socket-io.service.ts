import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, fromEvent, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketIoService {
  private socket!: Socket;
  private serverUrl = 'http://13.48.147.225:5000'; 
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 2000; // 2 segundos
  private connected$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket(): void {
    this.socket = io(this.serverUrl, {
      autoConnect: false,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectInterval
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO conectado');
      this.connected$.next(true);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason: string) => {
      console.warn(`Socket.IO desconectado: ${reason}`);
      this.connected$.next(false);
      if (reason !== 'io client disconnect') {
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('Error de conexión Socket.IO:', error);
      this.attemptReconnect();
    });
  }

  connect(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  on(event: string, callback: Function): void {
    this.socket.on(event, (data: any) => callback(data));
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }
  
  
  
  
  emit(event: string, data: any): void {
    if (this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`No se pudo emitir el evento '${event}', el socket no está conectado.`);
    }
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Intentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => {
        this.socket.connect();
      }, this.reconnectInterval);
    } else {
      console.error('Número máximo de intentos de reconexión alcanzado.');
    }
  }
}
