'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  CheckCircle2,
  Star,
  IndianRupee,
  MapPin,
  Clock,
  ShieldCheck,
  Award,
  FileText,
  Send,
  Loader2,
  AlertCircle,
  HeartPulse,
  Utensils,
  Pill,
  MessageCircle,
  UserRound,
  ClipboardList,
  Briefcase,
  Languages,
  Stethoscope,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Activity,
  XCircle,
  AlertTriangle,
  Camera,
  Upload,
  Eye,
  Play,
  Phone,
  Hash,
  Pencil,
  Wallet,
  Building2,
  ArrowDownToLine,
  Smartphone,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import type { User } from '@/stores/authStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { PaymentHistory } from '@/components/payment/PaymentHistory';
import { PhoneVerificationSection } from '@/components/dashboard/PhoneVerification';
import { useFirebasePhoneAuth } from '@/hooks/useFirebasePhoneAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

/* ============================================================ */
/* TYPES                                                         */
/* ============================================================ */

interface CaregiverDashboardProps {
  activeTab: string;
  user: User;
}

interface Booking {
  id: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftType: string;
  familyName?: string;
  patientName?: string;
  patientAge?: number;
  careType?: string;
  specialNotes?: string;
  totalAmount?: number;
  createdAt: string;
}

interface Review {
  id: string;
  overallRating: number;
  communicationRating: number;
  punctualityRating: number;
  careQualityRating: number;
  comment: string;
  familyName?: string;
  createdAt: string;
}

/* ============================================================ */
/* SHARED HELPERS                                                 */
/* ============================================================ */

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-green-100 text-green-800 border-green-200',
  COMPLETED: 'bg-gray-100 text-gray-700 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  NO_SHOW: 'bg-orange-100 text-orange-700 border-orange-200',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
};

const moodIcons: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  good: { icon: <Sparkles className="h-4 w-4" />, label: 'Good', color: 'text-green-600 bg-green-50' },
  normal: { icon: <Activity className="h-4 w-4" />, label: 'Normal', color: 'text-blue-600 bg-blue-50' },
  upset: { icon: <MessageCircle className="h-4 w-4" />, label: 'Upset', color: 'text-orange-600 bg-orange-50' },
  unwell: { icon: <HeartPulse className="h-4 w-4" />, label: 'Unwell', color: 'text-red-600 bg-red-50' },
};

const foodIntakeLabels: Record<string, string> = {
  good: 'Good',
  normal: 'Normal',
  poor: 'Poor',
  refused: 'Refused',
};

