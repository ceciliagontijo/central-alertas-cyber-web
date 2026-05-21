export type Criticidade = 'critica' | 'alta' | 'media' | 'baixa';

export interface Alerta {
  id: string;
  tipo: string;
  criticidade: Criticidade;
  host: string;
  porta: number | null;
  servico: string | null;
  descricao: string;
  timestamp: string;
}
