'use client';

import { useState, useCallback } from 'react';

import {
  Heart,
  LayoutDashboard,
  Users,
  Search,
  CalendarCheck,
  FileText,
  Star,
  AlertTriangle,
  User,
  LogOut,
  Menu,
  X,
  UserCog,
  ClipboardList,
  MessageSquare,
  ChevronRight,
  Bell,
  ShieldCheck,
  KeyRound,
  Loader2,
  IndianRupee,
  Wallet,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore, type User } from '@/stores/authStore';
import { signOut } from 'next-auth/react';
import { FamilyDashboard } from './FamilyDashboard';
import { CaregiverDashboard } from './CaregiverDashboard';
import { AdminDashboard } from './AdminDashboard';

type NavItem = {
  label: string;
  key: string;
  icon: React.ReactNode;
};

const familyNavItems: NavItem[] = [
  { label: 'Overview', key: 'overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Members', key: 'patients', icon: <Users className="h-4 w-4" /> },
  { label: 'Find Caregivers', key: 'find-caregivers', icon: <Search className="h-4 w-4" /> },
  { label: 'My Bookings', key: 'bookings', icon: <CalendarCheck className="h-4 w-4" /> },
  { label: 'Payments', key: 'payments', icon: <IndianRupee className="h-4 w-4" /> },
  { label: 'Care Reports', key: 'reports', icon: <FileText className="h-4 w-4" /> },
  { label: 'Reviews', key: 'reviews', icon: <Star className="h-4 w-4" /> },
  { label: 'Complaints', key: 'complaints', icon: <AlertTriangle className="h-4 w-4" /> },
];

const adminNavItems: NavItem[] = [
  { label: 'Overview', key: 'overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Users', key: 'users', icon: <Users className="h-4 w-4" /> },
  { label: 'Verifications', key: 'verifications', icon: <ShieldCheck className="h-4 w-4" /> },
  { label: 'All Bookings', key: 'all-bookings', icon: <CalendarCheck className="h-4 w-4" /> },
  { label: 'Reviews', key: 'reviews', icon: <Star className="h-4 w-4" /> },
  { label: 'Complaints', key: 'complaints', icon: <AlertTriangle className="h-4 w-4" /> },
];

