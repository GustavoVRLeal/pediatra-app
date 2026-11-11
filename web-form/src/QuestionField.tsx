import type { PublicQuestion } from './api';

interface Props {
  question: PublicQuestion;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/* Exibe o campo adequado para cada tipo de pergunta.
   Todos os valores são guardados como texto, que é o formato aceito pelo backend. */
export function QuestionField({ question, value, onChange, error }: Props) {
  const inputId = `q-${question.id}`;

  return (
    <fieldset className={error ? 'question has-error' : 'question'}>
      <legend>
        {question.question}
        {question.required && (
          <span className="required" aria-label="obrigatória"> *</span>
        )}
      </legend>

      {question.type === 'TEXT' && (
        <textarea
          id={inputId}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {question.type === 'NUMBER' && (
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          placeholder="Digite um número"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {question.type === 'DATE' && (
        <input
          id={inputId}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {question.type === 'BOOLEAN' && (
        <div className="choices">
          <Choice name={inputId} label="Sim" checked={value === 'true'} onSelect={() => onChange('true')} />
          <Choice name={inputId} label="Não" checked={value === 'false'} onSelect={() => onChange('false')} />
        </div>
      )}

      {question.type === 'MULTIPLE_CHOICE' && (
        <div className="choices">
          {question.options.map((option) => (
            <Choice
              key={option}
              name={inputId}
              label={option}
              checked={value === option}
              onSelect={() => onChange(option)}
            />
          ))}
        </div>
      )}

      {error && <p className="field-error">{error}</p>}
    </fieldset>
  );
}

function Choice(props: {
  name: string;
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label className="choice">
      <input
        type="radio"
        name={props.name}
        checked={props.checked}
        onChange={props.onSelect}
      />
      {props.label}
    </label>
  );
}
