import React from 'react';

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  italicTitle?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function AdminPageHeader({
  eyebrow,
  title,
  italicTitle,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 font-sans mb-8">
      <div className="space-y-1.5">
        {eyebrow && (
          <span className="admin-eyebrow block">
            {eyebrow}
          </span>
        )}
        <h1 className="admin-page-title">
          {title} {italicTitle && <span className="italic font-normal">{italicTitle}</span>}
        </h1>
        {description && (
          <p className="admin-description">
            {description}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center gap-3 shrink-0 pt-1">{actions}</div>}
    </div>
  );
}
