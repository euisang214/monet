interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'md',
  fullScreen = true,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  };

  const spinnerContent = (
    <div className={`text-center ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-indigo-600 mx-auto mb-4 ${sizeClasses[size]}`}></div>
      {message && (
        <p className="text-gray-600 font-medium">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
}