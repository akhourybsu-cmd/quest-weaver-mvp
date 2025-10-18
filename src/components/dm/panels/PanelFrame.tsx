import { ReactNode } from "react";

interface PanelFrameProps {
  title: string;
  children: ReactNode;
  toolbar?: ReactNode;
}

export const PanelFrame: React.FC<PanelFrameProps> = ({ title, children, toolbar }) => (
  <div className="h-full w-full overflow-hidden rounded-lg border bg-card shadow-sm">
    <div className="flex items-center justify-between border-b px-3 py-2 bg-muted/30 cursor-move">
      <span className="text-sm font-semibold">{title}</span>
      {toolbar}
    </div>
    <div className="h-[calc(100%-42px)] overflow-auto p-3">
      {children}
    </div>
  </div>
);
