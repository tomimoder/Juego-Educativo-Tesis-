import React, { useEffect } from 'react';

export const Dialog = ({ children, open, onOpenChange }) => {
  return (
    <>{open && children}</>
  );
};

export const DialogTrigger = ({ children, asChild, ...props }) => {
  if (asChild) {
    return React.cloneElement(children, props);
  }
  return children;
};

export function DialogContent({ children, className = "", ...props }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <div
        className={`fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg md:w-full ${className}`}
        {...props}
      >
        {children}
      </div>
    </>
  );
}

export function DialogHeader({ className = "", ...props }) {
  return (
    <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`} {...props} />
  );
}

export function DialogTitle({ className = "", ...props }) {
  return (
    <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props} />
  );
}

export function DialogDescription({ className = "", ...props }) {
  return (
    <p className={`text-sm text-gray-500 ${className}`} {...props} />
  );
}
