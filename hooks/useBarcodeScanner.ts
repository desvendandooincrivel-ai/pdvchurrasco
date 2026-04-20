import { useEffect, useRef } from 'react';

export function useBarcodeScanner(onScan: (barcode: string) => void) {
  const buffer = useRef('');
  const lastKeyTime = useRef(Date.now());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora eventos em inputs e textareas para não interferir na digitação manual
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime.current;

      if (e.key === 'Enter') {
        if (buffer.current.length > 3 && timeDiff < 100) {
          onScan(buffer.current);
        }
        buffer.current = '';
      } else if (e.key.length === 1) {
        // Se houver um grande atraso entre teclas, zera o buffer (não é leitor)
        if (timeDiff > 100) {
          buffer.current = '';
        }
        buffer.current += e.key;
      }

      lastKeyTime.current = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan]);
}
