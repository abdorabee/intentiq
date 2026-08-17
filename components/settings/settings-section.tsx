import type { ReactNode } from "react";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
}

export function SettingsSection({ title, description, children, footer, actions }: SettingsSectionProps) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">{title}</div>
          {description ? <div className="card-sub">{description}</div> : null}
        </div>
        {actions ? <div className="card-actions">{actions}</div> : null}
      </div>
      <div className="card-body">{children}</div>
      {footer ? <div className="card-foot">{footer}</div> : null}
    </div>
  );
}
