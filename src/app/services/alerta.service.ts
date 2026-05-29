import { Injectable, NgZone } from '@angular/core'; // 1. Adicionei o NgZone aqui
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Alerta } from '../models/alerta.model';

const API = 'http://localhost:8000';
const WS  = 'ws://localhost:8000/ws/alertas';

@Injectable({ providedIn: 'root' })
export class AlertaService {
  private ws!: WebSocket;
  private alertaSubject = new Subject<Alerta>();
  alerta$ = this.alertaSubject.asObservable();


  constructor(
    private http: HttpClient,
    private zone: NgZone
  ) {
    this.conectarWs();
  }

  listar(criticidade?: string, tipo?: string): Observable<Alerta[]> {
    let url = `${API}/alertas`;
    const params: string[] = [];
    if (criticidade) params.push(`criticidade=${criticidade}`);
    if (tipo)        params.push(`tipo=${tipo}`);
    if (params.length) url += '?' + params.join('&');
    return this.http.get<Alerta[]>(url);
  }

  snapshot(): Observable<Record<string, any>> {
    return this.http.get<Record<string, any>>(`${API}/snapshot`);
  }

  private conectarWs(): void {
    this.ws = new WebSocket(WS);

    this.ws.onopen = () => {
      console.log('WebSocket conectado');
    };

    this.ws.onmessage = (event) => {
      try {
        const alerta: Alerta = JSON.parse(event.data);

        this.zone.run(() => {
          this.alertaSubject.next(alerta);
        });

      } catch (err) {
        console.error("Erro ao processar mensagem do WS:", err);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket desconectado, reconectando...');
      setTimeout(() => this.conectarWs(), 5000);
    };

    setInterval(() => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 25000);
  }

  get wsConectado(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}