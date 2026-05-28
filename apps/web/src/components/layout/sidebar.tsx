"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import {
  LayoutDashboard,
  Users,
  School,
  GraduationCap,
  BookOpen,
  CalendarDays,
  FileBarChart,
  Bell,
  ClipboardCheck,
  History,
  Home,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

/** Menu navigasi berdasarkan role user */
const menuByRole: Record<string, NavItem[]> = {
  admin: [
    { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { title: "Users", href: "/admin/users", icon: Users },
    { title: "Tahun Ajaran", href: "/admin/tahun-ajaran", icon: CalendarDays },
    { title: "Kelas", href: "/admin/kelas", icon: School },
    { title: "Siswa", href: "/admin/siswa", icon: GraduationCap },
    { title: "Guru", href: "/admin/guru", icon: UserCircle },
    { title: "Mata Pelajaran", href: "/admin/mata-pelajaran", icon: BookOpen },
    { title: "Kegiatan", href: "/admin/kegiatan", icon: CalendarDays },
    { title: "Laporan", href: "/admin/laporan", icon: FileBarChart },
    { title: "Notifikasi", href: "/admin/notifikasi", icon: Bell },
  ],
  guru: [
    { title: "Dashboard", href: "/guru", icon: LayoutDashboard },
    { title: "Input Presensi", href: "/guru/presensi", icon: ClipboardCheck },
    { title: "Riwayat", href: "/guru/history", icon: History },
  ],
  ortu: [
    { title: "Dashboard", href: "/ortu", icon: Home },
    { title: "Kehadiran", href: "/ortu/kehadiran", icon: ClipboardCheck },
    { title: "Profil", href: "/ortu/profil", icon: UserCircle },
  ],
};

/** Sidebar navigasi responsif dengan role-based menu */
export function Sidebar() {
  const pathname = usePathname();
  const { role, loading } = useUser();

  const navItems = role ? menuByRole[role] || [] : [];

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50">
      <div className="flex flex-col flex-grow bg-card border-r overflow-y-auto">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            SK
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">SMA Kartini</h1>
            <p className="text-xs text-muted-foreground">Sistem Presensi</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {loading ? (
            // Skeleton loading
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 rounded-md bg-muted animate-pulse"
              />
            ))
          ) : (
            navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== `/${role}` && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.title}
                </Link>
              );
            })
          )}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t">
          <p className="text-xs text-muted-foreground">
            © 2026 SMA Kartini Batam
          </p>
        </div>
      </div>
    </aside>
  );
}

/** Sidebar mobile (sebagai sheet/drawer) */
export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { role } = useUser();
  const navItems = role ? menuByRole[role] || [] : [];

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-64 bg-card border-r z-50 md:hidden animate-in slide-in-from-left">
        <div className="flex items-center gap-3 px-6 py-5 border-b">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            SK
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">SMA Kartini</h1>
            <p className="text-xs text-muted-foreground">Sistem Presensi</p>
          </div>
        </div>
        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== `/${role}` && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
