import { PanelFrame } from "./PanelFrame";
import { ReactNode } from "react";

interface GenericPanelProps {
  title: string;
  children: ReactNode;
}

export const GenericPanel: React.FC<GenericPanelProps> = ({ title, children }) => (
  <PanelFrame title={title}>
    {children}
  </PanelFrame>
);
