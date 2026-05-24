import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-bar.html',
  styleUrls: ['./status-bar.css']
})
export class StatusBarComponent {
  @Input() conectado = false;
  @Input() ultimaAtualizacao: Date | null = null;
  @Input() novoAlerta = false;

  get horaAtualizacao(): string {
    if (!this.ultimaAtualizacao) return '—';
    return this.ultimaAtualizacao.toLocaleTimeString('pt-BR');
  }
}
