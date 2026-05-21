import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Alerta } from '../../models/alerta.model';

@Component({
  selector: 'app-alerta-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerta-card.html',
  styleUrls: ['./alerta-card.css']
})
export class AlertaCardComponent {
  @Input() alerta!: Alerta;
  expandido = false;

  get icone(): string {
    const icons: Record<string, string> = {
      novo_host:       '⊕',
      host_perdido:    '⊖',
      porta_aberta:    '⊙',
      porta_fechada:   '⊘',
      servico_alterado:'⊛',
    };
    return icons[this.alerta.tipo] ?? '○';
  }

  get tipoLabel(): string {
    const labels: Record<string, string> = {
      novo_host:       'novo host',
      host_perdido:    'host perdido',
      porta_aberta:    'porta aberta',
      porta_fechada:   'porta fechada',
      servico_alterado:'serviço alterado',
    };
    return labels[this.alerta.tipo] ?? this.alerta.tipo;
  }

  get horaFormatada(): string {
    return new Date(this.alerta.timestamp).toLocaleTimeString('pt-BR');
  }

  get dataFormatada(): string {
    return new Date(this.alerta.timestamp).toLocaleDateString('pt-BR');
  }
}
