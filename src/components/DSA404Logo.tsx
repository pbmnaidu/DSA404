import React from "react";
import { ThemedLogo } from "@/components/ThemedLogo";

interface DSA404LogoProps {
  className?: string;
  size?: number;
  circular?: boolean;
}

export function DSA404Logo({ className = "", size = 40, circular = true }: DSA404LogoProps) {
  return (
    <div
      className={`relative overflow-hidden shrink-0 flex items-center justify-center bg-transparent ${circular ? "rounded-full" : ""} ${className}`}
      style={{ width: size, height: size }}
    >
      <ThemedLogo className={`size-full ${circular ? "" : "themed-logo--square"}`} />
    </div>
  );
}
