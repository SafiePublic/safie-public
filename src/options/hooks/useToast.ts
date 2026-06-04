import { useCallback, useRef, useState } from 'preact/hooks';

export function useToast(duration = 2000): [string, boolean, (msg: string) => void] {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback(
    (msg: string) => {
      clearTimeout(timerRef.current);
      setMessage(msg);
      setVisible(true);
      timerRef.current = setTimeout(() => setVisible(false), duration);
    },
    [duration],
  );

  return [message, visible, show];
}
