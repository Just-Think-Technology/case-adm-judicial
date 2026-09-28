// Password rules from the contract (§4.2/§9): shared by signup and reset so
// the live checklist can never drift between the two screens.
export interface PasswordCheck {
  id: string;
  label: string;
  passes: boolean;
}

const SPECIAL = /[@$!%*?&]/;

export function checkPassword(password: string, confirmation: string): PasswordCheck[] {
  return [
    { id: 'length', label: 'Mínimo de 8 caracteres', passes: password.length >= 8 },
    { id: 'upper', label: 'Uma letra maiúscula', passes: /[A-Z]/.test(password) },
    { id: 'lower', label: 'Uma letra minúscula', passes: /[a-z]/.test(password) },
    { id: 'digit', label: 'Um número', passes: /[0-9]/.test(password) },
    { id: 'special', label: 'Um caractere especial (@ $ ! % * ? &)', passes: SPECIAL.test(password) },
    {
      id: 'match',
      label: 'As duas senhas são iguais',
      passes: password !== '' && password === confirmation,
    },
  ];
}

export function passwordValid(checks: PasswordCheck[]): boolean {
  return checks.every((check) => check.passes);
}
