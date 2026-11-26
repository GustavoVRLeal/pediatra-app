/* Tipos dos dados retornados pelo backend. */

export interface Patient {
  id: string;
  name: string;
  birthDate: string; // ISO, ex.: "2022-03-10T00:00:00.000Z"
  weight: number;
  height: number;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  pediatricianId: string;
  createdAt: string;
}

export type FormStatus = 'DRAFT' | 'SENT' | 'ANSWERED' | 'CLOSED';

export interface Form {
  id: string;
  title: string;
  description: string | null;
  status: FormStatus;
  publicToken: string | null;
  patientId: string;
  createdAt: string;
  updateAt: string; // o campo se chama assim no schema do Prisma
  _count?: { questions: number; responses: number };
}

export type QuestionType = 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'MULTIPLE_CHOICE';

export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  required: boolean;
  order: number;
  options: string[];
  formId: string;
  _count?: { answers: number }; // vem em GET /forms/:id/questions
}

/* Retorno de GET /forms/:id: formulário com paciente e perguntas */
export interface FormDetail extends Form {
  patient: Patient;
  questions: Question[];
  publicLink: string | null; // link do web-form, quando já foi gerado
}

/* Uma resposta dentro de um preenchimento (GET /forms/:id/responses) */
export interface ResponseAnswer {
  questionId: string;
  order: number;
  question: string;
  type: QuestionType;
  answer: string; // sempre texto: "true"/"false", "2024-05-10", "12.5"...
}

/* Um preenchimento enviado pelo responsável */
export interface FormResponse {
  id: string;
  submittedAt: string;
  answers: ResponseAnswer[];
}

export interface FormResponsesList {
  form: { id: string; title: string; status: FormStatus };
  totalResponses: number;
  responses: FormResponse[];
}
