import React from 'react';
import { PackageSearch } from 'lucide-react';

interface AdminEmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}

export function AdminEmptyState({
  title,
  description,
  action,
  icon: Icon = PackageSearch,
}: AdminEmptyStateProps) {
  return (
    <div className="p-12 text-center space-y-3 font-sans max-w-md mx-auto">
      <div className="w-12 h-12 rounded-2xl bg-[#F4F1EA] text-[#686660] flex items-center justify-center mx-auto">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-semibold text-base text-[#111111]">{title}</h3>
      <p className="text-xs text-[#686660]">{description}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
