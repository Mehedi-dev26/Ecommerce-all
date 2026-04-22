import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Professional grade badges with consistent, eye-catching color coding.
 * Used across product cards, product detail pages, and admin views.
 *
 * Color logic (uses semantic tokens from design system):
 *  - A → Emerald (Premium / Best)
 *  - B → Sky Blue (Standard / Good)
 *  - C → Amber (Economy / Fair)
 *  - D → Slate (Basic / Budget)
 */

export type ProductGrade = "A" | "B" | "C" | "D" | string;

interface GradeStyle {
  label: string;
  /** Tailwind classes — uses concrete palette colors that work in both themes */
  classes: string;
  ringClasses: string;
}

const GRADE_STYLES: Record<string, GradeStyle> = {
  A: {
    label: "Premium",
    classes:
      "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white",
    ringClasses: "ring-emerald-300/50",
  },
  B: {
    label: "Standard",
    classes:
      "bg-gradient-to-r from-sky-500 to-blue-600 text-white",
    ringClasses: "ring-sky-300/50",
  },
  C: {
    label: "Economy",
    classes:
      "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    ringClasses: "ring-amber-300/50",
  },
  D: {
    label: "Basic",
    classes:
      "bg-gradient-to-r from-slate-500 to-slate-600 text-white",
    ringClasses: "ring-slate-300/50",
  },
};

const getStyle = (grade: string): GradeStyle =>
  GRADE_STYLES[grade.toUpperCase()] ?? GRADE_STYLES.B;

interface GradeBadgeProps {
  grade?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<GradeBadgeProps["size"]>, string> = {
  xs: "px-1.5 py-0.5 text-[10px] gap-0.5",
  sm: "px-2 py-0.5 text-xs gap-1",
  md: "px-2.5 py-1 text-sm gap-1",
  lg: "px-3 py-1.5 text-base gap-1.5",
};

const ICON_SIZE: Record<NonNullable<GradeBadgeProps["size"]>, string> = {
  xs: "h-2.5 w-2.5",
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
};

const GradeBadge = ({
  grade,
  size = "sm",
  showLabel = false,
  className,
}: GradeBadgeProps) => {
  if (!grade) return null;
  const style = getStyle(grade);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-bold shadow-sm ring-1 whitespace-nowrap",
        SIZE_CLASSES[size],
        style.classes,
        style.ringClasses,
        className,
      )}
      title={`Grade ${grade.toUpperCase()} — ${style.label}`}
    >
      <Star className={cn(ICON_SIZE[size], "fill-current")} />
      Grade {grade.toUpperCase()}
      {showLabel && (
        <span className="ml-1 opacity-90 font-medium">• {style.label}</span>
      )}
    </span>
  );
};

export default GradeBadge;
