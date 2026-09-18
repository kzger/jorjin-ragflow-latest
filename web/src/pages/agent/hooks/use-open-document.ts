import { useCallback } from 'react';

export function useOpenDocument() {
  const openDocument = useCallback(() => {
    window.open('https://jorjin.com/', '_blank');
  }, []);

  return openDocument;
}
