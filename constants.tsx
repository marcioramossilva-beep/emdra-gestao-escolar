
import { OccurrenceType } from './types';

export const OCCURRENCE_REASONS: Record<OccurrenceType, string[]> = {
  [OccurrenceType.PEDAGOGICAL]: [
    'Falta de material escolar',
    'Desinteresse nas atividades',
    'Sono excessivo em aula',
    'Não entrega de tarefas',
    'Dificuldade de aprendizagem acentuada'
  ],
  [OccurrenceType.BEHAVIORAL]: [
    'Conversa excessiva',
    'Uso indevido de celular',
    'Desrespeito moderado a colegas',
    'Brincadeiras inadequadas',
    'Gritos ou barulhos em sala'
  ],
  [OccurrenceType.SERIOUS]: [
    'Agressão física',
    'Bullying ou Cyberbullying',
    'Dano ao patrimônio escolar',
    'Uso de palavras de baixo calão graves',
    'Saída da escola sem autorização',
    'Porte de objetos perigosos'
  ]
};

export const IMMEDIATE_ACTIONS = [
  'Conversa reflexiva com o aluno',
  'Advertência verbal registrada',
  'Encaminhamento imediato à Coordenação',
  'Mediação de conflito entre partes',
  'Retirada de material perturbador',
  'Mudança de posicionamento em sala',
  'Contato telefônico com responsáveis',
  'Solicitação de agenda escolar para registro'
];

export const MANAGEMENT_DECISIONS = [
  'Convocação dos pais/responsáveis para reunião',
  'Suspensão disciplinar (1 a 3 dias)',
  'Assinatura de Termo de Compromisso e Conduta',
  'Encaminhamento ao Conselho Tutelar',
  'Aplicação de medida socioeducativa interna',
  'Transferência de turno ou turma',
  'Encaminhamento para suporte psicológico/pedagógico',
  'Apenas registro para acompanhamento histórico'
];

export const STAFF_ROLES = [
  'Limpeza',
  'Cozinha',
  'Secretária',
  'Biblioteca',
  'Portaria',
  'Apoio',
  'Integrada',
  'Artífice',
  'Mecanografia'
] as const;

export const SHIFTS = ['Manhã', 'Tarde', 'Integrada'] as const;

export const ATTENDANCE_TYPES = [
  'Falta',
  'Atestado',
  'Atraso',
  'Banco de Horas',
  'TRE',
  'Doação de Sangue',
  'Declaração'
] as const;

export const DOCUMENT_CATEGORIES = ['Lei', 'Decreto', 'Portaria'] as const;

export const EVENT_COLORS = {
  'Feriado': 'bg-red-100 text-red-700 border-red-200',
  'Reunião': 'bg-blue-100 text-blue-700 border-blue-200',
  'Evento Letivo': 'bg-emerald-100 text-emerald-700 border-emerald-200'
};
