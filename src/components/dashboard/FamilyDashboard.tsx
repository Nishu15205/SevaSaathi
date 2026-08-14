'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  CalendarCheck,
  FileText,
  Star,
  AlertTriangle,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  ShieldCheck,
  Clock,
  MapPin,
  IndianRupee,
  Send,
  Heart,
  Smile,
  Frown,
  Meh,
  Utensils,
  Pill,
  Activity,
  MessageCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserRound,
  Phone,
  Mail,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface FamilyDashboardProps {
  activeTab: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-green-100 text-green-800 border-green-200',
  COMPLETED: 'bg-gray-100 text-gray-700 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  NO_SHOW: 'bg-orange-100 text-orange-700 border-orange-200',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-700',
};

const complaintStatusColors: Record<string, string> = {
  OPEN: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-green-100 text-green-800',
  DISMISSED: 'bg-gray-100 text-gray-500',
};

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-forest-50 flex items-center justify-center mb-4 text-forest-400">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 max-w-sm">{description}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4 text-red-400">
        <AlertCircle className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-gray-800 mb-1">Something went wrong</h3>
      <p className="text-sm text-gray-400 max-w-sm mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="rounded-xl">
          Try Again
        </Button>
      )}
    </div>
  );
}

function LoadingGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-2xl" />
      ))}
    </div>
  );
}

function LoadingCards({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-2xl" />
      ))}
    </div>
  );
}

