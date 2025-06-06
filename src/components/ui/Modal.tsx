import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  showCloseButton?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  actions,
  maxWidth = 'lg',
  showCloseButton = true
}: ModalProps) {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-lg ${maxWidthClasses[maxWidth]} w-full max-h-[90vh] overflow-y-auto shadow-xl`}>
        {/* Header */}
        {(title || subtitle || showCloseButton) && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                {title && (
                  <h3 className="text-xl font-bold text-gray-900">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-gray-600 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="px-6 py-6">
          {children}
        </div>
        
        {/* Actions */}
        {actions && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}