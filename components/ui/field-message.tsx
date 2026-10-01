import * as React from 'react';

export function RequiredMark() {
  return (
    <span className="ml-0.5 text-red-600 dark:text-red-400" aria-hidden="true">
      *
    </span>
  );
}

export function FieldMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="text-sm text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}
