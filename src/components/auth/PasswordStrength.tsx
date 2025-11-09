"use client";

import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password?: string;
}

export default function PasswordStrength({ password = "" }: PasswordStrengthProps) {
  const checkStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/\d/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = checkStrength();
  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];
  
  const getBarColor = (index: number) => {
    if (strength > index) {
      if (strength === 1) return "bg-red-500";
      if (strength === 2) return "bg-orange-500";
      if (strength === 3) return "bg-yellow-500";
      if (strength === 4) return "bg-green-500";
    }
    return "bg-muted";
  };

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-x-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={cn("h-1 rounded-full", getBarColor(index))}
          />
        ))}
      </div>
      <p className="text-xs font-medium text-muted-foreground">
        Password strength:{" "}
        <span
          className={cn({
            "text-red-500": strength === 1,
            "text-orange-500": strength === 2,
            "text-yellow-500": strength === 3,
            "text-green-500": strength === 4,
          })}
        >
          {strengthLabels[strength - 1] || "Very Weak"}
        </span>
      </p>
    </div>
  );
}
