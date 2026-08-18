'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, ShieldCheck, CalendarCheck, Star, AlertTriangle, IndianRupee,
  CheckCircle2, XCircle, Loader2, Eye, ChevronDown, ChevronUp, MapPin,
  Clock, BadgeCheck, Ban, FileText, TrendingUp, Activity, UserCog,
  MessageSquare, Send,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-green-100 text-green-800 border-green-200',
  COMPLETED: 'bg-gray-100 text-gray-700 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  NO_SHOW: 'bg-orange-100 text-orange-700 border-orange-200',
  OPEN: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  RESOLVED: 'bg-green-100 text-green-800 border-green-200',
  DISMISSED: 'bg-gray-100 text-gray-700 border-gray-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
};

const docTypeBadge: Record<string, string> = {
  AADHAAR: 'bg-indigo-100 text-indigo-800',
  PAN: 'bg-purple-100 text-purple-800',
  DRIVING_LICENSE: 'bg-cyan-100 text-cyan-800',
  PASSPORT: 'bg-amber-100 text-amber-800',
  VOTER_ID: 'bg-teal-100 text-teal-800',
  CERTIFICATE: 'bg-emerald-100 text-emerald-800',
};

const priorityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const fadeVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`h-3.5 w-3.5 ${star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
      ))}
    </div>
  );
}

/* ─────────── OVERVIEW TAB ─────────── */
function OverviewTab() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.admin.dashboard();
        setStats(data);
      } catch {
        toast.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users },
    { label: 'Total Caregivers', value: stats?.totalCaregivers ?? 0, icon: UserCog },
    { label: 'Active Bookings', value: stats?.activeBookings ?? 0, icon: CalendarCheck },
    { label: 'Completed Bookings', value: stats?.completedBookings ?? 0, icon: CheckCircle2 },
    { label: 'Avg Rating', value: stats?.avgRating ?? '—', icon: Star, suffix: '' },
    { label: 'Platform Revenue', value: stats?.platformRevenue ?? 0, icon: IndianRupee, prefix: '₹' },
  ];

  const bookingsByStatus = stats?.bookingsByStatus ?? {};
  const complaintsByStatus = stats?.complaintsByStatus ?? {};
  const caregiversByCity = stats?.caregiversByCity ?? [];
  const maxBooking = Math.max(...Object.values(bookingsByStatus).map(Number), 1);
  const maxComplaint = Math.max(...Object.values(complaintsByStatus).map(Number), 1);

  const statusLabel: Record<string, string> = {
    PENDING: 'Pending', CONFIRMED: 'Confirmed', IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed', CANCELLED: 'Cancelled',
    OPEN: 'Open', RESOLVED: 'Resolved', DISMISSED: 'Dismissed',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <motion.div key={s.label} variants={fadeVariants} initial="hidden" animate="visible">
            <Card className="rounded-2xl card-hover border-0 shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#14532d]/10 flex items-center justify-center shrink-0">
                  <s.icon className="w-5 h-5 text-[#14532d]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold text-foreground">
                    {s.prefix}{typeof s.value === 'number' ? s.value.toLocaleString('en-IN') : s.value}{s.suffix !== undefined ? s.suffix : ''}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Bookings by Status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(bookingsByStatus).map(([status, count]: [string, any]) => (
              <div key={status} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-28 shrink-0">{statusLabel[status] ?? status}</span>
                <Progress value={(Number(count) / maxBooking) * 100} className="h-3 flex-1" />
                <span className="text-sm font-medium w-10 text-right">{count}</span>
              </div>
            ))}
            {Object.keys(bookingsByStatus).length === 0 && <p className="text-sm text-muted-foreground">No booking data yet.</p>}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Complaints by Status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(complaintsByStatus).map(([status, count]: [string, any]) => (
              <div key={status} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-28 shrink-0">{statusLabel[status] ?? status}</span>
                <Progress value={(Number(count) / maxComplaint) * 100} className="h-3 flex-1" />
                <span className="text-sm font-medium w-10 text-right">{count}</span>
              </div>
            ))}
            {Object.keys(complaintsByStatus).length === 0 && <p className="text-sm text-muted-foreground">No complaint data yet.</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-[#14532d]" />Caregivers by City</CardTitle></CardHeader>
        <CardContent>
          {caregiversByCity.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {caregiversByCity.map((c: any) => (
                <div key={c.city} className="flex items-center gap-2 bg-muted/60 rounded-full px-4 py-2">
                  <MapPin className="w-3.5 h-3.5 text-[#a3e635]" />
                  <span className="text-sm font-medium">{c.city}</span>
                  <Badge variant="secondary" className="rounded-full text-xs">{c.count}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No city data available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─────────── USERS TAB ─────────── */
function UsersTab() {
  const [role, setRole] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.users({ role: role || undefined, page, limit: 20 });
      setUsers(res.users ?? []);
      setTotalPages(res.pagination?.totalPages ?? 1);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [role, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const roleFilters = [
    { label: 'All', value: '' },
    { label: 'Family', value: 'FAMILY' },
    { label: 'Caregiver', value: 'CAREGIVER' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {roleFilters.map((f) => (
          <Button
            key={f.value}
            variant={role === f.value ? 'default' : 'outline'}
            size="sm"
            className={role === f.value ? 'bg-[#14532d] hover:bg-[#14532d]/90 text-white rounded-full' : 'rounded-full'}
            onClick={() => { setRole(f.value); setPage(1); }}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : users.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-sm"><CardContent className="py-12 text-center text-muted-foreground">No users found.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <motion.div key={u.id} variants={fadeVariants} initial="hidden" animate="visible">
              <Card className="rounded-2xl card-hover border-0 shadow-sm">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm truncate">{u.name}</span>
                      <Badge className={statusColors[u.role] ?? 'bg-gray-100 text-gray-700'}>{u.role}</Badge>
                      {u.role === 'CAREGIVER' && u.isVerified && <BadgeCheck className="w-4 h-4 text-[#14532d]" />}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>{u.email}</span>
                      <span>{u.phone}</span>
                      <span>Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                    </div>
                    {u.role === 'CAREGIVER' && (
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {u.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{u.city}</span>}
                        {u.rating != null && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" />{Number(u.rating).toFixed(1)}</span>}
                      </div>
                    )}
                    {u.role === 'FAMILY' && u.patientCount != null && (
                      <div className="mt-1 text-xs text-muted-foreground"><Users className="w-3 h-3 inline mr-1" />{u.patientCount} patient{u.patientCount !== 1 ? 's' : ''}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" className="rounded-full" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-muted-foreground px-3">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" className="rounded-full" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

/* ─────────── VERIFICATIONS TAB ─────────── */
function VerificationsTab() {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const fetchVerifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.verifications.list();
      setVerifications(res.verifications ?? []);
    } catch {
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVerifications(); }, [fetchVerifications]);

  const handleApprove = async (id: string) => {
    setApproving(id);
    try {
      await api.admin.verifications.update(id, { status: 'APPROVED' });
      toast.success('Verification approved successfully');
      fetchVerifications();
    } catch {
      toast.error('Failed to approve verification');
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = reasons[id]?.trim();
    if (!reason) { toast.error('Please provide a rejection reason'); return; }
    setRejecting(id);
    try {
      await api.admin.verifications.update(id, { status: 'REJECTED', rejectionReason: reason });
      toast.success('Verification rejected');
      setReasons((prev) => { const n = { ...prev }; delete n[id]; return n; });
      fetchVerifications();
    } catch {
      toast.error('Failed to reject verification');
    } finally {
      setRejecting(null);
    }
  };

  if (loading) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>;
  }

  if (verifications.length === 0) {
    return <Card className="rounded-2xl border-0 shadow-sm"><CardContent className="py-16 text-center"><ShieldCheck className="w-12 h-12 mx-auto text-[#14532d]/30 mb-3" /><p className="text-muted-foreground">No pending verifications.</p></CardContent></Card>;
  }

  return (
    <div className="space-y-3">
      {verifications.map((v) => (
        <motion.div key={v.id} variants={fadeVariants} initial="hidden" animate="visible">
          <Card className="rounded-2xl card-hover border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{v.caregiver?.user?.name ?? 'Caregiver'}</span>
                  <Badge className={docTypeBadge[v.docType] ?? 'bg-gray-100 text-gray-700'}>{v.docType ?? 'DOC'}</Badge>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />{v.createdAt ? new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>
              {v.docNumber && <p className="text-xs text-muted-foreground font-mono bg-muted/50 rounded-lg px-3 py-1.5 w-fit">{v.docNumber}</p>}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  className="bg-[#14532d] hover:bg-[#14532d]/90 text-white rounded-full"
                  disabled={approving === v.id}
                  onClick={() => handleApprove(v.id)}
                >
                  {approving === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-1" />Approve</>}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 rounded-full"
                  disabled={rejecting === v.id}
                  onClick={() => {
                    if (!reasons[v.id]?.trim()) {
                      setReasons((prev) => ({ ...prev, [v.id]: prev[v.id] ?? '' }));
                    } else {
                      handleReject(v.id);
                    }
                  }}
                >
                  {rejecting === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-1" />Reject</>}
                </Button>
              </div>
              {reasons[v.id] !== undefined && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-2">
                  <Textarea
                    placeholder="Enter rejection reason..."
                    value={reasons[v.id]}
                    onChange={(e) => setReasons((prev) => ({ ...prev, [v.id]: e.target.value }))}
                    className="text-sm rounded-xl min-h-[60px] resize-none"
                  />
                  <Button size="sm" variant="destructive" className="rounded-full" disabled={rejecting === v.id} onClick={() => handleReject(v.id)}>
                    {rejecting === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4 mr-1" />}Confirm Rejection
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

/* ─────────── ALL BOOKINGS TAB ─────────── */
function AllBookingsTab() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.admin.users({ role: 'CAREGIVER', limit: 10 });
        const caregivers = res.users ?? [];
        const allBookings: any[] = [];
        await Promise.all(
          caregivers.map(async (c: any) => {
            try {
              const caregiverId = c.caregiverProfile?.id;
              if (!caregiverId) return;
              const bRes = await api.bookings.list({ caregiverId });
              allBookings.push(...(bRes.bookings ?? []).map((b: any) => ({
                ...b,
                caregiverName: b.caregiver?.user?.name ?? c.name,
                patientName: b.patient?.name ?? 'Patient',
                date: b.startDate,
                amount: b.totalAmount,
              })));
            } catch { /* skip */ }
          })
        );
        allBookings.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
        setBookings(allBookings);
      } catch {
        toast.error('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Showing recent platform bookings across caregivers.</p>
      {bookings.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-sm"><CardContent className="py-16 text-center"><CalendarCheck className="w-12 h-12 mx-auto text-[#14532d]/30 mb-3" /><p className="text-muted-foreground">No bookings found.</p></CardContent></Card>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {bookings.map((b) => (
            <motion.div key={b.id} variants={fadeVariants} initial="hidden" animate="visible">
              <Card className="rounded-2xl card-hover border-0 shadow-sm">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{b.patientName ?? 'Patient'}</span>
                      <span className="text-muted-foreground text-xs">→</span>
                      <span className="text-sm text-muted-foreground">{b.caregiverName ?? 'Caregiver'}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {b.date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                      {b.amount != null && <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />{Number(b.amount).toLocaleString('en-IN')}</span>}
                    </div>
                  </div>
                  <Badge className={statusColors[b.status] ?? 'bg-gray-100 text-gray-700'}>{b.status?.replace(/_/g, ' ')}</Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────── REVIEWS TAB ─────────── */
function ReviewsTab() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.reviews.listAll();
        setReviews(res.reviews ?? []);
      } catch {
        toast.error('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>;
  }

  if (reviews.length === 0) {
    return <Card className="rounded-2xl border-0 shadow-sm"><CardContent className="py-16 text-center"><Star className="w-12 h-12 mx-auto text-amber-300 mb-3" /><p className="text-muted-foreground">No reviews found.</p></CardContent></Card>;
  }

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-4 py-2">
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          <span className="text-lg font-bold">{avgRating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({reviews.length} reviews)</span>
        </div>
      </div>
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {reviews.map((r: any, i: number) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="rounded-2xl card-hover border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{r.family?.name || 'Family'}</span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="text-sm text-muted-foreground">{r.caregiver?.user?.name || 'Caregiver'}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <StarRating rating={r.rating || 0} />
                      <span className="text-xs text-muted-foreground">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{r.comment}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-bold text-gray-900">{r.rating || 0}</div>
                    <div className="flex flex-col gap-1 mt-1 text-[10px] text-muted-foreground">
                      <span>Comm: {r.communicationRating || 0}/5</span>
                      <span>Punct: {r.punctualityRating || 0}/5</span>
                      <span>Care: {r.careQualityRating || 0}/5</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─────────── COMPLAINTS TAB ─────────── */
function ComplaintsTab() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolutions, setResolutions] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.complaints.list(params);
      setComplaints(res.complaints ?? []);
    } catch {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const handleResolve = async (id: string) => {
    const resolution = resolutions[id]?.trim();
    if (!resolution) { toast.error('Please enter a resolution message'); return; }
    setActionId(id);
    try {
      await api.complaints.update(id, { status: 'RESOLVED', resolution });
      toast.success('Complaint resolved');
      setResolutions((prev) => { const n = { ...prev }; delete n[id]; return n; });
      setExpandedId(null);
      fetchComplaints();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve complaint');
    } finally {
      setActionId(null);
    }
  };

  const handleDismiss = async (id: string) => {
    const resolution = resolutions[id]?.trim() || 'Complaint dismissed by admin.';
    setActionId(id);
    try {
      await api.complaints.update(id, { status: 'DISMISSED', resolution });
      toast.success('Complaint dismissed');
      setResolutions((prev) => { const n = { ...prev }; delete n[id]; return n; });
      setExpandedId(null);
      fetchComplaints();
    } catch (err: any) {
      toast.error(err.message || 'Failed to dismiss complaint');
    } finally {
      setActionId(null);
    }
  };

  const handleInProgress = async (id: string) => {
    setActionId(id);
    try {
      await api.complaints.update(id, { status: 'IN_PROGRESS' });
      toast.success('Complaint marked as in progress');
      fetchComplaints();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update complaint');
    } finally {
      setActionId(null);
    }
  };

  const openCount = complaints.filter(c => c.status === 'OPEN').length;

  if (loading) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#14532d]/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-[#14532d]" />
          </div>
          <div>
            <p className="font-semibold text-sm">Complaints Management</p>
            <p className="text-xs text-muted-foreground">{complaints.length} total · {openCount} open</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'].map((f) => (
          <Button
            key={f}
            variant={statusFilter === f ? 'default' : 'outline'}
            size="sm"
            className={statusFilter === f ? 'bg-[#14532d] hover:bg-[#14532d]/90 text-white rounded-full' : 'rounded-full'}
            onClick={() => setStatusFilter(f)}
          >
            {f ? f.replace(/_/g, ' ') : 'All'}
          </Button>
        ))}
      </div>

      {complaints.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-sm"><CardContent className="py-16 text-center"><AlertTriangle className="w-12 h-12 mx-auto text-[#14532d]/30 mb-3" /><p className="text-muted-foreground">No complaints found.</p></CardContent></Card>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {complaints.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="rounded-2xl card-hover border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-sm truncate">{c.subject ?? 'Complaint'}</span>
                      <Badge className={statusColors[c.status] ?? 'bg-gray-100 text-gray-700'}>{c.status?.replace(/_/g, ' ')}</Badge>
                      {c.priority && <Badge className={`text-[10px] rounded-full ${priorityColors[c.priority] || ''}`}>{c.priority}</Badge>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>From: {c.family?.name || 'Family'}</span>
                    <span>Against: {c.caregiver?.user?.name || 'Caregiver'}</span>
                    {c.booking && <span>Booking: {c.booking.startDate ? new Date(c.booking.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : c.booking.id.slice(0, 8)}</span>}
                  </div>

                  {c.description && <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>}

                  {c.resolution && (
                    <div className="bg-green-50 rounded-xl p-3 text-xs text-green-700">
                      <p className="font-medium">Resolution:</p>
                      <p className="mt-0.5">{c.resolution}</p>
                    </div>
                  )}

                  {c.status === 'OPEN' && (
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[#14532d] border-[#14532d]/30 hover:bg-[#14532d]/10 rounded-full"
                        disabled={actionId === c.id}
                        onClick={() => handleInProgress(c.id)}
                      >
                        {actionId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5 mr-1" />}
                        In Progress
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[#14532d] hover:bg-[#14532d]/90 text-white rounded-full"
                        disabled={actionId === c.id}
                        onClick={() => { setExpandedId(expandedId === c.id ? null : c.id); }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 rounded-full"
                        disabled={actionId === c.id}
                        onClick={() => { setExpandedId(expandedId === c.id ? null : c.id); }}
                      >
                        <Ban className="w-3.5 h-3.5 mr-1" />Dismiss
                      </Button>
                    </div>
                  )}
                  {expandedId === c.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-2">
                      <Textarea
                        placeholder="Enter resolution message..."
                        value={resolutions[c.id] || ''}
                        onChange={(e) => setResolutions((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        className="text-sm rounded-xl min-h-[80px] resize-none"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="btn-green rounded-full" disabled={actionId === c.id} onClick={() => handleResolve(c.id)}>
                          {actionId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Confirm Resolve</>}
                        </Button>
                        <Button size="sm" variant="destructive" className="rounded-full" disabled={actionId === c.id} onClick={() => handleDismiss(c.id)}>
                          {actionId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Ban className="w-3.5 h-3.5 mr-1" />Confirm Dismiss</>}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setExpandedId(null)} className="rounded-full">Cancel</Button>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────── MAIN COMPONENT ─────────── */
export function AdminDashboard({ activeTab }: { activeTab: string }) {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-background">
      <ScrollArea className="h-full">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#14532d] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {user?.name ?? 'Admin'}</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && <motion.div key="overview" variants={fadeVariants} initial="hidden" animate="visible" exit="exit"><OverviewTab /></motion.div>}
            {activeTab === 'users' && <motion.div key="users" variants={fadeVariants} initial="hidden" animate="visible" exit="exit"><UsersTab /></motion.div>}
            {activeTab === 'verifications' && <motion.div key="verifications" variants={fadeVariants} initial="hidden" animate="visible" exit="exit"><VerificationsTab /></motion.div>}
            {activeTab === 'all-bookings' && <motion.div key="all-bookings" variants={fadeVariants} initial="hidden" animate="visible" exit="exit"><AllBookingsTab /></motion.div>}
            {activeTab === 'reviews' && <motion.div key="reviews" variants={fadeVariants} initial="hidden" animate="visible" exit="exit"><ReviewsTab /></motion.div>}
            {activeTab === 'complaints' && <motion.div key="complaints" variants={fadeVariants} initial="hidden" animate="visible" exit="exit"><ComplaintsTab /></motion.div>}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
