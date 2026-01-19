'use client';

import { HTMLAttributes, ReactNode, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  header?: ReactNode;
  footer?: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'elevated';
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const variantStyles = {
  default: 'bg-background border-2 border-border',
  outlined: 'bg-transparent border-2 border-border',
  elevated: 'bg-background border-2 border-border shadow-lg',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      header,
      footer,
      padding = 'md',
      variant = 'default',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const hasHeader = !!header;
    const hasFooter = !!footer;

    return (
      <div
        ref={ref}
        className={`
          rounded-xl overflow-hidden
          ${variantStyles[variant]}
          ${className}
        `.trim()}
        {...props}
      >
        {hasHeader && (
          <div className="px-6 py-4 border-b border-border bg-muted/10">
            {typeof header === 'string' ? (
              <h3 className="text-xl font-semibold text-foreground">{header}</h3>
            ) : (
              header
            )}
          </div>
        )}

        <div className={paddingStyles[padding]}>{children}</div>

        {hasFooter && (
          <div className="px-6 py-4 border-t border-border bg-muted/10">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Sub-components for more flexible composition
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`px-6 py-4 border-b border-border bg-muted/10 ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className = '', padding = 'md', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`${paddingStyles[padding]} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  )
);

CardBody.displayName = 'CardBody';

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`px-6 py-4 border-t border-border bg-muted/10 ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className = '', children, ...props }, ref) => (
    <h3
      ref={ref}
      className={`text-xl font-semibold text-foreground ${className}`.trim()}
      {...props}
    >
      {children}
    </h3>
  )
);

CardTitle.displayName = 'CardTitle';
