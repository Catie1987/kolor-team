import React from 'react';

interface DonutChartCompletionProps {
  completionRate: number; // Percentage from 0 to 100
  size?: number;          // Total width/height in pixels
  strokeWidth?: number;   // Thickness of the donut ring
}

export default function DonutChartCompletion({
  completionRate,
  size = 120,
  strokeWidth = 12,
}: DonutChartCompletionProps) {
  // Ensure the rate stays between 0 and 100
  const rate = Math.max(0, Math.min(100, completionRate));
  
  // SVG geometry constants
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate how much of the ring to fill
  const strokeDashoffset = circumference - (rate / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="#e5e7eb" /* Tailwind gray-200 */
          strokeWidth={strokeWidth}
        />
        {/* Progress Indicator */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="var(--chart-2)" /* Tailwind Emerald */
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
    </div>
  );
}