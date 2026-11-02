"use client";

import React from "react";

interface PalmOilLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export default function PalmOilLogo({
  size = "md",
  showText = true,
  className = "",
}: PalmOilLogoProps) {
  const sizeMap = {
    sm: { icon: 28, title: "text-xs", sub: "text-[9px]" },
    md: { icon: 34, title: "text-sm", sub: "text-[10px]" },
    lg: { icon: 42, title: "text-base", sub: "text-xs" },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Minimalist Corporate Financial Mark */}
      <div
        className="flex items-center justify-center rounded-lg bg-emerald-600 text-white flex-shrink-0 shadow-xs"
        style={{ width: currentSize.icon, height: currentSize.icon }}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
        >
          {/* Three Clean Financial Candlestick / Bars (SMAR, AALI, SIMP) */}
          <rect x="6" y="14" width="3.5" height="12" rx="0.75" fill="white" fillOpacity="0.7" />
          <rect x="12" y="10" width="3.5" height="16" rx="0.75" fill="white" fillOpacity="0.85" />
          <rect x="18" y="6" width="3.5" height="20" rx="0.75" fill="white" />
          
          {/* Minimalist Palm Leaf Vector Slash */}
          <path
            d="M8 8C14 7 24 9 26 18C23 18 19 16 16 13C13 16 9 17 8 8Z"
            fill="#a7f3d0"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-bold tracking-tight text-white ${currentSize.title}`}>
              Palm Oil
            </span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-1.5 py-0.5 bg-emerald-950/80 rounded border border-emerald-800/60">
              Analytics
            </span>
          </div>
          <span className={`text-slate-400 font-medium ${currentSize.sub}`}>
            VAR / VECM System
          </span>
        </div>
      )}
    </div>
  );
}