/* ============================================================ */
/* OVERVIEW TAB                                                  */
/* ============================================================ */
function OverviewTab() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState({ patients: 0, activeBookings: 0, reports: 0, pendingReviews: 0 });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const [patientsRes, bookingsRes] = await Promise.all([
        api.patients.list(user.id),
        api.bookings.list({ familyId: user.id }),
      ]);

      const patients = patientsRes.patients || [];
      const bookings = bookingsRes.bookings || [];

      const activeBookings = bookings.filter((b: any) => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status));
      const totalReports = bookings.reduce((acc: number, b: any) => acc + (b.careReports?.length || 0), 0);
      const completedWithoutReview = bookings.filter(
        (b: any) => b.status === 'COMPLETED' && (!b.reviews || b.reviews.length === 0)
      ).length;

      setStats({
        patients: patients.length,
        activeBookings: activeBookings.length,
        reports: totalReports,
        pendingReviews: completedWithoutReview,
      });
      setRecentBookings(bookings.slice(0, 5));
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingGrid count={4} />
        <div>
          <Skeleton className="h-6 w-40 mb-3" />
          <LoadingCards count={3} />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  const statCards = [
    { label: 'Total Patients', value: stats.patients, icon: <Users className="h-5 w-5" />, color: 'bg-forest-50 text-forest-700' },
    { label: 'Active Bookings', value: stats.activeBookings, icon: <CalendarCheck className="h-5 w-5" />, color: 'bg-blue-50 text-blue-700' },
    { label: 'Care Reports', value: stats.reports, icon: <FileText className="h-5 w-5" />, color: 'bg-amber-50 text-amber-700' },
    { label: 'Pending Reviews', value: stats.pendingReviews, icon: <Star className="h-5 w-5" />, color: 'bg-lime-50 text-lime-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h2>
        <p className="text-sm text-gray-400 mt-1">Here's what's happening with your care requests.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="rounded-2xl border-gray-100 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-3">Recent Bookings</h3>
        {recentBookings.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="h-7 w-7" />}
            title="No bookings yet"
            description="Find a caregiver and book your first care session."
          />
        ) : (
          <div className="space-y-3">
            {recentBookings.map((booking: any) => (
              <Card key={booking.id} className="rounded-2xl border-gray-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center shrink-0">
                        <UserRound className="h-5 w-5 text-forest-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {booking.patient?.name || 'Patient'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {booking.caregiver?.user?.name || 'Caregiver'} &middot; {booking.shiftType?.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="outline" className={`text-[11px] rounded-full ${statusColors[booking.status] || ''}`}>
                        {booking.status}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">
                        {booking.totalAmount ? `₹${booking.totalAmount}` : '--'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================ */
/* PATIENTS TAB                                                 */
/* ============================================================ */
function PatientsTab() {
  const user = useAuthStore((s) => s.user);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '', age: '', gender: '', relationship: '', address: '', city: '',
    pincode: '', mobilityStatus: '', medicalHistory: '', careRequirements: '',
    emergencyName: '', emergencyPhone: '',
  });

  const fetchPatients = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.patients.list(user.id);
      setPatients(res.patients || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSubmitting(true);
    try {
      await api.patients.create({
        familyId: user.id,
        name: form.name,
        age: parseInt(form.age, 10) || 0,
        gender: form.gender,
        relationship: form.relationship,
        address: form.address,
        city: form.city,
        pincode: form.pincode || undefined,
        mobilityStatus: form.mobilityStatus || 'mobile',
        medicalHistory: form.medicalHistory,
        careRequirements: form.careRequirements,
        emergencyContact: JSON.stringify({ name: form.emergencyName, phone: form.emergencyPhone }),
      });
      toast.success('Patient profile created successfully!');
      setModalOpen(false);
      setForm({
        name: '', age: '', gender: '', relationship: '', address: '', city: '',
        pincode: '', mobilityStatus: '', medicalHistory: '', careRequirements: '',
        emergencyName: '', emergencyPhone: '',
      });
      fetchPatients();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create patient');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingCards count={3} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchPatients} />;
  }

  const mobilityLabel: Record<string, string> = {
    mobile: 'Mobile', bedridden: 'Bedridden', limited: 'Limited Mobility', wheelchair: 'Wheelchair',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Patient Profiles</h2>
          <p className="text-sm text-gray-400">Manage care recipients in your family.</p>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="btn-black text-sm gap-2">
              <Plus className="h-4 w-4" /> Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs font-medium text-gray-600">Full Name *</Label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    placeholder="Patient name"
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Age *</Label>
                  <Input
                    required
                    type="number"
                    min={0}
                    max={150}
                    value={form.age}
                    onChange={(e) => updateForm('age', e.target.value)}
                    placeholder="Age"
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Gender *</Label>
                  <Select value={form.gender} onValueChange={(v) => updateForm('gender', v)}>
                    <SelectTrigger className="mt-1 rounded-xl">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Relationship *</Label>
                  <Select value={form.relationship} onValueChange={(v) => updateForm('relationship', v)}>
                    <SelectTrigger className="mt-1 rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mother">Mother</SelectItem>
                      <SelectItem value="father">Father</SelectItem>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Mobility Status</Label>
                  <Select value={form.mobilityStatus} onValueChange={(v) => updateForm('mobilityStatus', v)}>
                    <SelectTrigger className="mt-1 rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="bedridden">Bedridden</SelectItem>
                      <SelectItem value="limited">Limited Mobility</SelectItem>
                      <SelectItem value="wheelchair">Wheelchair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs font-medium text-gray-600">Address *</Label>
                  <Input
                    required
                    value={form.address}
                    onChange={(e) => updateForm('address', e.target.value)}
                    placeholder="Full address"
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">City *</Label>
                  <Input
                    required
                    value={form.city}
                    onChange={(e) => updateForm('city', e.target.value)}
                    placeholder="e.g., Delhi"
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Pincode</Label>
                  <Input
                    value={form.pincode}
                    onChange={(e) => updateForm('pincode', e.target.value)}
                    placeholder="e.g., 110001"
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs font-medium text-gray-600">Medical History</Label>
                  <Textarea
                    value={form.medicalHistory}
                    onChange={(e) => updateForm('medicalHistory', e.target.value)}
                    placeholder="List conditions, allergies, past surgeries..."
                    className="mt-1 rounded-xl min-h-[80px]"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs font-medium text-gray-600">Care Requirements</Label>
                  <Textarea
                    value={form.careRequirements}
                    onChange={(e) => updateForm('careRequirements', e.target.value)}
                    placeholder="Describe specific care needs..."
                    className="mt-1 rounded-xl min-h-[80px]"
                  />
                </div>
              </div>
              <Separator />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Emergency Contact</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-gray-600">Contact Name</Label>
                  <Input
                    value={form.emergencyName}
                    onChange={(e) => updateForm('emergencyName', e.target.value)}
                    placeholder="Emergency contact name"
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Phone</Label>
                  <Input
                    value={form.emergencyPhone}
                    onChange={(e) => updateForm('emergencyPhone', e.target.value)}
                    placeholder="+91 98765 43210"
                    className="mt-1 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="btn-black text-sm gap-2">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add Patient
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {patients.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="No patients added yet"
          description="Add a patient profile to start booking care services."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patients.map((patient: any, i: number) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="rounded-2xl border-gray-100 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-forest-50 flex items-center justify-center shrink-0">
                        <UserRound className="h-5 w-5 text-forest-700" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{patient.name}</p>
                        <p className="text-xs text-gray-400">
                          {patient.age} yrs, {patient.gender} &middot; {patient.relationship}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[11px] rounded-full border-forest-200 text-forest-700 bg-forest-50 whitespace-nowrap">
                      {mobilityLabel[patient.mobilityStatus] || patient.mobilityStatus}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{patient.city}</span>
                    <span className="flex items-center gap-1"><CalendarCheck className="h-3 w-3" />{patient._count?.bookings || 0} bookings</span>
                  </div>
                  {patient.medicalHistory && patient.medicalHistory !== 'null' && patient.medicalHistory !== '[]' && (() => {
                    let conditions: any[] = [];
                    try { conditions = JSON.parse(typeof patient.medicalHistory === 'string' ? patient.medicalHistory : JSON.stringify(patient.medicalHistory)); } catch {}
                    if (!Array.isArray(conditions) || conditions.length === 0) return null;
                    return (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {conditions.map((c: any, ci: number) => (
                          <span key={ci} className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                            {c.condition || c.name || `Condition ${ci + 1}`}{c.since ? ` (since ${c.since})` : ''}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================ */
/* FIND CAREGIVERS TAB                                          */
/* ============================================================ */
function FindCaregiversTab() {
  const user = useAuthStore((s) => s.user);
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [bookingCaregiver, setBookingCaregiver] = useState<any>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    patientId: '', shiftType: 'TWELVE_HOUR', startDate: '', endDate: '', startTime: '08:00', endTime: '20:00', familyNotes: '',
  });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);

  const [form, setForm] = useState({
    city: '', skills: '', shiftType: '', date: '', patientAge: '', mobilityStatus: '',
  });

  useEffect(() => {
    if (!user?.id) return;
    api.patients.list(user.id).then(r => setPatients(r.patients || [])).catch(() => {});
  }, [user?.id]);

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !bookingCaregiver) return;
    setBookingSubmitting(true);
    try {
      await api.bookings.create({
        patientId: bookingForm.patientId,
        caregiverId: bookingCaregiver.id,
        familyId: user.id,
        shiftType: bookingForm.shiftType,
        startDate: bookingForm.startDate,
        endDate: bookingForm.endDate || null,
        startTime: bookingForm.startTime,
        endTime: bookingForm.endTime,
        careRequirements: { needs: bookingCaregiver.skills || [] },
        familyNotes: bookingForm.familyNotes,
      });
      toast.success('Booking created successfully!');
      setBookingModalOpen(false);
      setBookingCaregiver(null);
      setBookingForm({ patientId: '', shiftType: 'TWELVE_HOUR', startDate: '', endDate: '', startTime: '08:00', endTime: '20:00', familyNotes: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create booking');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = {};
      if (form.city) params.city = form.city;
      if (form.skills) params.skills = form.skills;
      if (form.shiftType) params.shiftType = form.shiftType;
      if (form.date) params.date = form.date;
      if (form.patientAge) params.patientAge = parseInt(form.patientAge, 10);
      if (form.mobilityStatus) params.mobilityStatus = form.mobilityStatus;

      const res = await api.caregivers.search(params as any);
      setResults(res.results || []);
      setTotal(res.total || 0);
      setSearched(true);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Find Caregivers</h2>
        <p className="text-sm text-gray-400">Search and match with verified caregivers near you.</p>
      </div>

      {/* Search Form */}
      <Card className="rounded-2xl border-gray-100">
        <CardContent className="p-5">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-medium text-gray-600">City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => updateForm('city', e.target.value)}
                  placeholder="e.g., Delhi"
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Skills (comma separated)</Label>
                <Input
                  value={form.skills}
                  onChange={(e) => updateForm('skills', e.target.value)}
                  placeholder="e.g., elderly-care, feeding"
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Shift Type</Label>
                <Select value={form.shiftType} onValueChange={(v) => updateForm('shiftType', v)}>
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue placeholder="Any shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAY_SHIFT">Day Shift</SelectItem>
                    <SelectItem value="NIGHT_SHIFT">Night Shift</SelectItem>
                    <SelectItem value="TWELVE_HOUR">12 Hour</SelectItem>
                    <SelectItem value="TWENTY_FOUR_HOUR">24 Hour</SelectItem>
                    <SelectItem value="HOURLY">Hourly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Preferred Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateForm('date', e.target.value)}
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Patient Age</Label>
                <Input
                  type="number"
                  min={0}
                  max={150}
                  value={form.patientAge}
                  onChange={(e) => updateForm('patientAge', e.target.value)}
                  placeholder="e.g., 72"
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Mobility Status</Label>
                <Select value={form.mobilityStatus} onValueChange={(v) => updateForm('mobilityStatus', v)}>
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="bedridden">Bedridden</SelectItem>
                    <SelectItem value="limited">Limited</SelectItem>
                    <SelectItem value="wheelchair">Wheelchair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="btn-black text-sm gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search Caregivers
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && <ErrorState message={error} />}

      {loading && <LoadingCards count={3} />}

      {!loading && searched && results.length === 0 && (
        <EmptyState
          icon={<Search className="h-7 w-7" />}
          title="No caregivers found"
          description="Try adjusting your search criteria to find more matches."
        />
      )}

      {!loading && !error && results.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-3">{total} caregiver{total !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((caregiver: any, i: number) => (
              <motion.div
                key={caregiver.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="rounded-2xl border-gray-100 hover:shadow-md transition-shadow h-full flex flex-col">
                  <CardContent className="p-5 flex flex-col flex-1">
                    {/* Match Score */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500">Match Score</span>
                        <span className={`text-sm font-bold ${caregiver.matchScore >= 70 ? 'text-forest-700' : caregiver.matchScore >= 40 ? 'text-amber-600' : 'text-gray-500'}`}>
                          {caregiver.matchScore}%
                        </span>
                      </div>
                      <Progress
                        value={caregiver.matchScore}
                        className={`h-2 rounded-full ${caregiver.matchScore >= 70 ? '[&>div]:bg-forest-600' : caregiver.matchScore >= 40 ? '[&>div]:bg-amber-500' : '[&>div]:bg-gray-400'}`}
                      />
                    </div>

                    {/* Name & Verified */}
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-gray-900">{caregiver.user?.name || 'Caregiver'}</p>
                      {caregiver.isVerified && (
                        <Badge className="bg-forest-50 text-forest-700 border-forest-200 text-[10px] gap-1 rounded-full">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </Badge>
                      )}
                    </div>

                    {/* Details */}
                    <div className="mt-2 space-y-1.5 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" /> {caregiver.city}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        <span>{caregiver.overallRating || 'N/A'}</span>
                        <span className="text-gray-300">|</span>
                        <span>{caregiver.totalReviews} reviews</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <IndianRupee className="h-3.5 w-3.5 text-gray-400" />
                        <span>{caregiver.hourlyRate}/hr</span>
                        <span className="text-gray-300">|</span>
                        <span>{caregiver.yearsExperience} yrs exp</span>
                      </div>
                    </div>

                    {/* Skills */}
                    {caregiver.skills && caregiver.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {caregiver.skills.slice(0, 4).map((skill: string, si: number) => (
                          <Badge key={si} variant="secondary" className="text-[10px] rounded-full bg-lime-50 text-lime-700 border-lime-200">
                            {skill}
                          </Badge>
                        ))}
                        {caregiver.skills.length > 4 && (
                          <Badge variant="secondary" className="text-[10px] rounded-full bg-gray-100 text-gray-500">
                            +{caregiver.skills.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="mt-auto pt-4">
                      <Button className="btn-black w-full text-sm gap-2 rounded-full" onClick={() => { setBookingCaregiver(caregiver); setBookingModalOpen(true); }}>
                        Book Now <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {!searched && !loading && (
        <EmptyState
          icon={<Search className="h-7 w-7" />}
          title="Search for caregivers"
          description="Use the form above to find the best matched caregivers for your needs."
        />
      )}

      <Dialog open={bookingModalOpen} onOpenChange={(open) => { setBookingModalOpen(open); if (!open) setBookingCaregiver(null); }}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Book {bookingCaregiver?.user?.name || 'Caregiver'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBookSubmit} className="space-y-4 mt-2">
            <div>
              <Label className="text-xs font-medium text-gray-600">Patient *</Label>
              <Select value={bookingForm.patientId} onValueChange={v => setBookingForm(p => ({...p, patientId: v}))}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.age} yrs, {p.relationship})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-600">Shift Type *</Label>
              <Select value={bookingForm.shiftType} onValueChange={v => setBookingForm(p => ({...p, shiftType: v}))}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAY_SHIFT">Day Shift</SelectItem>
                  <SelectItem value="NIGHT_SHIFT">Night Shift</SelectItem>
                  <SelectItem value="TWELVE_HOUR">12 Hour</SelectItem>
                  <SelectItem value="TWENTY_FOUR_HOUR">24 Hour</SelectItem>
                  <SelectItem value="HOURLY">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-gray-600">Start Date *</Label>
                <Input type="date" value={bookingForm.startDate} onChange={e => setBookingForm(p => ({...p, startDate: e.target.value}))} className="mt-1 rounded-xl" required />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">End Date</Label>
                <Input type="date" value={bookingForm.endDate} onChange={e => setBookingForm(p => ({...p, endDate: e.target.value}))} className="mt-1 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-gray-600">Start Time *</Label>
                <Input type="time" value={bookingForm.startTime} onChange={e => setBookingForm(p => ({...p, startTime: e.target.value}))} className="mt-1 rounded-xl" required />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">End Time *</Label>
                <Input type="time" value={bookingForm.endTime} onChange={e => setBookingForm(p => ({...p, endTime: e.target.value}))} className="mt-1 rounded-xl" required />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-600">Notes for Caregiver</Label>
              <Textarea value={bookingForm.familyNotes} onChange={e => setBookingForm(p => ({...p, familyNotes: e.target.value}))} placeholder="Any special instructions..." className="mt-1 rounded-xl min-h-[80px]" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setBookingModalOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={bookingSubmitting} className="btn-black text-sm gap-2">
                {bookingSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Confirm Booking
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================================================ */
/* MY BOOKINGS TAB                                              */
/* ============================================================ */
function BookingsTab() {
  const user = useAuthStore((s) => s.user);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.bookings.list({ familyId: user.id });
      setBookings(res.bookings || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async (bookingId: string) => {
    setCancelling(bookingId);
    try {
      await api.bookings.updateStatus(bookingId, { status: 'CANCELLED' });
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel booking');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return <LoadingCards count={4} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchBookings} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">My Bookings</h2>
        <p className="text-sm text-gray-400">View and manage all your care bookings.</p>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="h-7 w-7" />}
          title="No bookings yet"
          description="Once you book a caregiver, your bookings will appear here."
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking: any, i: number) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="rounded-2xl border-gray-100">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center shrink-0 mt-0.5">
                        <Heart className="h-5 w-5 text-forest-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800">
                          {booking.patient?.name || 'Patient'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Caregiver: <span className="text-gray-600">{booking.caregiver?.user?.name || '--'}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />{booking.shiftType?.replace(/_/g, ' ')}
                          </span>
                          <span>{booking.startTime} - {booking.endTime}</span>
                          <span>{new Date(booking.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          {booking.endDate && (
                            <span>to {new Date(booking.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:shrink-0">
                      <div className="text-right">
                        <Badge variant="outline" className={`text-[11px] rounded-full ${statusColors[booking.status] || ''}`}>
                          {booking.status?.replace(/_/g, ' ')}
                        </Badge>
                        <p className="text-sm font-semibold text-gray-800 mt-1">₹{booking.totalAmount || 0}</p>
                      </div>
                      {booking.status === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancelling === booking.id}
                          className="rounded-xl text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 gap-1 text-xs"
                        >
                          {cancelling === booking.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================ */
/* CARE REPORTS TAB                                             */
/* ============================================================ */
function ReportsTab() {
  const user = useAuthStore((s) => s.user);
  const [bookingsWithReports, setBookingsWithReports] = useState<any[]>([]);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [reports, setReports] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchBookings = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.bookings.list({ familyId: user.id });
      const withReports = (res.bookings || []).filter((b: any) => b.careReports && b.careReports.length > 0);
      setBookingsWithReports(withReports);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const fetchReports = async (bookingId: string) => {
    if (reports[bookingId]) {
      setExpandedBooking(expandedBooking === bookingId ? null : bookingId);
      return;
    }
    setLoadingReports(bookingId);
    try {
      const res = await api.reports.list({ bookingId });
      setReports((prev) => ({ ...prev, [bookingId]: res.reports || [] }));
      setExpandedBooking(bookingId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load reports');
    } finally {
      setLoadingReports(null);
    }
  };

  const moodIcon = (mood: string) => {
    switch (mood) {
      case 'good': return <Smile className="h-4 w-4 text-green-500" />;
      case 'upset': return <Frown className="h-4 w-4 text-orange-500" />;
      case 'unwell': return <Frown className="h-4 w-4 text-red-500" />;
      default: return <Meh className="h-4 w-4 text-gray-400" />;
    }
  };

  const parseActivities = (activities: string) => {
    try {
      const parsed = JSON.parse(activities);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const parseMedicines = (medicines: string | null) => {
    if (!medicines) return [];
    try {
      const parsed = JSON.parse(medicines);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  if (loading) {
    return <LoadingCards count={3} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchBookings} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Care Reports</h2>
        <p className="text-sm text-gray-400">Daily care reports submitted by your caregivers.</p>
      </div>

      {bookingsWithReports.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-7 w-7" />}
          title="No care reports yet"
          description="Care reports will appear here once caregivers submit them."
        />
      ) : (
        <div className="space-y-3">
          {bookingsWithReports.map((booking: any) => (
            <Card key={booking.id} className="rounded-2xl border-gray-100">
              <button
                className="w-full text-left p-4 sm:p-5"
                onClick={() => fetchReports(booking.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {booking.patient?.name || 'Patient'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {booking.caregiver?.user?.name || 'Caregiver'} &middot; {booking.careReports.length} report{booking.careReports.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={`text-[11px] rounded-full ${statusColors[booking.status] || ''}`}>
                      {booking.status}
                    </Badge>
                    {expandedBooking === booking.id ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>

              {expandedBooking === booking.id && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 animate-accordion-down">
                  <Separator className="mb-4" />
                      {loadingReports === booking.id ? (
                        <div className="space-y-3">
                          <Skeleton className="h-20 rounded-xl" />
                          <Skeleton className="h-20 rounded-xl" />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(reports[booking.id] || []).map((report: any) => {
                            const activities = parseActivities(report.activities);
                            const medicines = parseMedicines(report.medicinesGiven);
                            return (
                              <div key={report.id} className="bg-gray-50 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-gray-800">{report.reportDate}</p>
                                    {report.mood && (
                                      <span className="flex items-center gap-1 text-xs text-gray-500">
                                        {moodIcon(report.mood)} {report.mood}
                                      </span>
                                    )}
                                  </div>
                                  {report.foodIntake && (
                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                      <Utensils className="h-3 w-3" /> {report.foodIntake}
                                    </span>
                                  )}
                                </div>

                                {activities.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {activities.map((act: any, ai: number) => (
                                      <Badge key={ai} variant="secondary" className="text-[10px] rounded-full bg-white border-gray-200 text-gray-600">
                                        <Activity className="h-2.5 w-2.5 mr-1" />
                                        {typeof act === 'string' ? act : act.name || act.type || JSON.stringify(act)}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {medicines.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                                      <Pill className="h-3 w-3" /> Medicines Given
                                    </p>
                                    <div className="space-y-1">
                                      {medicines.map((med: any, mi: number) => (
                                        <div key={mi} className="flex items-center gap-2 text-xs text-gray-600">
                                          <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                                          <span className="font-medium">{med.name || med.medicine || `Medicine ${mi + 1}`}</span>
                                          {med.time && <span className="text-gray-400">at {med.time}</span>}
                                          {med.given !== undefined && (
                                            <Badge variant="outline" className={`text-[9px] rounded-full ${med.given ? 'border-green-200 text-green-700 bg-green-50' : 'border-red-200 text-red-600 bg-red-50'}`}>
                                              {med.given ? 'Given' : 'Missed'}
                                            </Badge>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {report.summary && (
                                  <p className="text-xs text-gray-600 leading-relaxed">{report.summary}</p>
                                )}

                                {report.concerns && (
                                  <div className="flex items-start gap-1.5 text-xs text-orange-600 bg-orange-50 rounded-xl p-2.5">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                    <span>{report.concerns}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================ */
/* REVIEWS TAB                                                  */
/* ============================================================ */
function ReviewsTab() {
  const user = useAuthStore((s) => s.user);
  const [completedBookings, setCompletedBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, { rating: number; communication: number; punctuality: number; careQuality: number; comment: string }>>({});

  const fetchBookings = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.bookings.list({ familyId: user.id });
      const completed = (res.bookings || []).filter(
        (b: any) => b.status === 'COMPLETED' && (!b.reviews || b.reviews.length === 0)
      );
      setCompletedBookings(completed);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateRating = (bookingId: string, field: string, value: number | string) => {
    setRatings((prev) => ({
      ...prev,
      [bookingId]: {
        rating: 5,
        communication: 5,
        punctuality: 5,
        careQuality: 5,
        comment: '',
        ...prev[bookingId],
        [field]: value,
      },
    }));
  };

  const handleSubmitReview = async (booking: any) => {
    const r = ratings[booking.id];
    if (!r) {
      toast.error('Please set a rating first');
      return;
    }
    setSubmittingId(booking.id);
    try {
      await api.reviews.create({
        bookingId: booking.id,
        familyId: user!.id,
        caregiverId: booking.caregiverId,
        rating: r.rating,
        communicationRating: r.communication,
        punctualityRating: r.punctuality,
        careQualityRating: r.careQuality,
        comment: r.comment || undefined,
      });
      toast.success('Review submitted successfully!');
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmittingId(null);
    }
  };

  const StarRating = ({ value, onChange, size = 'md' }: { value: number; onChange: (v: number) => void; size?: 'sm' | 'md' }) => {
    const sz = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`${sz} transition-colors ${
              star <= value ? 'text-amber-400' : 'text-gray-200 hover:text-amber-300'
            }`}
          >
            <Star className={`${sz} ${star <= value ? 'fill-amber-400' : ''}`} />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return <LoadingCards count={3} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchBookings} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
        <p className="text-sm text-gray-400">Rate and review your completed care sessions.</p>
      </div>

      {completedBookings.length === 0 ? (
        <EmptyState
          icon={<Star className="h-7 w-7" />}
          title="No pending reviews"
          description="Once a care session is completed, you can leave a review for the caregiver."
        />
      ) : (
        <div className="space-y-4">
          {completedBookings.map((booking: any, i: number) => {
            const r = ratings[booking.id];
            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="rounded-2xl border-gray-100">
                  <CardContent className="p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center shrink-0">
                          <UserRound className="h-5 w-5 text-forest-700" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {booking.caregiver?.user?.name || 'Caregiver'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {booking.patient?.name} &middot; {new Date(booking.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Overall Rating *</Label>
                        <div className="mt-1.5">
                          <StarRating value={r?.rating || 0} onChange={(v) => updateRating(booking.id, 'rating', v)} />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Communication</Label>
                        <div className="mt-1.5">
                          <StarRating value={r?.communication || 0} onChange={(v) => updateRating(booking.id, 'communication', v)} size="sm" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Punctuality</Label>
                        <div className="mt-1.5">
                          <StarRating value={r?.punctuality || 0} onChange={(v) => updateRating(booking.id, 'punctuality', v)} size="sm" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Care Quality</Label>
                        <div className="mt-1.5">
                          <StarRating value={r?.careQuality || 0} onChange={(v) => updateRating(booking.id, 'careQuality', v)} size="sm" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-gray-600">Comment (optional)</Label>
                      <Textarea
                        value={r?.comment || ''}
                        onChange={(e) => updateRating(booking.id, 'comment', e.target.value)}
                        placeholder="Share your experience..."
                        className="mt-1 rounded-xl min-h-[60px]"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleSubmitReview(booking)}
                        disabled={submittingId === booking.id || !r?.rating}
                        className="btn-black text-sm gap-2"
                      >
                        {submittingId === booking.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Submit Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================ */
/* COMPLAINTS TAB                                               */
/* ============================================================ */
function ComplaintsTab() {
  const user = useAuthStore((s) => s.user);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [caregivers, setCaregivers] = useState<any[]>([]);

  const [form, setForm] = useState({
    subject: '', description: '', priority: 'medium', caregiverId: '',
  });

  const fetchComplaints = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.complaints.list({ familyId: user.id });
      setComplaints(res.complaints || []);
      // Also fetch unique caregivers from bookings
      api.bookings.list({ familyId: user.id }).then(bRes => {
        const uniqueCaregivers = new Map<string, any>();
        (bRes.bookings || []).forEach((b: any) => {
          if (b.caregiver && !uniqueCaregivers.has(b.caregiverId)) {
            uniqueCaregivers.set(b.caregiverId, b.caregiver);
          }
        });
        setCaregivers(Array.from(uniqueCaregivers.values()));
      }).catch(() => {});
    } catch (err: any) {
      setError(err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!form.caregiverId) {
      toast.error('Please select a caregiver');
      return;
    }
    setSubmitting(true);
    try {
      await api.complaints.create({
        familyId: user.id,
        caregiverId: form.caregiverId,
        subject: form.subject,
        description: form.description,
        priority: form.priority,
      });
      toast.success('Complaint filed successfully');
      setModalOpen(false);
      setForm({ subject: '', description: '', priority: 'medium', caregiverId: '' });
      fetchComplaints();
    } catch (err: any) {
      toast.error(err.message || 'Failed to file complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const priorityLabel: Record<string, string> = {
    low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent',
  };

  if (loading) {
    return <LoadingCards count={3} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchComplaints} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Complaints</h2>
          <p className="text-sm text-gray-400">File and track complaints about care services.</p>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="btn-black text-sm gap-2">
              <AlertTriangle className="h-4 w-4" /> File Complaint
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle>File a Complaint</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <Label className="text-xs font-medium text-gray-600">Caregiver *</Label>
                <Select value={form.caregiverId} onValueChange={v => updateForm('caregiverId', v)}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select caregiver" /></SelectTrigger>
                  <SelectContent>
                    {caregivers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.user?.name || 'Unknown Caregiver'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Subject *</Label>
                <Input
                  required
                  value={form.subject}
                  onChange={(e) => updateForm('subject', e.target.value)}
                  placeholder="Brief subject"
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Description *</Label>
                <Textarea
                  required
                  minLength={10}
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  placeholder="Describe the issue in detail..."
                  className="mt-1 rounded-xl min-h-[100px]"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Priority</Label>
                <Select value={form.priority} onValueChange={(v) => updateForm('priority', v)}>
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="btn-black text-sm gap-2">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {complaints.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="h-7 w-7" />}
          title="No complaints filed"
          description="If you have any issues with a caregiver or service, file a complaint here."
        />
      ) : (
        <div className="space-y-3">
          {complaints.map((complaint: any, i: number) => (
            <motion.div
              key={complaint.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="rounded-2xl border-gray-100">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{complaint.subject}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {complaint.caregiver?.user?.name || 'Caregiver'} &middot; {new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">{complaint.description}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:shrink-0">
                      <Badge className={`text-[10px] rounded-full ${priorityColors[complaint.priority] || ''}`}>
                        {priorityLabel[complaint.priority] || complaint.priority}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] rounded-full ${complaintStatusColors[complaint.status] || ''}`}>
                        {complaint.status?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                  {complaint.resolution && (
                    <div className="mt-3 bg-green-50 rounded-xl p-3 text-xs text-green-700">
                      <p className="font-medium">Resolution:</p>
                      <p className="mt-0.5">{complaint.resolution}</p>
                    </div>
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

/* ============================================================ */
/* MAIN EXPORT                                                  */
/* ============================================================ */
export function FamilyDashboard({ activeTab }: FamilyDashboardProps) {
  switch (activeTab) {
    case 'overview':
      return <OverviewTab />;
    case 'patients':
      return <PatientsTab />;
    case 'find-caregivers':
      return <FindCaregiversTab />;
    case 'bookings':
      return <BookingsTab />;
    case 'reports':
      return <ReportsTab />;
    case 'reviews':
      return <ReviewsTab />;
    case 'complaints':
      return <ComplaintsTab />;
    default:
      return <OverviewTab />;
  }
}
