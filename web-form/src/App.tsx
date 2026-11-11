import { useEffect, useState } from 'react';
import { getPublicForm, type PublicForm } from './api';
import { QuestionField } from './QuestionField';

/* Lê o token do endereço: http://localhost:5173/formulario/<TOKEN> */
function getTokenFromUrl(): string | null {
  const match = window.location.pathname.match(/^\/formulario\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function App() {
  const [token] = useState(getTokenFromUrl);
  const [form, setForm] = useState<PublicForm | null>(null);
  const [error, setError] = useState<string | null>(
    token ? null : 'Link inválido. Verifique o endereço enviado pelo pediatra.',
  );
  // Respostas digitadas, indexadas pelo id da pergunta
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) return;

    getPublicForm(token)
      .then(setForm)
      .catch((err: Error) => setError(err.message));
  }, [token]);

  if (error) {
    return (
      <main className="page">
        <div className="card message">
          <h1>Formulário indisponível</h1>
          <p>{error}</p>
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

  return (
    <main className="page">
      <form className="card" onSubmit={(e) => e.preventDefault()}>
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
            onChange={(value) =>
              setAnswers((prev) => ({ ...prev, [question.id]: value }))
            }
          />
        ))}

        {/* O botão de envio será implementado na etapa 5.2 */}
      </form>
    </main>
  );
}
