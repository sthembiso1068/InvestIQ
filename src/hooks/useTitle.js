import { useEffect } from 'react';

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · SV Capital` : 'SV Capital';
  }, [title]);
}
