import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'; // Adicionado ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AlertaService } from '../../services/alerta.service';
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
export class DashboardComponent implements OnInit, OnDestroy {
  alertas: Alerta[] = [];
  filtroTipo = '';
  filtroCriticidade = '';
  conectado = false;
  ultimaAtualizacao: Date | null = null;
  novoAlerta = false;

  private sub!: Subscription;

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

  constructor(
    private alertaService: AlertaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarHistorico();

    this.sub = this.alertaService.alerta$.subscribe(alerta => {

      this.alertas = [alerta, ...this.alertas];
      this.ultimaAtualizacao = new Date();
      this.piscarNotificacao();


      this.cdr.detectChanges();
    });

    this.conectado = this.alertaService.wsConectado;
    setInterval(() => {
      this.conectado = this.alertaService.wsConectado;
      this.cdr.detectChanges();
    }, 1000);
  }

  carregarHistorico(): void {
    this.alertaService.listar().subscribe({
      next: (dados) => {
        this.alertas = dados;
        if (dados.length) this.ultimaAtualizacao = new Date();
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  limparFiltros(): void {
    this.filtroTipo = '';
    this.filtroCriticidade = '';
  }

  private piscarNotificacao(): void {
    this.novoAlerta = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.novoAlerta = false;
      this.cdr.detectChanges();
    }, 1500);
  }

  trackById(_: number, a: Alerta): string { return a.id; }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}