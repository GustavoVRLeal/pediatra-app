import { useEffect, useState, type FormEvent } from 'react';
import {
  getPublicForm,
  submitResponse,
  type PublicForm,
  type PublicQuestion,
} from './api';
import { QuestionField } from './QuestionField';

/* Lê o token do endereço: http://localhost:5173/formulario/<TOKEN> */
function getTokenFromUrl(): string | null {
  const match = window.location.pathname.match(/^\/formulario\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

/* Validação feita antes do envio, para avisar o responsável na hora.
   O backend repete todas as validações (inclusive de tipo). */
function validate(
  questions: PublicQuestion[],
  answers: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const q of questions) {
    const value = (answers[q.id] ?? '').trim();

    if (value === '') {
      if (q.required) errors[q.id] = 'Esta pergunta é obrigatória';
      continue;
    }

    if (q.type === 'NUMBER' && Number.isNaN(Number(value.replace(',', '.')))) {
      errors[q.id] = 'Informe um número válido';
    }
  }

  return errors;
}

export default function App() {
  const [token] = useState(getTokenFromUrl);
  const [form, setForm] = useState<PublicForm | null>(null);
  const [loadError, setLoadError] = useState<string | null>(
    token ? null : 'Link inválido. Verifique o endereço enviado pelo pediatra.',
  );
  // Respostas digitadas, indexadas pelo id da pergunta
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) return;

    getPublicForm(token)
      .then(setForm)
      .catch((err: Error) => setLoadError(err.message));
  }, [token]);

  function handleChange(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    // Remove o aviso da pergunta assim que o responsável a corrige
    setFieldErrors((prev) => {
      const { [questionId]: _removed, ...rest } = prev;
      return rest;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form || !token) return;

    setSubmitError(null);
    const errors = validate(form.questions, answers);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setSubmitError('Revise as perguntas destacadas antes de enviar.');
      return;
    }

    setSubmitting(true);
    try {
      await submitResponse(token, answers);
      setSubmitted(true);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <main className="page">
        <div className="card message">
          <h1>Formulário indisponível</h1>
          <p>{loadError}</p>
        </div>
      </main>
    );
  }

  if (!form) {
    return (
      <main className="page">
        <p className="loading">Carregando formulário...</p>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="page">
        <div className="card message">
          <h1>Respostas enviadas!</h1>
          <p>Obrigado. As informações já estão disponíveis para o pediatra.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <form className="card" onSubmit={handleSubmit} noValidate>
        <header>
          <h1>{form.title}</h1>
          {form.description && <p className="description">{form.description}</p>}
          <p className="hint">
            Campos marcados com <span className="required">*</span> são obrigatórios.
          </p>
        </header>

        {form.questions.map((question) => (
          <QuestionField
            key={question.id}
            question={question}
            value={answers[question.id] ?? ''}
            onChange={(value) => handleChange(question.id, value)}
            error={fieldErrors[question.id]}
          />
        ))}

        {submitError && (
          <p className="submit-error" role="alert">
            {submitError}
          </p>
        )}

        <button type="submit" className="submit" disabled={submitting}>
          {submitting ? 'Enviando...' : 'Enviar respostas'}
        </button>
      </form>
    </main>
  );
}