const foodIntakeColors: Record<string, string> = {
  good: 'text-green-700 bg-green-50',
  normal: 'text-blue-700 bg-blue-50',
  poor: 'text-orange-700 bg-orange-50',
  refused: 'text-red-700 bg-red-50',
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

function LoadingGrid({ count = 4 }: { count?: number }) {
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

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${iconSize} ${
            star <= Math.round(rating)
              ? 'fill-lime-400 text-lime-400'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

function parseJsonSafe(input: string | null | undefined | any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    if (typeof input === 'string') {
      return input.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/* ============================================================ */
/* OVERVIEW TAB                                                  */
/* ============================================================ */

function OverviewTab({ user }: { user: User }) {
  const profile = user.caregiverProfile;
  const [bookings, setBookings] = useState<Booking[]>([]);
  // Start with loading=false so new caregivers (no profile) never see a skeleton flash
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Phone verification — real OTP via Firebase
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const firebase = useFirebasePhoneAuth();

  const maskPhone = (p: string) => {
    const d = p.replace(/\D/g, '');
    if (d.length < 4) return p;
    return '*'.repeat(d.length - 4) + d.slice(-4);
  };

  const handleSendOtp = async () => {
    if (!firebase.isReady) {
      toast.error('Phone verification service is not available. Please contact support.');
      return;
    }
    setPhoneVerifying(true);
    try {
      const sent = await firebase.sendOtp(user.phone);
      if (sent) {
        setShowOtpDialog(true);
        toast.success('OTP sent to your phone!');
      } else {
        toast.error(firebase.error || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setPhoneVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length !== 6) {
      toast.error('Enter the 6-digit OTP sent to your phone');
      return;
    }
    try {
      const result = await firebase.verifyOtp(otpValue);
      if (!result) {
        toast.error(firebase.error || 'Invalid OTP. Please try again.');
        return;
      }
      const res = await fetch('/api/auth/verify-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: user.phone, firebaseToken: result.firebaseToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Verification failed');
        return;
      }
      toast.success('Phone number verified successfully!');
      useAuthStore.getState().setAuth({ ...user, phoneVerified: true } as any);
      setShowOtpDialog(false);
      setOtpValue('');
      firebase.reset();
    } catch (err: any) {
      toast.error(err?.message || 'Verification failed');
    }
  };

  const fetchData = useCallback(async () => {
    if (!profile?.id) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.bookings.list({ caregiverId: profile.id });
      const all = (res.bookings || []).map((b: any) => ({
        ...b,
        date: b.startDate,
        patientName: b.patient?.name,
        familyName: b.family?.name,
        careType: b.careRequirements ? (typeof b.careRequirements === 'string' ? JSON.parse(b.careRequirements) : b.careRequirements)?.needs?.join(', ') : undefined,
      }));
      setBookings(all);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // No profile yet — show setup guidance immediately, no loading flash
  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome, {user.name.split(' ')[0]}!</h2>
          <p className="text-sm text-gray-400 mt-1">Complete your profile to start receiving care requests.</p>
        </div>
        <Card className="rounded-2xl border-dashed border-2 border-forest-200 bg-forest-50/50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl green-gradient-bg flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Set Up Your Caregiver Profile</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">Go to the <strong>My Profile</strong> tab to create your caregiver profile. Families will be able to find and book you once your profile is set up.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  const upcomingBookings = bookings
    .filter((b) => ['CONFIRMED', 'IN_PROGRESS'].includes(b.status))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalBookings = bookings.length;
  const completedJobs = profile?.completedJobs ?? bookings.filter((b) => b.status === 'COMPLETED').length;
  const overallRating = profile?.overallRating ?? 0;
  const hourlyRate = profile?.hourlyRate ?? 0;

  const statCards = [
    { label: 'Total Bookings', value: totalBookings, icon: <CalendarCheck className="h-5 w-5" />, color: 'bg-forest-50 text-forest-700' },
    { label: 'Completed Jobs', value: completedJobs, icon: <CheckCircle2 className="h-5 w-5" />, color: 'bg-lime-50 text-lime-700' },
    { label: 'Overall Rating', value: overallRating.toFixed(1), icon: <Star className="h-5 w-5" />, color: 'bg-amber-50 text-amber-700', suffix: '/5' },
    { label: 'Hourly Rate', value: `₹${hourlyRate}`, icon: <IndianRupee className="h-5 w-5" />, color: 'bg-purple-50 text-purple-700', isString: true },
  ];

  const skills = parseJsonSafe(profile?.skills);
  const languages = parseJsonSafe(profile?.languages);

  return (
    <div className="space-y-6">
      {/* Phone Verification Banner */}
      {!user.phoneVerified && user.phone && (
        <Card className="rounded-2xl border-2 border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-900">Verify Your Phone Number</p>
                <p className="text-xs text-amber-700/70">Required to receive booking requests — {maskPhone(user.phone)}</p>
              </div>
            </div>
            <Button onClick={handleSendOtp} disabled={phoneVerifying || !firebase.isReady} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl shrink-0">
              {phoneVerifying && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              {phoneVerifying ? 'Sending OTP...' : !firebase.isReady ? 'Unavailable' : 'Send OTP'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Phone OTP Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={(open) => { if (!open) { setShowOtpDialog(false); setOtpValue(''); firebase.reset(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Phone Number</DialogTitle>
            <DialogDescription>Enter the 6-digit OTP sent to {maskPhone(user.phone)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm">OTP</Label>
              <Input
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                className="mt-1"
                maxLength={6}
                autoFocus
              />
            </div>
            <Button
              onClick={handleVerifyOtp}
              disabled={firebase.verifying || otpValue.length !== 6}
              className="w-full bg-forest-900 hover:bg-forest-800 text-white rounded-xl"
            >
              {firebase.verifying && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Verify OTP
            </Button>
            <button
              type="button"
              onClick={async () => { setOtpValue(''); firebase.reset(); setShowOtpDialog(false); await handleSendOtp(); }}
              disabled={firebase.sendingOtp}
              className="w-full text-xs text-forest-700 hover:text-forest-900 font-medium text-center disabled:opacity-50"
            >
              {firebase.sendingOtp ? 'Resending...' : 'Resend OTP'}
            </button>
            {firebase.error && <p className="text-xs text-red-500 text-center">{firebase.error}</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.name.split(' ')[0]}!
        </h2>
        <p className="text-sm text-gray-400 mt-1">Here&apos;s your caregiving dashboard at a glance.</p>
      </div>

      {/* Verification Progress Banner */}
      {profile && (
        profile.isVerified ? (
          <div className="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">You're a Verified Caregiver!</p>
              <p className="text-xs text-green-100">Your profile displays the trusted verified badge</p>
            </div>
            <CheckCircle2 className="h-6 w-6 text-white ml-auto shrink-0" />
          </div>
        ) : (
          <Card className="rounded-2xl border-2 border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-900">Complete Verification — Get More Bookings</p>
                  <p className="text-xs text-amber-700/70">Verified caregivers get 40% more visibility and a trusted badge</p>
                </div>
              </div>
              <Button size="sm" onClick={() => toast.info('Go to My Profile to complete verification')} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl shrink-0">
                <ShieldCheck className="h-4 w-4 mr-1" /> Verify Now
              </Button>
            </CardContent>
          </Card>
        )
      )}

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
                    <div className="flex items-baseline gap-1 mt-1">
                      <p className="text-3xl font-bold text-gray-900">
                        {stat.isString ? stat.value : stat.value}
                      </p>
                      {stat.suffix && <span className="text-sm text-gray-400">{stat.suffix}</span>}
                    </div>
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

      {/* Upcoming Bookings */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-3">Upcoming & Active Bookings</h3>
        {upcomingBookings.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="h-7 w-7" />}
            title="No upcoming bookings"
            description="New bookings from families will appear here once confirmed."
          />
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="rounded-2xl border-gray-100">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center shrink-0">
                          <UserRound className="h-5 w-5 text-forest-700" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {booking.patientName || 'Patient'}
                            {booking.familyName && (
                              <span className="text-gray-400 font-normal"> · {booking.familyName}</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDate(booking.date)} · {booking.shiftType || `${booking.startTime || ''} - ${booking.endTime || ''}`}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-xs rounded-full ${statusColors[booking.status] || ''}`}
                      >
                        {statusLabels[booking.status] || booking.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Summary Card */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-3">Profile Summary</h3>
        <Card className="rounded-2xl border-gray-100">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              <div className="w-16 h-16 rounded-2xl green-gradient-bg flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-white">
                  {user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold text-gray-900">{user.name}</h4>
                    {profile?.isVerified && (
                      <Badge className="bg-forest-100 text-forest-700 border-forest-200 rounded-full text-xs gap-1">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {profile?.city || 'Not set'}
                    <span className="text-gray-300">·</span>
                    <Briefcase className="h-3.5 w-3.5" /> {profile?.yearsExperience || 0} yrs experience
                    <span className="text-gray-300">·</span>
                    <IndianRupee className="h-3.5 w-3.5" /> {profile?.hourlyRate || 0}/hr
                  </p>
                </div>

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-forest-50 text-forest-700 border-forest-100 rounded-full text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}

                {languages.length > 0 && (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Languages className="h-3.5 w-3.5" />
                    {languages.join(', ')}
                  </p>
                )}

                {profile?.bio && (
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{profile.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================ */
/* CREATE PROFILE FORM                                           */
/* ============================================================ */

const ALL_SKILLS = ['elderly-care', 'bedridden-care', 'feeding', 'wound-care', 'medicine-management', 'dementia-care', 'physiotherapy-assist', 'post-surgery-care', 'mobility-support', 'hygiene-care', 'elderly-companionship', 'ventilator-care'];

function CreateProfileForm({ userId, onCreated }: { userId: string; onCreated: (profile: any) => void }) {
  const [saving, setSaving] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['elderly-care']);
  const [form, setForm] = useState({
    city: '', yearsExperience: '', hourlyRate: '', qualifications: '', languages: 'Hindi, English', bio: '',
  });

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.city || !form.yearsExperience || !form.hourlyRate) {
      toast.error('Please fill in City, Experience, and Hourly Rate.');
      return;
    }
    if (selectedSkills.length === 0) {
      toast.error('Please select at least one skill.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.caregivers.create({
        userId,
        city: form.city,
        yearsExperience: parseInt(form.yearsExperience),
        hourlyRate: parseInt(form.hourlyRate),
        skills: JSON.stringify(selectedSkills),
        qualifications: form.qualifications ? JSON.stringify(form.qualifications.split(',').map((s: string) => s.trim()).filter(Boolean)) : JSON.stringify(['Caregiver']),
        languages: JSON.stringify(form.languages.split(',').map((s: string) => s.trim()).filter(Boolean)),
        bio: form.bio,
      });
      toast.success('Profile created successfully!');
      onCreated(res.caregiver);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create Your Profile</h2>
        <p className="text-sm text-gray-400 mt-1">Set up your caregiver profile to start receiving booking requests from families.</p>
      </div>
      <Card className="rounded-2xl border-gray-100">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-gray-600">City *</Label>
                <Input value={form.city} onChange={e => setForm(p => ({...p, city: e.target.value}))} placeholder="e.g., Delhi" className="mt-1 rounded-xl" required />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Years of Experience *</Label>
                <Input type="number" min="0" max="50" value={form.yearsExperience} onChange={e => setForm(p => ({...p, yearsExperience: e.target.value}))} placeholder="e.g., 5" className="mt-1 rounded-xl" required />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Hourly Rate (INR) *</Label>
                <Input type="number" min="50" max="5000" value={form.hourlyRate} onChange={e => setForm(p => ({...p, hourlyRate: e.target.value}))} placeholder="e.g., 250" className="mt-1 rounded-xl" required />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Qualifications</Label>
                <Input value={form.qualifications} onChange={e => setForm(p => ({...p, qualifications: e.target.value}))} placeholder="e.g., BSc Nursing, GNM" className="mt-1 rounded-xl" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-600">Languages</Label>
              <Input value={form.languages} onChange={e => setForm(p => ({...p, languages: e.target.value}))} placeholder="e.g., Hindi, English, Punjabi" className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-600 mb-2 block">Skills *</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_SKILLS.map(skill => (
                  <button key={skill} type="button" onClick={() => toggleSkill(skill)} className={`text-xs px-3 py-1.5 rounded-full border transition-all ${selectedSkills.includes(skill) ? 'bg-forest-900 text-white border-forest-900' : 'bg-white text-gray-600 border-gray-200 hover:border-forest-300'}`}>
                    {skill}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-600">Bio</Label>
              <Textarea value={form.bio} onChange={e => setForm(p => ({...p, bio: e.target.value}))} placeholder="Tell families about your experience and care approach..." className="mt-1 rounded-xl min-h-[100px]" />
            </div>
            <Button type="submit" disabled={saving} className="btn-black text-sm gap-2 rounded-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Create Profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================ */
/* EDIT PROFILE FORM                                             */
/* ============================================================ */

function EditProfileForm({ profile, userId, onSaved, onCancel }: { profile: any; userId: string; onSaved: (updated: any) => void; onCancel: () => void }) {
  const [saving, setSaving] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(parseJsonSafe(profile.skills));
  const [form, setForm] = useState({
    city: profile.city || '',
    yearsExperience: String(profile.yearsExperience || ''),
    hourlyRate: String(profile.hourlyRate || ''),
    qualifications: parseJsonSafe(profile.qualifications).join(', '),
    languages: parseJsonSafe(profile.languages).join(', '),
    bio: profile.bio || '',
  });

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.city || !form.yearsExperience || !form.hourlyRate) {
      toast.error('Please fill in City, Experience, and Hourly Rate.');
      return;
    }
    if (selectedSkills.length === 0) {
      toast.error('Please select at least one skill.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.caregivers.update(profile.id, {
        city: form.city,
        yearsExperience: parseInt(form.yearsExperience),
        hourlyRate: parseInt(form.hourlyRate),
        skills: JSON.stringify(selectedSkills),
        qualifications: form.qualifications ? JSON.stringify(form.qualifications.split(',').map((s: string) => s.trim()).filter(Boolean)) : JSON.stringify(['Caregiver']),
        languages: JSON.stringify(form.languages.split(',').map((s: string) => s.trim()).filter(Boolean)),
        bio: form.bio,
      });
      toast.success('Profile updated successfully!');
      onSaved(res.caregiver);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
        <p className="text-sm text-gray-400 mt-1">Update your caregiver profile information.</p>
      </div>
      <Card className="rounded-2xl border-gray-100">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-gray-600">City *</Label>
                <Input value={form.city} onChange={e => setForm(p => ({...p, city: e.target.value}))} placeholder="e.g., Delhi" className="mt-1 rounded-xl" required />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Years of Experience *</Label>
                <Input type="number" min="0" max="50" value={form.yearsExperience} onChange={e => setForm(p => ({...p, yearsExperience: e.target.value}))} placeholder="e.g., 5" className="mt-1 rounded-xl" required />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Hourly Rate (INR) *</Label>
                <Input type="number" min="50" max="5000" value={form.hourlyRate} onChange={e => setForm(p => ({...p, hourlyRate: e.target.value}))} placeholder="e.g., 250" className="mt-1 rounded-xl" required />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Qualifications</Label>
                <Input value={form.qualifications} onChange={e => setForm(p => ({...p, qualifications: e.target.value}))} placeholder="e.g., BSc Nursing, GNM" className="mt-1 rounded-xl" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-600">Languages</Label>
              <Input value={form.languages} onChange={e => setForm(p => ({...p, languages: e.target.value}))} placeholder="e.g., Hindi, English, Punjabi" className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-600 mb-2 block">Skills *</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_SKILLS.map(skill => (
                  <button key={skill} type="button" onClick={() => toggleSkill(skill)} className={`text-xs px-3 py-1.5 rounded-full border transition-all ${selectedSkills.includes(skill) ? 'bg-forest-900 text-white border-forest-900' : 'bg-white text-gray-600 border-gray-200 hover:border-forest-300'}`}>
                    {skill}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-600">Bio</Label>
              <Textarea value={form.bio} onChange={e => setForm(p => ({...p, bio: e.target.value}))} placeholder="Tell families about your experience and care approach..." className="mt-1 rounded-xl min-h-[100px]" />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onCancel} className="rounded-full">Cancel</Button>
              <Button type="submit" disabled={saving} className="btn-black text-sm gap-2 rounded-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================ */
/* WITHDRAWAL FORM                                               */
/* ============================================================ */

function WithdrawalForm({ caregiverId, userId, availableBalance }: { caregiverId: string; userId: string; availableBalance: number }) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<'upi' | 'bank_transfer'>('upi');
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setAmount(''); setUpiId(''); setBankName(''); setAccountNumber(''); setIfscCode(''); setAccountHolder(''); setMethod('upi');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountPaise = Math.round(parseFloat(amount) * 100);
    if (!amountPaise || amountPaise <= 0) { toast.error('Enter a valid amount'); return; }
    if (amountPaise > availableBalance) { toast.error(`Insufficient balance. Available: ₹${(availableBalance / 100).toLocaleString('en-IN')}`); return; }
    if (method === 'upi' && !upiId) { toast.error('Enter UPI ID'); return; }
    if (method === 'bank_transfer' && (!bankName || !accountNumber || !ifscCode || !accountHolder)) { toast.error('Fill all bank details'); return; }

    setSubmitting(true);
    try {
      await api.withdrawals.create({
        userId, caregiverId, amount: amountPaise, method,
        upiId: method === 'upi' ? upiId : undefined,
        bankName: method === 'bank_transfer' ? bankName : undefined,
        accountNumber: method === 'bank_transfer' ? accountNumber : undefined,
        ifscCode: method === 'bank_transfer' ? ifscCode : undefined,
        accountHolder: method === 'bank_transfer' ? accountHolder : undefined,
      });
      toast.success('Withdrawal request submitted! Admin will process it soon.');
      setOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="btn-green text-sm gap-2 rounded-xl">
        <Wallet className="h-4 w-4" /> Withdraw Funds
      </Button>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-forest-800" /> Withdraw Funds</DialogTitle>
            <DialogDescription>Available: <span className="font-semibold text-forest-700">₹{(availableBalance / 100).toLocaleString('en-IN')}</span></DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-3">
            <div>
              <Label className="text-xs font-medium text-gray-600">Amount (INR) *</Label>
              <Input type="number" min="1" step="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" className="mt-1 rounded-xl" required />
            </div>

            {/* Method Toggle */}
            <div>
              <Label className="text-xs font-medium text-gray-600 mb-2 block">Withdrawal Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setMethod('upi')} className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${method === 'upi' ? 'border-forest-500 bg-forest-50 text-forest-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  <Smartphone className="h-4 w-4" /> UPI
                </button>
                <button type="button" onClick={() => setMethod('bank_transfer')} className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${method === 'bank_transfer' ? 'border-forest-500 bg-forest-50 text-forest-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  <Building2 className="h-4 w-4" /> Bank Transfer
                </button>
              </div>
            </div>

            {method === 'upi' ? (
              <div>
                <Label className="text-xs font-medium text-gray-600">UPI ID *</Label>
                <Input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi" className="mt-1 rounded-xl" required />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium text-gray-600">Account Holder Name *</Label>
                  <Input value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="Full name" className="mt-1 rounded-xl" required />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Bank Name *</Label>
                  <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g., SBI, HDFC" className="mt-1 rounded-xl" required />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Account Number *</Label>
                  <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))} placeholder="Enter account number" className="mt-1 rounded-xl" required />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">IFSC Code *</Label>
                  <Input value={ifscCode} onChange={e => setIfscCode(e.target.value.toUpperCase())} placeholder="e.g., SBIN0001234" className="mt-1 rounded-xl font-mono" required />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 rounded-full">Cancel</Button>
              <Button type="submit" disabled={submitting} className="btn-black flex-1 text-sm gap-2 rounded-full">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ============================================================ */
/* PROFILE TAB                                                   */
/* ============================================================ */

function ProfileTab({ user }: { user: User }) {
  const profile = user.caregiverProfile;
  const [editing, setEditing] = useState(false);
  const skills = parseJsonSafe(profile?.skills);
  const languages = parseJsonSafe(profile?.languages);

  if (!profile) {
    return (
      <CreateProfileForm
        userId={user.id}
        onCreated={(createdProfile: any) => {
          if (createdProfile) {
            const current = useAuthStore.getState().user;
            if (current) {
              useAuthStore.getState().setAuth({
                ...current,
                caregiverProfile: createdProfile,
              });
              return;
            }
          }
          api.auth.me(user.id).then(res => {
            if (res.user) useAuthStore.getState().setAuth(res.user);
          }).catch(() => {
            window.location.reload();
          });
        }}
      />
    );
  }

  if (editing) {
    return (
      <EditProfileForm
        profile={profile}
        userId={user.id}
        onSaved={async (updated) => {
          setEditing(false);
          // Re-fetch fresh user data from /api/auth/me to ensure correct format
          try {
            const me = await api.auth.me(user.id);
            if (me.user) {
              useAuthStore.getState().setAuth(me.user);
            } else {
              // Fallback: use the raw updated profile
              const current = useAuthStore.getState().user;
              if (current) {
                useAuthStore.getState().setAuth({ ...current, caregiverProfile: updated });
              }
            }
          } catch {
            // Last resort: fallback to raw update
            const current = useAuthStore.getState().user;
            if (current) {
              useAuthStore.getState().setAuth({ ...current, caregiverProfile: updated });
            }
          }
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
          <p className="text-sm text-gray-400 mt-1">Your caregiver profile details as seen by families.</p>
        </div>
        <Button onClick={() => setEditing(true)} variant="outline" className="gap-2 rounded-xl text-sm border-forest-200 text-forest-700 hover:bg-forest-50">
          <Pencil className="h-4 w-4" /> Edit Profile
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="rounded-2xl border-gray-100 overflow-hidden">
          {/* Header Banner */}
          <div className="green-gradient-bg h-28 sm:h-36 relative">
            <div className="absolute -bottom-10 left-6">
              <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                <span className="text-2xl font-bold text-forest-900">
                  {user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
            </div>
          </div>

          <CardContent className="pt-14 pb-6 px-6">
            {/* Name & Verification */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                  {profile.isVerified && (
                    <Badge className="bg-forest-100 text-forest-700 border-forest-200 rounded-full text-xs gap-1">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-0.5">{user.email} · {user.phone}</p>
              </div>
              <div className="flex items-center gap-2 bg-forest-50 rounded-xl px-4 py-2">
                <Star className="h-5 w-5 fill-lime-400 text-lime-400" />
                <span className="text-lg font-bold text-gray-900">{profile.overallRating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({profile.totalReviews} reviews)</span>
              </div>
            </div>

            <Separator className="bg-gray-100 mb-6" />

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-forest-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">City</p>
                  <p className="text-sm font-semibold text-gray-800">{profile.city}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-lime-50 flex items-center justify-center shrink-0">
                  <Briefcase className="h-5 w-5 text-lime-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Experience</p>
                  <p className="text-sm font-semibold text-gray-800">{profile.yearsExperience} years</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <IndianRupee className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Hourly Rate</p>
                  <p className="text-sm font-semibold text-gray-800">₹{profile.hourlyRate}/hour</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Completed Jobs</p>
                  <p className="text-sm font-semibold text-gray-800">{profile.completedJobs} jobs</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Star className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Rating</p>
                  <p className="text-sm font-semibold text-gray-800">{profile.overallRating.toFixed(1)} / 5.0</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Verification</p>
                  <p className={`text-sm font-semibold ${profile.isVerified ? 'text-green-700' : 'text-gray-500'}`}>
                    {profile.isVerified ? 'Verified' : 'Pending Verification'}
                  </p>
                </div>
              </div>
            </div>

            {/* Skills */}
            {skills.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Stethoscope className="h-4 w-4 text-gray-400" />
                  <p className="text-sm font-semibold text-gray-700">Skills</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="bg-forest-50 text-forest-700 border-forest-200 rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Languages className="h-4 w-4 text-gray-400" />
                  <p className="text-sm font-semibold text-gray-700">Languages</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang) => (
                    <Badge
                      key={lang}
                      variant="outline"
                      className="bg-lime-50 text-lime-700 border-lime-200 rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <p className="text-sm font-semibold text-gray-700">About</p>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Phone Verification */}
            <PhoneVerificationSection user={user} />

            {/* Verification Progress */}
            <VerificationProgressSection caregiverId={profile.id} user={user} />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/* ============================================================ */
/* VERIFICATION PROGRESS SECTION                                   */
/* ============================================================ */

type DocStatus = 'NOT_UPLOADED' | 'PENDING' | 'APPROVED' | 'REJECTED';

function VerificationProgressSection({ caregiverId, user }: { caregiverId: string; user: User }) {
  const [aadhaarStatus, setAadhaarStatus] = useState<DocStatus>('NOT_UPLOADED');
  const [idCardStatus, setIdCardStatus] = useState<DocStatus>('NOT_UPLOADED');
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);

  const phoneDone = !!user.phoneVerified;
  const aadhaarDone = aadhaarStatus === 'APPROVED';
  const idCardDone = idCardStatus === 'APPROVED';
  const completedCount = [phoneDone, aadhaarDone, idCardDone].filter(Boolean).length;
  const allDone = completedCount === 3;

  // Fetch verification statuses on mount
  useEffect(() => {
    if (user.caregiverProfile?.isVerified) {
      setAadhaarStatus('APPROVED');
      setIdCardStatus('APPROVED');
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/caregivers/${caregiverId}`);
        if (!res.ok) return;
        const data = await res.json();
        const verifications = data.caregiver?.verifications || [];
        for (const v of verifications) {
          if (v.docType === 'AADHAAR') setAadhaarStatus(v.status as DocStatus);
          if (v.docType === 'ID_CARD') setIdCardStatus(v.status as DocStatus);
        }
      } catch {
        // silently fail — local state stays NOT_UPLOADED
      }
    })();
  }, [caregiverId, user.caregiverProfile?.isVerified]);

  const formatAadhar = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 12);
    if (digits.length <= 4) return digits;
    if (digits.length <= 8) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
  };

  const handleUpload = async (docType: 'AADHAAR' | 'ID_CARD') => {
    const file = docType === 'AADHAAR' ? aadhaarFile : idCardFile;
    if (!file) {
      toast.error('Please select an image first');
      return;
    }
    if (docType === 'AADHAAR' && aadhaarNumber.replace(/\s/g, '').length !== 12) {
      toast.error('Enter complete 12-digit Aadhaar number');
      return;
    }
    setUploading(docType);
    try {
      const formData = new FormData();
      formData.append('caregiverId', caregiverId);
      formData.append('docType', docType);
      formData.append('file', file);
      if (docType === 'AADHAAR') formData.append('docNumber', aadhaarNumber.replace(/\s/g, ''));
      const res = await fetch('/api/caregiver/upload-document', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }
      toast.success(`${docType === 'AADHAAR' ? 'Aadhaar card' : 'ID card'} uploaded successfully! It will be reviewed shortly.`);
      if (docType === 'AADHAAR') {
        setAadhaarStatus('PENDING');
        setAadhaarFile(null);
      } else {
        setIdCardStatus('PENDING');
        setIdCardFile(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const statusBadge = (status: DocStatus) => {
    if (status === 'APPROVED') return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">✅ Approved</Badge>;
    if (status === 'PENDING') return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">⏳ Under Review</Badge>;
    if (status === 'REJECTED') return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">❌ Rejected — Upload again</Badge>;
    return null;
  };

  return (
    <div className="mt-6 space-y-5">
      {/* Incentive Banner */}
      {allDone ? (
        <div className="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-white">You&apos;re a Verified Caregiver!</p>
            <p className="text-sm text-green-100 mt-0.5">All verification steps are complete. Enjoy higher visibility and more bookings.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-5">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-5 w-5 text-yellow-200" />
            <p className="text-base font-bold text-white">Get Verified — Get More Bookings</p>
          </div>
          <ul className="space-y-2">
            {[
              '40% higher visibility in search results',
              'Priority matching for new bookings',
              'Trusted verified badge on your profile',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-green-100">
                <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Progress Steps */}
      <div className="bg-gray-50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-4 w-4 text-forest-700" />
          <p className="text-sm font-semibold text-gray-700">Verification Progress</p>
          <Badge variant="outline" className="ml-auto text-xs">{completedCount}/3</Badge>
        </div>
        <div className="space-y-4">
          {/* Step 1: Phone */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${phoneDone ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
              {phoneDone ? '✓' : '1'}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${phoneDone ? 'text-green-800' : 'text-gray-700'}`}>Phone Verification</p>
              <p className="text-xs text-gray-400">{phoneDone ? 'Verified' : 'Not verified — see above'}</p>
            </div>
            {phoneDone && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />}
          </div>
          {/* Step 2: Aadhaar */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${aadhaarDone ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
              {aadhaarDone ? '✓' : '2'}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${aadhaarDone ? 'text-green-800' : 'text-gray-700'}`}>Aadhaar Card</p>
              <div className="flex items-center gap-2 mt-0.5">
                {statusBadge(aadhaarStatus) || <p className="text-xs text-gray-400">Not uploaded</p>}
              </div>
            </div>
            {aadhaarDone && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />}
          </div>
          {/* Step 3: ID Card */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${idCardDone ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
              {idCardDone ? '✓' : '3'}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${idCardDone ? 'text-green-800' : 'text-gray-700'}`}>ID Card</p>
              <div className="flex items-center gap-2 mt-0.5">
                {statusBadge(idCardStatus) || <p className="text-xs text-gray-400">Not uploaded</p>}
              </div>
            </div>
            {idCardDone && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />}
          </div>
        </div>
      </div>

      {/* Aadhaar Upload */}
      <div className="bg-gray-50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-gray-400" />
          <p className="text-sm font-semibold text-gray-700">Aadhaar Card Upload</p>
          {statusBadge(aadhaarStatus)}
        </div>
        {aadhaarStatus === 'APPROVED' ? (
          <div className="flex items-center gap-3 py-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800 font-medium">Approved</p>
          </div>
        ) : aadhaarStatus === 'PENDING' ? (
          <div className="flex items-center gap-3 py-2">
            <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
            <p className="text-sm text-yellow-700">Under review — we&apos;ll notify you once approved</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Aadhaar Number</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(formatAadhar(e.target.value))}
                  placeholder="XXXX XXXX XXXX"
                  className="pl-10 rounded-xl font-mono tracking-wider"
                  maxLength={14}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Upload Aadhaar Card Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setAadhaarFile(e.target.files?.[0] || null)}
                className="rounded-xl text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, or WebP. Max 5 MB.</p>
            </div>
            <Button
              onClick={() => handleUpload('AADHAAR')}
              disabled={uploading === 'AADHAAR' || !aadhaarFile}
              className="btn-green text-sm gap-2 rounded-xl w-full"
            >
              {uploading === 'AADHAAR' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading === 'AADHAAR' ? 'Uploading...' : 'Upload Aadhaar Card'}
            </Button>
          </div>
        )}
      </div>

      {/* ID Card Upload */}
      <div className="bg-gray-50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-gray-400" />
          <p className="text-sm font-semibold text-gray-700">ID Card Upload</p>
          {statusBadge(idCardStatus)}
        </div>
        {idCardStatus === 'APPROVED' ? (
          <div className="flex items-center gap-3 py-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800 font-medium">Approved</p>
          </div>
        ) : idCardStatus === 'PENDING' ? (
          <div className="flex items-center gap-3 py-2">
            <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
            <p className="text-sm text-yellow-700">Under review — we&apos;ll notify you once approved</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Upload Government ID Card Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setIdCardFile(e.target.files?.[0] || null)}
                className="rounded-xl text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, or WebP. Max 5 MB.</p>
            </div>
            <Button
              onClick={() => handleUpload('ID_CARD')}
              disabled={uploading === 'ID_CARD' || !idCardFile}
              className="btn-green text-sm gap-2 rounded-xl w-full"
            >
              {uploading === 'ID_CARD' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading === 'ID_CARD' ? 'Uploading...' : 'Upload ID Card'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================ */
/* BOOKINGS TAB                                                  */
/* ============================================================ */

function BookingsTab({ user }: { user: User }) {
  const profile = user.caregiverProfile;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchBookings = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    setError('');
    try {
      const params: any = { caregiverId: profile.id };
      if (statusFilter) params.status = statusFilter;
      const res = await api.bookings.list(params);
      const mapped = (res.bookings || []).map((b: any) => ({
        ...b,
        date: b.startDate,
        patientName: b.patient?.name,
        familyName: b.family?.name,
        careType: b.careRequirements ? (typeof b.careRequirements === 'string' ? JSON.parse(b.careRequirements) : b.careRequirements)?.needs?.join(', ') : undefined,
      }));
      setBookings(mapped);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [profile?.id, statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleStatusChange = async (bookingId: string, status: string, reason?: string) => {
    setCompletingId(bookingId);
    try {
      await api.bookings.updateStatus(bookingId, { status, cancellationReason: reason });
      const labels: Record<string, string> = {
        CONFIRMED: 'Booking accepted!',
        IN_PROGRESS: 'Care started!',
        COMPLETED: 'Booking completed!',
        CANCELLED: 'Booking declined.',
      };
      toast.success(labels[status] || `Booking updated`);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update booking');
    } finally {
      setCompletingId(null);
    }
  };

  if (error) {
    return <ErrorState message={error} onRetry={fetchBookings} />;
  }

  if (bookings.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
          <p className="text-sm text-gray-400 mt-1">Manage all your care bookings.</p>
        </div>
        <EmptyState
          icon={<CalendarCheck className="h-7 w-7" />}
          title="No bookings yet"
          description="When families book your services, their requests will appear here."
        />
      </div>
    );
  }

  const sorted = [...bookings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
          <p className="text-sm text-gray-400 mt-1">Manage and respond to care booking requests.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchBookings}
          className="rounded-xl gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].map((f) => (
          <Button
            key={f}
            variant={statusFilter === f ? 'default' : 'outline'}
            size="sm"
            className={statusFilter === f ? 'bg-[#14532d] hover:bg-[#14532d]/90 text-white rounded-full' : 'rounded-full'}
            onClick={() => setStatusFilter(f)}
          >
            {f || 'All'}
          </Button>
        ))}
      </div>

      <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
        {sorted.map((booking, i) => (
          <motion.div
            key={booking.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className="rounded-2xl border-gray-100 hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      booking.status === 'IN_PROGRESS'
                        ? 'bg-green-100 text-green-700'
                        : booking.status === 'COMPLETED'
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-forest-50 text-forest-700'
                    }`}>
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800">
                          {booking.patientName || 'Patient'}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[11px] rounded-full ${statusColors[booking.status] || ''}`}
                        >
                          {statusLabels[booking.status] || booking.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {booking.familyName && `${booking.familyName} · `}
                        {formatDate(booking.date)} · {booking.shiftType || `${booking.startTime || '—'} - ${booking.endTime || '—'}`}
                      </p>
                      {booking.careType && (
                        <p className="text-xs text-gray-500 mt-0.5">{booking.careType}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:shrink-0 flex-wrap">
                    {booking.totalAmount && (
                      <span className="text-sm font-semibold text-gray-700">₹{booking.totalAmount.toLocaleString('en-IN')}</span>
                    )}
                    {booking.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(booking.id, 'CONFIRMED')}
                          disabled={completingId === booking.id}
                          className="btn-green text-xs px-3 h-8"
                        >
                          {completingId === booking.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Accept</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(booking.id, 'CANCELLED', 'Caregiver declined the booking')}
                          disabled={completingId === booking.id}
                          className="text-red-600 border-red-200 hover:bg-red-50 text-xs px-3 h-8 rounded-full"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Decline
                        </Button>
                      </>
                    )}
                    {booking.status === 'CONFIRMED' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(booking.id, 'IN_PROGRESS')}
                        disabled={completingId === booking.id}
                        className="btn-black text-xs px-3 h-8"
                      >
                        {completingId === booking.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <><Play className="h-3.5 w-3.5 mr-1" />Start Care</>
                        )}
                      </Button>
                    )}
                    {booking.status === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(booking.id, 'COMPLETED')}
                        disabled={completingId === booking.id}
                        className="btn-green text-xs px-4 h-8"
                      >
                        {completingId === booking.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Complete</>
                        )}
                      </Button>
                    )}
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

/* ============================================================ */
/* SUBMIT REPORT TAB                                             */
/* ============================================================ */

const ACTIVITY_OPTIONS = [
  { value: 'feeding', label: 'Feeding' },
  { value: 'bathing', label: 'Bathing' },
  { value: 'hygiene', label: 'Hygiene' },
  { value: 'mobility', label: 'Mobility' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'exercise', label: 'Exercise' },
  { value: 'companionship', label: 'Companionship' },
  { value: 'vital_check', label: 'Vital Check' },
  { value: 'wound_care', label: 'Wound Care' },
];

function SubmitReportTab({ user }: { user: User }) {
  const profile = user.caregiverProfile;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [reportDate, setReportDate] = useState(getTodayDate());
  const [activities, setActivities] = useState('');
  const [summary, setSummary] = useState('');
  const [mood, setMood] = useState('');
  const [foodIntake, setFoodIntake] = useState('');
  const [medicines, setMedicines] = useState('');
  const [concerns, setConcerns] = useState('');

  const fetchBookings = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.bookings.list({ caregiverId: profile.id });
      const mapped = (res.bookings || []).map((b: any) => ({
        ...b,
        date: b.startDate,
        patientName: b.patient?.name,
        familyName: b.family?.name,
        careType: b.careRequirements ? (typeof b.careRequirements === 'string' ? JSON.parse(b.careRequirements) : b.careRequirements)?.needs?.join(', ') : undefined,
      }));
      const eligible = mapped.filter((b: any) =>
        ['IN_PROGRESS', 'CONFIRMED'].includes(b.status)
      );
      setBookings(eligible);
      if (eligible.length > 0 && !selectedBookingId) {
        setSelectedBookingId(eligible[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const resetForm = () => {
    setActivities('');
    setSummary('');
    setMood('');
    setFoodIntake('');
    setMedicines('');
    setConcerns('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) {
      toast.error('Please select a booking.');
      return;
    }
    if (!reportDate) {
      toast.error('Please select a report date.');
      return;
    }

    setSubmitting(true);
    try {
      const activityList = activities
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);

      const medicineLines = medicines
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const medicineEntries = medicineLines.map((line) => {
        const parts = line.split(',').map((p) => p.trim());
        return {
          name: parts[0] || '',
          time: parts[1] || '',
          given: parts[2]?.toLowerCase() === 'yes',
        };
      });

      await api.reports.create({
        bookingId: selectedBookingId,
        caregiverId: profile?.id,
        reportDate,
        activities: JSON.stringify(activityList),
        summary,
        mood,
        foodIntake,
        medicinesGiven: JSON.stringify(medicineEntries),
        concerns,
      });

      toast.success('Care report submitted successfully!');
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return <ErrorState message={error} onRetry={fetchBookings} />;
  }

  if (bookings.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Submit Care Report</h2>
          <p className="text-sm text-gray-400 mt-1">File daily care reports for your active bookings.</p>
        </div>
        <EmptyState
          icon={<ClipboardList className="h-7 w-7" />}
          title="No active bookings"
          description="You need at least one confirmed or in-progress booking to submit a care report."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Submit Care Report</h2>
        <p className="text-sm text-gray-400 mt-1">File daily care reports for your active bookings.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Booking & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Booking</Label>
              <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select booking" />
                </SelectTrigger>
                <SelectContent>
                  {bookings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.patientName || 'Patient'} — {formatDate(b.date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Report Date</Label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {/* Activities & Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Activities
                <span className="text-xs text-gray-400 font-normal ml-1.5">(comma-separated)</span>
              </Label>
              <Textarea
                value={activities}
                onChange={(e) => setActivities(e.target.value)}
                placeholder="e.g. feeding, bathing, vital_check, medicine"
                className="rounded-xl min-h-[100px] resize-none"
              />
              <div className="flex flex-wrap gap-1.5">
                {ACTIVITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      const current = activities
                        .split(',')
                        .map((a) => a.trim().toLowerCase())
                        .filter(Boolean);
                      if (current.includes(opt.value)) {
                        setActivities(
                          current.filter((a) => a !== opt.value).join(', ')
                        );
                      } else {
                        setActivities(
                          [...current, opt.value].join(', ')
                        );
                      }
                    }}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                      activities
                        .split(',')
                        .map((a) => a.trim().toLowerCase())
                        .includes(opt.value)
                        ? 'bg-forest-900 text-white border-forest-900'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-forest-300 hover:text-forest-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Summary</Label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary of the care provided today..."
                className="rounded-xl min-h-[100px] resize-none"
              />
            </div>
          </div>

          {/* Mood & Food Intake */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Patient Mood</Label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select mood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">😊 Good</SelectItem>
                  <SelectItem value="normal">😐 Normal</SelectItem>
                  <SelectItem value="upset">😟 Upset</SelectItem>
                  <SelectItem value="unwell">🤒 Unwell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Food Intake</Label>
              <Select value={foodIntake} onValueChange={setFoodIntake}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select food intake" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="refused">Refused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Medicines & Concerns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Medicines Given
                <span className="text-xs text-gray-400 font-normal ml-1.5">
                  (one per line: name, time, yes/no)
                </span>
              </Label>
              <Textarea
                value={medicines}
                onChange={(e) => setMedicines(e.target.value)}
                placeholder={`Paracetamol 500mg, 8:00 AM, yes\nMetformin, 9:00 AM, yes\nVitamin D, 12:00 PM, no`}
                className="rounded-xl min-h-[100px] resize-none font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Concerns</Label>
              <Textarea
                value={concerns}
                onChange={(e) => setConcerns(e.target.value)}
                placeholder="Any concerns, unusual observations, or notes for the family..."
                className="rounded-xl min-h-[100px] resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="btn-black px-8 h-11 text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}

/* ============================================================ */
/* COMPLAINTS TAB                                                */
/* ============================================================ */

const complaintStatusColors: Record<string, string> = {
  OPEN: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  RESOLVED: 'bg-green-100 text-green-800 border-green-200',
  DISMISSED: 'bg-gray-100 text-gray-700 border-gray-200',
};

const priorityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

function ComplaintsTab({ user }: { user: User }) {
  const profile = user.caregiverProfile;
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchComplaints = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.complaints.list({ caregiverId: profile.id });
      setComplaints(res.complaints || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  if (error) return <ErrorState message={error} onRetry={fetchComplaints} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Complaints</h2>
        <p className="text-sm text-gray-400 mt-1">View complaints filed against your services.</p>
      </div>

      {complaints.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="h-7 w-7" />}
          title="No complaints"
          description="You have no complaints filed against your services."
        />
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
          {complaints.map((c: any, i: number) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="rounded-2xl border-gray-100">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{c.subject}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        From: {c.family?.name || 'Family'} · {formatDate(c.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {c.priority && <Badge className={`text-[10px] rounded-full ${priorityColors[c.priority] || ''}`}>{c.priority}</Badge>}
                      <Badge variant="outline" className={`text-[10px] rounded-full ${complaintStatusColors[c.status] || ''}`}>{c.status?.replace(/_/g, ' ')}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">{c.description}</p>
                  {c.resolution && (
                    <div className="mt-3 bg-green-50 rounded-xl p-3 text-xs text-green-700">
                      <p className="font-medium">Resolution:</p>
                      <p className="mt-0.5">{c.resolution}</p>
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
/* REVIEWS TAB                                                   */
/* ============================================================ */

function ReviewsTab({ user }: { user: User }) {
  const profile = user.caregiverProfile;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReviews = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.reviews.list({ caregiverId: profile.id });
      const mapped = (res.reviews || []).map((r: any) => ({
        ...r,
        overallRating: r.rating,
        familyName: r.family?.name,
      }));
      setReviews(mapped);
    } catch (err: any) {
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  if (error) {
    return <ErrorState message={error} onRetry={fetchReviews} />;
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length
      : 0;

  const avgComm =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.communicationRating || 0), 0) / reviews.length
      : 0;
  const avgPunct =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.punctualityRating || 0), 0) / reviews.length
      : 0;
  const avgCare =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.careQualityRating || 0), 0) / reviews.length
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Reviews</h2>
        <p className="text-sm text-gray-400 mt-1">Feedback from the families you&apos;ve served.</p>
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={<Star className="h-7 w-7" />}
          title="No reviews yet"
          description="Once you complete bookings and families leave reviews, they will appear here."
        />
      ) : (
        <>
          {/* Rating Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="rounded-2xl border-gray-100">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                  <p className="text-5xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
                  <StarRating rating={avgRating} size="md" />
                  <p className="text-sm text-gray-400 mt-2">
                    Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 rounded-2xl border-gray-100">
                <CardContent className="p-5 space-y-3">
                  {[
                    { label: 'Communication', value: avgComm, color: 'bg-forest-500' },
                    { label: 'Punctuality', value: avgPunct, color: 'bg-lime-500' },
                    { label: 'Care Quality', value: avgCare, color: 'bg-forest-700' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-28 shrink-0">{item.label}</span>
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${item.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.value / 5) * 100}%` }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-8 text-right">
                        {item.value.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Reviews List */}
          <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto pr-1">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="rounded-2xl border-gray-100">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-forest-700">
                            {(review.familyName || 'F')
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {review.familyName || 'Family Member'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(review.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 fill-lime-400 text-lime-400" />
                        <span className="text-sm font-bold text-gray-900">
                          {review.overallRating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Sub-ratings */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <p className="text-[11px] text-gray-400 mb-0.5">Communication</p>
                        <StarRating rating={review.communicationRating || 0} />
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <p className="text-[11px] text-gray-400 mb-0.5">Punctuality</p>
                        <StarRating rating={review.punctualityRating || 0} />
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <p className="text-[11px] text-gray-400 mb-0.5">Care Quality</p>
                        <StarRating rating={review.careQualityRating || 0} />
                      </div>
                    </div>

                    {/* Comment */}
                    {review.comment && (
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================ */
/* EARNINGS TAB                                                  */
/* ============================================================ */
function EarningsTab({ user }: { user: User }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feePercent, setFeePercent] = useState(15);
  const caregiverId = user.caregiverProfile?.id || (user as any).caregiverId || user.id;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [payRes, wdRes, configRes] = await Promise.all([
        api.payments.list(caregiverId, 'CAREGIVER'),
        api.withdrawals.list({ caregiverId }),
        fetch('/api/config').then(r => r.json()).catch(() => ({ feePercent: 15 })),
      ]);
      setPayments(payRes.payments || []);
      setWithdrawals(wdRes.withdrawals || []);
      if (configRes.feePercent) setFeePercent(configRes.feePercent);
    } catch (err: any) {
      setError(err.message || 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  }, [caregiverId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalEarnings = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.caregiverPayout, 0) / 100;
  const totalPlatformFee = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.platformFee, 0) / 100;
  const completedPayments = payments.filter((p) => p.status === 'COMPLETED').length;

  // Available balance = total earned - pending withdrawal amounts
  const totalWithdrawn = withdrawals
    .filter((w) => ['PENDING', 'APPROVED', 'PROCESSING'].includes(w.status))
    .reduce((sum, w) => sum + w.amount, 0);
  const availableBalance = (totalEarnings * 100) - totalWithdrawn;

  const statCards = [
    {
      label: 'Total Earnings',
      value: `₹${totalEarnings.toLocaleString('en-IN')}`,
      icon: <IndianRupee className='h-5 w-5' />,
      color: 'bg-forest-50 text-forest-700',
    },
    {
      label: 'Available to Withdraw',
      value: `₹${(availableBalance / 100).toLocaleString('en-IN')}`,
      icon: <Wallet className='h-5 w-5' />,
      color: 'bg-green-50 text-green-700',
    },
    {
      label: 'Platform Fees',
      value: `₹${totalPlatformFee.toLocaleString('en-IN')}`,
      icon: <Briefcase className='h-5 w-5' />,
      color: 'bg-orange-50 text-orange-700',
    },
    {
      label: 'Completed Jobs',
      value: completedPayments,
      icon: <CheckCircle2 className='h-5 w-5' />,
      color: 'bg-lime-50 text-lime-700',
    },
  ];

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <div className='w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-3 text-red-400'>
          <AlertCircle className='h-6 w-6' />
        </div>
        <h3 className='text-sm font-semibold text-gray-800 mb-1'>Failed to load earnings</h3>
        <p className='text-xs text-gray-400 mb-3'>{error}</p>
        <button
          onClick={fetchData}
          className='text-xs font-medium text-forest-700 hover:underline'
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>Earnings</h2>
          <p className='text-sm text-gray-400 mt-1'>
            Track your earnings, withdrawals, and platform fee deductions.
          </p>
        </div>
        <WithdrawalForm
          caregiverId={caregiverId}
          userId={user.id}
          availableBalance={availableBalance}
        />
      </div>

      {/* Stat Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className='rounded-2xl border-gray-100 hover:shadow-md transition-shadow'>
              <CardContent className='p-5'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-500 font-medium'>{stat.label}</p>
                    <p className='text-2xl font-bold text-gray-900 mt-1'>{stat.value}</p>
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

      {/* Fee Breakdown Info */}
      <Card className='rounded-2xl border-forest-100 bg-forest-50/30'>
        <CardContent className='p-4'>
          <div className='flex items-start gap-3'>
            <div className='w-9 h-9 rounded-xl bg-forest-100 flex items-center justify-center shrink-0'>
              <Briefcase className='h-4 w-4 text-forest-600' />
            </div>
            <div>
              <p className='text-sm font-semibold text-forest-900'>Payment Split</p>
              <p className='text-xs text-gray-500 mt-0.5'>
                When a family pays, the amount is automatically split:{' '}
                <span className='font-semibold text-orange-600'>{feePercent}% platform fee goes to admin</span>{' '}
                and <span className='font-semibold text-green-700'>{100 - feePercent}% is your earning</span>. Withdraw anytime via UPI or bank transfer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      {withdrawals.length > 0 && (
        <div>
          <h3 className='text-base font-semibold text-gray-800 mb-3 flex items-center gap-2'>
            <ArrowDownToLine className='h-4 w-4' /> Withdrawal History
          </h3>
          <div className='space-y-3 max-h-64 overflow-y-auto'>
            {withdrawals.map((w: any) => {
              const wStatusConfig: Record<string, { label: string; cls: string }> = {
                PENDING: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                APPROVED: { label: 'Approved', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
                PROCESSING: { label: 'Processing', cls: 'bg-purple-100 text-purple-700 border-purple-200' },
                COMPLETED: { label: 'Completed', cls: 'bg-green-100 text-green-700 border-green-200' },
                REJECTED: { label: 'Rejected', cls: 'bg-red-100 text-red-700 border-red-200' },
              };
              const sc = wStatusConfig[w.status] || wStatusConfig.PENDING;
              return (
                <Card key={w.id} className='rounded-2xl border-gray-100'>
                  <CardContent className='p-4 flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0'>
                        {w.method === 'upi' ? <Smartphone className='h-5 w-5 text-green-600' /> : <Building2 className='h-5 w-5 text-green-600' />}
                      </div>
                      <div>
                        <p className='text-sm font-semibold text-gray-800'>₹{(w.amount / 100).toLocaleString('en-IN')}</p>
                        <p className='text-xs text-gray-400'>
                          {w.method === 'upi' ? w.upiId : `${w.bankName} ****${(w.accountNumber || '').slice(-4)}`}
                          {' · '}
                          {new Date(w.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <Badge variant='outline' className={`text-[10px] rounded-full ${sc.cls}`}>
                      {sc.label}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div>
        <h3 className='text-base font-semibold text-gray-800 mb-3'>Earnings History</h3>
        <PaymentHistory userId={caregiverId} role='CAREGIVER' />
      </div>
    </div>
  );
}

/* ============================================================ */
/* MAIN EXPORT                                                   */
/* ============================================================ */

export function CaregiverDashboard({ activeTab, user }: CaregiverDashboardProps) {
  return (
    <>
      {activeTab === 'overview' && <OverviewTab user={user} />}
      {activeTab === 'my-profile' && <ProfileTab user={user} />}
      {activeTab === 'bookings' && <BookingsTab user={user} />}
      {activeTab === 'earnings' && <EarningsTab user={user} />}
      {activeTab === 'submit-report' && <SubmitReportTab user={user} />}
      {activeTab === 'reviews' && <ReviewsTab user={user} />}
      {activeTab === 'complaints' && <ComplaintsTab user={user} />}
    </>
  );
}
