import enMessages from '../../messages/en.json';
import hyMessages from '../../messages/hy.json';

export type Messages = typeof enMessages;

export function getMessages(locale: string): Messages {
  switch (locale) {
    case 'hy':
      return hyMessages;
    case 'en':
    default:
      return enMessages;
  }
} 