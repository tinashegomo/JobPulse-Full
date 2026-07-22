import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-48 animate-fade-in">
      <Loader2 size={32} className="text-brand-primary animate-spin" />
      <p className="mt-12 text-body-normal text-text-muted">{text}</p>
    </div>
  );
};

export default LoadingSpinner;
