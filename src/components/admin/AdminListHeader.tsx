import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface AdminListHeaderProps {
  title: string;
  backPath?: string;
  onBack?: () => void;
}

export const AdminListHeader: React.FC<AdminListHeaderProps> = ({ title, backPath, onBack }) => {
  const backButton = backPath ? (
    <Link
      to={backPath}
      className="p-2 -ml-2 transition-opacity hover:opacity-70"
    >
      <ArrowLeft className="w-6 h-6 text-[#0084ff]" />
    </Link>
  ) : onBack ? (
    <button
      onClick={onBack}
      className="p-2 -ml-2 transition-opacity hover:opacity-70"
    >
      <ArrowLeft className="w-6 h-6 text-[#0084ff]" />
    </button>
  ) : null;

  return (
    <div className="bg-white/95 backdrop-blur-sm flex items-center justify-between px-4 pt-16 pb-3 shadow-lg border-b border-slate-200/50 sticky top-0 z-20">
      {backButton || <div className="w-10" />}
      <h1 className="flex-1 text-center text-xl font-bold text-slate-900 tracking-wide">
        {title}
      </h1>
      <div className="w-10" />
    </div>
  );
};

