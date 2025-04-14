import React from "react";

export function Badge({ variant = "default", className, ...props }) {
  const variantClasses = {
    default: "bg-gray-100 text-gray-800",
    secondary: "bg-gray-100 text-gray-800",
    outline: "border border-gray-200 text-gray-800",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        variantClasses[variant] || variantClasses.default
      } ${className || ""}`}
      {...props}
    />
  );
}