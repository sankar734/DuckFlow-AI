import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 text-center">
      <div className="max-w-md space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-brand-50 dark:bg-brand-950 text-brand-500 mx-auto flex items-center justify-center ring-8 ring-brand-50/50">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-black">404</h1>
        <h2 className="text-lg font-bold">Document or Page Not Found</h2>
        <p className="text-xs text-slate-400">
          The link you followed may be broken or the document may have been moved to trash.
        </p>
        <div className="pt-2">
          <Link to="/dashboard">
            <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to Workspace
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
