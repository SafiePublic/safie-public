interface ToastProps {
  message: string;
  visible: boolean;
}

export function Toast({ message, visible }: ToastProps) {
  return <div class={`toast${visible ? ' visible' : ''}`}>{message}</div>;
}
