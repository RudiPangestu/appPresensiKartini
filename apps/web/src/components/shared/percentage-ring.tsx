"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

interface PercentageRingProps {
  percentage: number;
  size?: number;
  label?: string;
}

const COLORS = {
  fill: "hsl(var(--primary))",
  empty: "hsl(var(--muted))",
};

/** Donut chart persentase kehadiran individual */
export function PercentageRing({
  percentage,
  size = 120,
  label,
}: PercentageRingProps) {
  const data = [
    { name: "filled", value: percentage },
    { name: "empty", value: 100 - percentage },
  ];

  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ width: size, height: size }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="90%"
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              <Cell fill={COLORS.fill} />
              <Cell fill={COLORS.empty} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold">{percentage}%</span>
        </div>
      </div>
      {label && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
