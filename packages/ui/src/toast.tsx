'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useRef,
} from 'react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  title?: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (
    message: string,
    variant?: ToastVariant,
    duration?: number,
    title?: string
  ) => string;
  removeToast: (id: string) => void;
  success: (message: string, duration?: number, title?: string) => string;
  error: (message: string, duration?: number, title?: string) => string;
  info: (message: string, duration?: number, title?: string) => string;
  warning: (message: string, duration?: number, title?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export interface ToastProviderProps {
  children: ReactNode;
  defaultDuration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export function ToastProvider({
  children,
  defaultDuration = 5000,
  position = 'top-right',
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration?: number, title?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const toast: Toast = {
        id,
        message,
        title,
        variant,
        duration: duration ?? defaultDuration,
      };
      setToasts((prev) => [...prev, toast]);
      return id;
    },
    [defaultDuration]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (message: string, duration?: number, title?: string) => addToast(message, 'success', duration, title),
    [addToast]
  );

  const error = useCallback(
    (message: string, duration?: number, title?: string) => addToast(message, 'error', duration, title),
    [addToast]
  );

  const info = useCallback(
    (message: string, duration?: number, title?: string) => addToast(message, 'info', duration, title),
    [addToast]
  );

  const warning = useCallback(
    (message: string, duration?: number, title?: string) => addToast(message, 'warning', duration, title),
    [addToast]
  );

  const positionStyles: Record<string, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, info, warning }}
    >
      {children}
      {toasts.length > 0 && (
        <div
          className={`fixed z-[60] flex flex-col gap-2 ${positionStyles[position]}`}
          role="region"
          aria-label="Notifications"
          aria-live="polite"
        >
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => removeToast(toast.id)}
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

// Dark base + colored left border per design spec (section 3.6)
const variantConfig: Record<
  ToastVariant,
  { borderColor: string; iconColor: string; icon: ReactNode }
> = {
  success: {
    borderColor: 'border-l-success',
    iconColor: 'text-success',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    borderColor: 'border-l-error',
    iconColor: 'text-error',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  info: {
    borderColor: 'border-l-info',
    iconColor: 'text-info',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    borderColor: 'border-l-warning',
    iconColor: 'text-warning',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
};

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(onDismiss, 200);
  }, [onDismiss]);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      timerRef.current = setTimeout(startDismiss, toast.duration);

      // Animate progress bar
      const interval = 50; // update every 50ms
      const steps = toast.duration / interval;
      const decrement = 100 / steps;
      progressRef.current = setInterval(() => {
        setProgress((prev) => Math.max(0, prev - decrement));
      }, interval);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [toast.duration, startDismiss]);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  };

  const handleMouseLeave = () => {
    if (toast.duration && toast.duration > 0) {
      timerRef.current = setTimeout(startDismiss, toast.duration * (progress / 100));
      const interval = 50;
      const steps = (toast.duration * (progress / 100)) / interval;
      const decrement = progress / steps;
      progressRef.current = setInterval(() => {
        setProgress((prev) => Math.max(0, prev - decrement));
      }, interval);
    }
  };

  const { borderColor, iconColor, icon } = variantConfig[toast.variant];

  return (
    <div
      role="alert"
      aria-live="assertive"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={[
        'relative overflow-hidden',
        'min-w-[300px] max-w-md',
        'bg-surface-elevated',
        'border border-border',
        'border-l-4',
        borderColor,
        'rounded-lg shadow-lg',
        'motion-reduce:animate-none',
      ].join(' ')}
      style={{
        animation: isExiting
          ? 'jb-toast-out 200ms ease-out forwards'
          : 'jb-toast-in 250ms cubic-bezier(0, 0, 0.2, 1)',
      }}
    >
      <style>{`
        @keyframes jb-toast-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes jb-toast-out {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `}</style>

      <div className="flex items-start gap-3 px-4 py-3">
        <span className={`shrink-0 mt-0.5 ${iconColor}`} aria-hidden="true">
          {icon}
        </span>

        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className="text-sm font-semibold text-foreground mb-0.5">
              {toast.title}
            </p>
          )}
          <p className="text-sm text-foreground-secondary leading-snug">
            {toast.message}
          </p>
        </div>

        <button
          type="button"
          onClick={startDismiss}
          aria-label="Dismiss notification"
          className={[
            'shrink-0',
            'min-h-[44px] min-w-[44px]',
            '-mr-2 -mt-1',
            'flex items-center justify-center',
            'rounded-lg',
            'text-foreground-muted hover:text-foreground',
            'hover:bg-surface-hover',
            'transition-colors',
            'focus:outline-none focus-visible:shadow-[0_0_0_2px_var(--ring)]',
          ].join(' ')}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar — hidden under prefers-reduced-motion (Issue A-21) */}
      {toast.duration && toast.duration > 0 && (
        <div
          className="absolute bottom-0 left-0 h-0.5 bg-current opacity-30 motion-reduce:hidden"
          style={{ width: `${progress}%`, transition: 'width 50ms linear' }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// Standalone Toast component for manual usage without provider
export interface StandaloneToastProps {
  message: string;
  title?: string;
  variant?: ToastVariant;
  onDismiss?: () => void;
  className?: string;
}

export function StandaloneToast({
  message,
  title,
  variant = 'info',
  onDismiss,
  className = '',
}: StandaloneToastProps) {
  const { borderColor, iconColor, icon } = variantConfig[variant];

  return (
    <div
      role="alert"
      className={[
        'flex items-start gap-3',
        'min-w-[300px] max-w-md',
        'px-4 py-3',
        'bg-surface-elevated',
        'border border-border border-l-4',
        borderColor,
        'rounded-lg shadow-lg',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={`shrink-0 mt-0.5 ${iconColor}`} aria-hidden="true">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-semibold text-foreground mb-0.5">{title}</p>
        )}
        <p className="text-sm text-foreground-secondary leading-snug">{message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className={[
            'shrink-0',
            'min-h-[44px] min-w-[44px]',
            '-mr-2 -mt-1',
            'flex items-center justify-center',
            'rounded-lg',
            'text-foreground-muted hover:text-foreground',
            'hover:bg-surface-hover',
            'transition-colors',
            'focus:outline-none focus-visible:shadow-[0_0_0_2px_var(--ring)]',
          ].join(' ')}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
