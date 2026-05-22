import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/types/database";

const statusConfig: Record<
  AttendanceStatus,
  { label: string; className: string }
> = {
  hadir: {
    label: "Hadir",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  sakit: {
    label: "Sakit",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  },
  izin: {
    label: "Izin",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  alpha: {
    label: "Alpha",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  },
};

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus;
  className?: string;
}

/** Badge warna untuk status kehadiran: Hadir=hijau, Sakit=kuning, Izin=biru, Alpha=merah */
export function AttendanceStatusBadge({
  status,
  className,
}: AttendanceStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
