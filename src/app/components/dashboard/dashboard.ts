import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Alerta } from '../../models/alerta.model';
import { AlertaCardComponent } from '../alerta-card/alerta-card';
import { StatusBarComponent } from '../status-bar/status-bar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertaCardComponent, StatusBarComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  alertas: Alerta[] = [];
  filtroTipo = '';
  filtroCriticidade = '';
  conectado = false;
  ultimaAtualizacao: Date | null = null;
  novoAlerta = false;

  get total()    { return this.alertas.length; }
  get criticas() { return this.alertas.filter(a => a.criticidade === 'critica').length; }
  get altas()    { return this.alertas.filter(a => a.criticidade === 'alta').length; }
  get medias()   { return this.alertas.filter(a => a.criticidade === 'media').length; }
  get baixas()   { return this.alertas.filter(a => a.criticidade === 'baixa').length; }

  get alertasFiltrados(): Alerta[] {
    return this.alertas
      .filter(a => !this.filtroCriticidade || a.criticidade === this.filtroCriticidade)
      .filter(a => !this.filtroTipo        || a.tipo === this.filtroTipo)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  get tiposDisponiveis(): string[] {
    return [...new Set(this.alertas.map(a => a.tipo))];
  }

  ngOnInit(): void {
    this.ultimaAtualizacao = new Date();

    // Dados falsos para testar a interface
    this.alertas = [
      {
        id: '1',
        tipo: 'novo_host',
        criticidade: 'alta',
        host: '192.168.1.45',
        porta: null,
        servico: null,
        descricao: 'Novo host detectado: 192.168.1.45',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        tipo: 'porta_aberta',
        criticidade: 'critica',
        host: '192.168.1.10',
        porta: 22,
        servico: 'ssh',
        descricao: 'Nova porta aberta em 192.168.1.10: 22 (ssh) ⚠️ PORTA SENSÍVEL',
        timestamp: new Date(Date.now() - 60000).toISOString()
      },
      {
        id: '3',
        tipo: 'porta_aberta',
        criticidade: 'media',
        host: '192.168.1.10',
        porta: 8080,
        servico: 'http-proxy',
        descricao: 'Nova porta aberta em 192.168.1.10: 8080 (http-proxy)',
        timestamp: new Date(Date.now() - 120000).toISOString()
      },
      {
        id: '4',
        tipo: 'host_perdido',
        criticidade: 'alta',
        host: '192.168.1.30',
        porta: null,
        servico: null,
        descricao: 'Host parou de responder: 192.168.1.30',
        timestamp: new Date(Date.now() - 180000).toISOString()
      },
      {
        id: '5',
        tipo: 'porta_fechada',
        criticidade: 'baixa',
        host: '192.168.1.10',
        porta: 3306,
        servico: 'mysql',
        descricao: 'Porta fechada em 192.168.1.10: 3306 (mysql)',
        timestamp: new Date(Date.now() - 240000).toISOString()
      }
    ];
  }

  limparFiltros(): void {
    this.filtroTipo = '';
    this.filtroCriticidade = '';
  }

  trackById(_: number, a: Alerta): string { return a.id; }
}