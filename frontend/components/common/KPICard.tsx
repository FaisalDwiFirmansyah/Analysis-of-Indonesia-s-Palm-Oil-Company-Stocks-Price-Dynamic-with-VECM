import React from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ElementType;
  badgeText?: string;
  badgeVariant?: "success" | "warning" | "danger" | "info" | "neutral" | "emerald";
  accentColor?: "emerald" | "blue" | "amber" | "purple" | "slate";
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeVariant = "neutral",
}: KPICardProps) {
  const getBadgeStyle = () => {
    switch (badgeVariant) {
      case "success":
      case "emerald":
        return "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold";
      case "warning":
        return "bg-amber-100 text-amber-900 border-amber-300 font-bold";
      case "danger":
        return "bg-rose-100 text-rose-900 border-rose-300 font-bold";
      case "info":
        return "bg-blue-100 text-blue-900 border-blue-200 font-bold";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300 font-semibold";
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs ring-1 ring-slate-900/5 hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1 font-sans tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shadow-2xs">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {(subtitle || badgeText) && (
        <div className="mt-3.5 flex items-center justify-between text-xs pt-2.5 border-t border-slate-200/70">
          {subtitle && <span className="text-slate-600 font-medium text-[11px]">{subtitle}</span>}
          {badgeText && (
            <span className={`px-2 py-0.5 rounded-md text-[10px] border font-sans font-bold ${getBadgeStyle()}`}>
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
