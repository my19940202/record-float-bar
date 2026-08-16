import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:pointer-events-none disabled:opacity-50 active:translate-y-px',
  {
    variants: {
      variant: {
        default:
          'bg-[linear-gradient(135deg,_#7c4dff,_#5933d6)] text-[hsl(var(--primary-foreground))] shadow-[0_12px_26px_rgba(89,51,214,0.24)] hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(89,51,214,0.28)]',
        secondary:
          'border border-[hsl(var(--border))] bg-white/70 text-[hsl(var(--foreground))] shadow-sm hover:-translate-y-0.5 hover:bg-white',
        ghost: 'hover:bg-white/70',
        outline:
          'border border-[hsl(var(--border))] bg-white/65 hover:-translate-y-0.5 hover:bg-white',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-2xl border border-[hsl(var(--border))] bg-white/82 px-3 py-2 text-sm outline-none transition placeholder:text-[hsl(var(--muted-foreground))]/70 focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'flex min-h-28 w-full rounded-2xl border border-[hsl(var(--border))] bg-white/82 px-3 py-2 text-sm outline-none transition placeholder:text-[hsl(var(--muted-foreground))]/70 focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
        className
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-sm font-medium text-[hsl(var(--foreground))]', className)}
      {...props}
    />
  );
}

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[1.35rem] border border-[hsl(var(--border))] bg-white/82 p-5 shadow-[0_18px_50px_rgba(36,31,51,0.08)] backdrop-blur-xl',
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-lg font-semibold tracking-tight', className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-[hsl(var(--muted-foreground))]', className)}
      {...props}
    />
  );
}
