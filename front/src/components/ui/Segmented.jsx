import React from "react";
import clsx from "clsx";

export function Segmented({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-[var(--r-lg)] bg-white/6 p-1 border border-white/10">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={clsx(
              "min-h-[44px] px-4 rounded-[14px] text-[14px] font-medium transition",
              active ? "bg-white/12 text-white" : "text-white/65 hover:text-white hover:bg-white/8"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