const caregiverNavItems: NavItem[] = [
  { label: 'Overview', key: 'overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'My Profile', key: 'my-profile', icon: <UserCog className="h-4 w-4" /> },
  { label: 'My Bookings', key: 'bookings', icon: <CalendarCheck className="h-4 w-4" /> },
  { label: 'Earnings', key: 'earnings', icon: <Wallet className="h-4 w-4" /> },
  { label: 'Submit Report', key: 'submit-report', icon: <ClipboardList className="h-4 w-4" /> },
  { label: 'My Reviews', key: 'reviews', icon: <MessageSquare className="h-4 w-4" /> },
  { label: 'Complaints', key: 'complaints', icon: <AlertTriangle className="h-4 w-4" /> },
];

interface DashboardShellProps {
  onBack: () => void;
}

export default function DashboardShell({ onBack }: DashboardShellProps) {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  // Change password state
  const [pwdDialogOpen, setPwdDialogOpen] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');

  const handleChangePassword = async () => {
    if (!user?.id) return;
    if (!pwdCurrent || !pwdNew || !pwdConfirm) { toast.error('All fields are required'); return; }
    if (pwdNew !== pwdConfirm) { toast.error('New passwords do not match'); return; }
    if (pwdNew.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    setPwdSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, currentPassword: pwdCurrent, newPassword: pwdNew }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to change password'); return; }
      toast.success('Password changed successfully!');
      setPwdDialogOpen(false);
      setPwdCurrent(''); setPwdNew(''); setPwdConfirm('');
    } catch { toast.error('Something went wrong'); } finally { setPwdSaving(false); }
  };

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setNotifLoading(true);
    try {
      const res = await api.notifications.list(user.id);
      setNotifications(res.notifications || []);
    } catch {}
    finally { setNotifLoading(false); }
  }, [user?.id]);

  const navItems = user?.role === 'ADMIN' ? adminNavItems : user?.role === 'CAREGIVER' ? caregiverNavItems : familyNavItems;

  const pageTitle = navItems.find((n) => n.key === activeTab)?.label || 'Dashboard';

  const handleNavClick = (key: string) => {
    setActiveTab(key);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    clearAuth();
    await signOut({ callbackUrl: '/', redirect: false });
    onBack();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderNavList = (onSelect: (key: string) => void) => (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => (
        <button
          key={item.key}
          onClick={() => onSelect(item.key)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left ${
            activeTab === item.key
              ? 'bg-forest-900 text-white shadow-md shadow-forest-900/20'
              : 'text-gray-600 hover:bg-forest-50 hover:text-forest-800'
          }`}
        >
          <span className={activeTab === item.key ? 'text-lime-400' : 'text-gray-400'}>
            {item.icon}
          </span>
          {item.label}
          {activeTab === item.key && (
            <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-70" />
          )}
        </button>
      ))}
    </nav>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-900 group-hover:bg-forest-800 transition-colors">
            <Heart className="h-4 w-4 text-white fill-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            SevaSaathi
          </span>
        </button>
      </div>

      <Separator className="bg-gray-100" />

      {/* Navigation */}
      <div className="flex-1 py-4 overflow-y-auto">
        <p className="px-6 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Navigation
        </p>
        {renderNavList(handleNavClick)}
      </div>

      <Separator className="bg-gray-100" />

      {/* User info */}
      <div className="p-4">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-gray-50">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-forest-900 text-white text-xs font-semibold">
              {user ? getInitials(user.name) : '??'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : 'Member'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={() => setPwdDialogOpen(true)}
          className="w-full mt-2 text-gray-500 hover:text-forest-700 hover:bg-forest-50 justify-start gap-2 rounded-xl px-3"
        >
          <KeyRound className="h-4 w-4" />
          Change Password
        </Button>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full mt-1 text-red-500 hover:text-red-600 hover:bg-red-50 justify-start gap-2 rounded-xl px-3"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50/50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-100 flex-col fixed top-0 left-0 h-screen z-40">
        <SidebarContent />
      </aside>

      {/* Main Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile menu */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <SidebarContent />
                </SheetContent>
              </Sheet>

              <div>
                <h1 className="text-lg font-bold text-gray-900">{pageTitle}</h1>
                <p className="text-xs text-gray-400 hidden sm:block">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Popover open={notifOpen} onOpenChange={(open) => { setNotifOpen(open); if (open) fetchNotifications(); }}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl relative"
                  >
                    <Bell className="h-4.5 w-4.5" />
                    {notifications.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-lime-400 rounded-full" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0 rounded-2xl">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-800">Notifications</h4>
                    {notifications.length > 0 && (
                      <span className="text-xs text-forest-600 font-medium">{notifications.length} new</span>
                    )}
                  </div>
                  <ScrollArea className="h-72">
                    {notifLoading ? (
                      <div className="p-4 text-center text-sm text-gray-400">Loading...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No new notifications</p>
                        <p className="text-xs text-gray-400 mt-1">We will notify you about bookings and updates</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {notifications.map((n: any) => (
                          <div key={n.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                            <p className="text-sm font-medium text-gray-800">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <div className="hidden sm:flex items-center gap-2 ml-2 cursor-pointer hover:bg-gray-50 rounded-xl px-2 py-1 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-forest-900 text-white text-xs font-semibold">
                        {user ? getInitials(user.name) : '??'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                      {user?.name}
                    </span>
                  </div>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56 p-2 rounded-2xl">
                  <button onClick={() => setPwdDialogOpen(true)} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:text-forest-800 hover:bg-forest-50 rounded-xl transition-colors">
                    <KeyRound className="h-4 w-4" /> Change Password
                  </button>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </header>

        {/* Change Password Dialog */}
        <Dialog open={pwdDialogOpen} onOpenChange={setPwdDialogOpen}>
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-forest-800" /> Change Password</DialogTitle>
              <DialogDescription>Update your account password</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
                <input type="password" value={pwdCurrent} onChange={(e) => setPwdCurrent(e.target.value)} placeholder="Enter current password" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                <input type="password" value={pwdNew} onChange={(e) => setPwdNew(e.target.value)} placeholder="Min 6 characters" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
                <input type="password" value={pwdConfirm} onChange={(e) => setPwdConfirm(e.target.value)} placeholder="Re-enter new password" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setPwdDialogOpen(false)} className="flex-1 rounded-full">Cancel</Button>
                <Button onClick={handleChangePassword} disabled={pwdSaving} className="btn-black flex-1 text-sm gap-2">
                  {pwdSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Update Password
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6">
          {user?.role === 'ADMIN' ? (
            <AdminDashboard activeTab={activeTab} />
          ) : user?.role === 'CAREGIVER' ? (
            <CaregiverDashboard activeTab={activeTab} user={user} />
          ) : (
            <FamilyDashboard activeTab={activeTab} />
          )}
        </main>
      </div>
    </div>
  );
}
