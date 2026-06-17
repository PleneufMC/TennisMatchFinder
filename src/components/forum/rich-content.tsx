/**
 * Affiche un contenu utilisateur écrit en Markdown, rendu en HTML sanitisé.
 *
 * Sécurité : le HTML provient EXCLUSIVEMENT de renderMarkdown() qui passe par
 * DOMPurify (whitelist stricte). C'est la seule raison pour laquelle
 * dangerouslySetInnerHTML est acceptable ici.
 *
 * Style : on n'utilise pas le plugin @tailwindcss/typography (absent du projet),
 * on style donc les éléments via une classe dédiée `.rich-content` (cf. globals.css).
 */
import { renderMarkdown } from '@/lib/markdown';
import { cn } from '@/lib/utils';

interface RichContentProps {
  content: string | null | undefined;
  className?: string;
}

export function RichContent({ content, className }: RichContentProps) {
  const html = renderMarkdown(content);

  return (
    <div
      className={cn('rich-content', className)}
      // eslint-disable-next-line react/no-danger -- HTML sanitisé via DOMPurify (whitelist stricte)
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
