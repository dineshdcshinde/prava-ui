import { useState, type HTMLAttributes, type ReactNode } from 'react';

export type AvatarProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  /** Image URL. A failed or missing image displays the fallback. */
  src?: string;
  /** Person's first name, used to form initials and an accessible name. */
  firstName?: string;
  /** Person's last name, used to form initials and an accessible name. */
  lastName?: string;
  /** Text alternative for an entity avatar or custom accessible name. */
  alt?: string;
  /** Content shown when the image is missing or fails; defaults to the initials. */
  fallback?: ReactNode;
  /** Avatar dimensions. */
  size?: 'sm' | 'md' | 'lg';
};

/** Shows a person's image or their initials when no image is available. */
export function Avatar({ src, firstName, lastName, alt, fallback, size = 'md', className, onError, ...props }: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const name = [firstName, lastName].filter(Boolean).join(' ');
  const initials = [firstName, lastName].filter(Boolean).map((part) => part!.trim()[0]).filter(Boolean).join('').toLocaleUpperCase();
  const label = alt ?? name;

  return (
    <span
      {...props}
      className={['prava-avatar', className].filter(Boolean).join(' ')}
      data-size={size}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      {src && !imageFailed ? <img src={src} alt="" onError={(event) => { setImageFailed(true); onError?.(event); }} /> : (fallback ?? initials)}
    </span>
  );
}
