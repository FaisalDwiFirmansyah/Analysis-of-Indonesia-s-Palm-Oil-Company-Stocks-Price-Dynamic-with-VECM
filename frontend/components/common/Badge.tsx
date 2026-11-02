import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "emerald";
  size?: "sm" | "md";
  className?: string;
}

export default function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
}: BadgeProps) {
  const variantStyles = {
    success: "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold",
    emerald: "bg-emerald-700 text-white border-emerald-800 font-bold",
    warning: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
    danger: "bg-rose-100 text-rose-900 border-rose-300 font-bold",
    info: "bg-blue-100 text-blue-900 border-blue-300 font-bold",
    neutral: "bg-slate-100 text-slate-800 border-slate-300 font-semibold",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] font-semibold",
    md: "px-2.5 py-1 text-xs font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-sans tracking-tight transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
}
