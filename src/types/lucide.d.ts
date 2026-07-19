declare module 'lucide-react-native' {
  import { ComponentType, SVGProps } from 'react';
  export interface LucideProps extends SVGProps<any> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
    opacity?: number | string;
  }
  export type LucideIcon = ComponentType<LucideProps>;
  export const Check: LucideIcon;
  export const CheckSquare: LucideIcon;
  export const X: LucideIcon;
  export const Plus: LucideIcon;
  export const Bell: LucideIcon;
  export const Clock: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const Trash2: LucideIcon;
  export const Edit3: LucideIcon;
  export const Calendar: LucideIcon;
  export const CalendarDays: LucideIcon;
  export const Tag: LucideIcon;
  export const RotateCw: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Settings: LucideIcon;
  export const Download: LucideIcon;
  export const Upload: LucideIcon;
}
