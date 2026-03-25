import { useNavigate } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="p-4 rounded-full bg-bg-surface-raised/50 mb-6">
        <FileQuestion className="w-16 h-16 text-text-tertiary" />
      </div>
      <h1 className="text-4xl font-bold text-text-primary mb-2">404</h1>
      <p className="text-lg text-text-secondary mb-8">Page not found</p>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-2.5 bg-primary text-bg-root rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
