import { ToastService } from './toast.service';

export function copyText(text: string, toast: ToastService) {
  navigator.clipboard.writeText(text).then(
    () => toast.success('Copied to clipboard'),
    () => toast.error('Could not copy. Select the text and copy it manually.')
  );
}
