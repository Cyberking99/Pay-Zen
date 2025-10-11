"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  History,
  Home,
  LinkIcon,
  LogOut,
  Send,
  Settings,
  Wallet,
  Menu,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, authenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Send Money", href: "/send", icon: Send },
    { name: "Payment Links", href: "/payment-links", icon: LinkIcon },
    { name: "Transaction History", href: "/history", icon: History },
    { name: "Manage Links", href: "/manage-links", icon: Settings },
  ];

  // Generate breadcrumbs based on current path
  const getBreadcrumbs = () => {
    const pathSegments = pathname.split("/").filter(Boolean);
    const breadcrumbs = [{ name: "Dashboard", href: "/dashboard" }];
    if (pathSegments.length > 1) {
      const currentPage = navigation.find((item) => item.href === pathname);
      if (currentPage) {
        breadcrumbs.push({ name: currentPage.name, href: pathname });
      }
    }
    return breadcrumbs;
  };
  const breadcrumbs = getBreadcrumbs();

  console.log("profile", user);

  if (!user && !authenticated) {
    toast.error("Please login to continue");
    router.push("/");
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-white">Loading...</span>
        </div>
      </div>
    );
  }

  const profile = JSON.parse(localStorage.getItem("user") || "{}");
  console.log("profile", profile);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b border-slate-700/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">PayZen</h1>
              <p className="text-xs text-slate-400">Blockchain Payments</p>
            </div>
          </div>
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-3 transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-teal-500/20 to-emerald-500/20 text-white border border-teal-500/30 shadow-lg"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50 hover:border-slate-600/30"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                    {isActive && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-teal-400" />
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>
          {/* User profile section */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-slate-800/30">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {profile.fullName?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile.fullName || "User"}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  @{profile.username || "username"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={logout}
              className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header with breadcrumbs */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">PayZen</span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
        {/* Desktop breadcrumb navigation */}
        <div className="hidden lg:block p-6 pb-0">
          <nav className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={breadcrumb.href} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-slate-500 mx-2" />
                )}
                <Link
                  href={breadcrumb.href}
                  className={`transition-colors ${
                    index === breadcrumbs.length - 1
                      ? "text-white font-medium"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {breadcrumb.name}
                </Link>
              </div>
            ))}
          </nav>
        </div>
        {/* Page content */}
        <main className="p-6 lg:pt-4">{children}</main>
      </div>
    </div>
  );
}
