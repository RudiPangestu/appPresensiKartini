"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TrendDataPoint {
  label: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  persen_hadir: number;
}

interface AttendanceTrendChartProps {
  data: TrendDataPoint[];
  title?: string;
  /** Tampilkan persentase di Y axis kanan? */
  showPercentage?: boolean;
}

const STATUS_COLORS = {
  hadir: "#22c55e",
  sakit: "#eab308",
  izin: "#3b82f6",
  alpha: "#ef4444",
  persen_hadir: "#8b5cf6",
};

/**
 * Komponen chart tren kehadiran (Recharts LineChart).
 * Menampilkan jumlah hadir/sakit/izin/alpha beserta garis persentase kehadiran.
 */
export function AttendanceTrendChart({
  data,
  title = "Tren Kehadiran",
  showPercentage = true,
}: AttendanceTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">
            Tidak ada data untuk periode ini
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" className="text-xs" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="count" className="text-xs" />
              {showPercentage && (
                <YAxis yAxisId="persen" orientation="right" domain={[0, 100]} className="text-xs" unit="%" />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend />
              <Line yAxisId="count" type="monotone" dataKey="hadir" name="Hadir" stroke={STATUS_COLORS.hadir} strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="count" type="monotone" dataKey="sakit" name="Sakit" stroke={STATUS_COLORS.sakit} strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="count" type="monotone" dataKey="izin" name="Izin" stroke={STATUS_COLORS.izin} strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="count" type="monotone" dataKey="alpha" name="Alpha" stroke={STATUS_COLORS.alpha} strokeWidth={2} dot={{ r: 3 }} />
              {showPercentage && (
                <Line yAxisId="persen" type="monotone" dataKey="persen_hadir" name="% Hadir" stroke={STATUS_COLORS.persen_hadir} strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 4 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export type { TrendDataPoint };
