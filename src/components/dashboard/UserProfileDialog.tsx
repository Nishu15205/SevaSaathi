'use client';

import { useState, useEffect } from 'react';
import {
  Mail, Phone, Calendar, Clock, MapPin, Star, Shield, BadgeCheck,
  User, FileText, AlertTriangle, IndianRupee, CheckCircle2, XCircle,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';

interface UserProfileDialogProps {
  userId: string | null;
  userName: string | null;
  open: boolean;
  onClose: () => void;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`h-3.5 w-3.5 ${star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
      ))}
    </div>
  );
}

export function UserProfileDialog({ userId, userName, open, onClose }: UserProfileDialogProps) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !open) {
      setUserData(null);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const data = await api.admin.getUser(userId);
        setUserData(data);
      } catch {
        setUserData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, open]);

  const initials = (userData?.name || userName || '?')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="sr-only"><DialogTitle>{userData?.name || userName || 'User Profile'}</DialogTitle></DialogHeader>
        {loading ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-14 h-14 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ) : userData ? (
          <ScrollArea className="max-h-[90vh]">
            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#14532d] flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-base truncate">{userData.name}</h2>
                    <Badge className={`${userData.role === 'CAREGIVER' ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'} text-[10px] rounded-full`}>{userData.role}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={userData.isActive ? 'default' : 'outline'} className={`text-[10px] rounded-full ${userData.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500'}`}>
                      {userData.isActive ? '● Active' : '● Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader className="pb-2 px-4 pt-4"><CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Info</CardTitle></CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm"><Mail className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-muted-foreground">{userData.email}</span></div>
                  <div className="flex items-center gap-2 text-sm"><Phone className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-muted-foreground">{userData.phone}</span></div>
                  <div className="flex items-center gap-2 text-sm"><Calendar className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-muted-foreground">Joined {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span></div>
                  <div className="flex items-center gap-2 text-sm"><Clock className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-muted-foreground">Last login {userData.lastLoginAt ? new Date(userData.lastLoginAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span></div>
                </CardContent>
              </Card>

              {/* Subscription */}
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-sm font-medium">Current Plan</span>
                  <Badge className={`rounded-full ${userData.subscription === 'NONE' ? 'bg-gray-100 text-gray-600' : 'bg-[#14532d] text-white'}`}>
                    {userData.subscription === 'NONE' ? 'Free' : userData.subscription}
                  </Badge>
                </CardContent>
              </Card>

              {/* Stats */}
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader className="pb-2 px-4 pt-4"><CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stats</CardTitle></CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/60 rounded-xl p-3 text-center">
                      <FileText className="w-4 h-4 mx-auto text-[#14532d] mb-1" />
                      <p className="text-lg font-bold">{userData._count?.bookings ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">Bookings</p>
                    </div>
                    <div className="bg-muted/60 rounded-xl p-3 text-center">
                      <Star className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                      <p className="text-lg font-bold">{userData._count?.reviews ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">Reviews</p>
                    </div>
                    <div className="bg-muted/60 rounded-xl p-3 text-center">
                      <AlertTriangle className="w-4 h-4 mx-auto text-red-500 mb-1" />
                      <p className="text-lg font-bold">{userData._count?.complaints ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">Complaints</p>
                    </div>
                    <div className="bg-muted/60 rounded-xl p-3 text-center">
                      <User className="w-4 h-4 mx-auto text-[#14532d] mb-1" />
                      <p className="text-lg font-bold">{userData._count?.notifications ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">Notifications</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Caregiver Profile */}
              {userData.role === 'CAREGIVER' && userData.caregiverProfile && (
                <Card className="rounded-2xl border-0 shadow-sm">
                  <CardHeader className="pb-2 px-4 pt-4">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />Caregiver Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-sm"><MapPin className="w-3.5 h-3.5 text-muted-foreground" /><span>{userData.caregiverProfile.city || '—'}</span></div>
                    <div className="flex items-center gap-2 text-sm"><Clock className="w-3.5 h-3.5 text-muted-foreground" /><span>{userData.caregiverProfile.yearsExperience || 0} years experience</span></div>
                    <div className="flex items-center gap-2 text-sm"><Star className="w-3.5 h-3.5 text-amber-500" /><StarRating rating={userData.caregiverProfile.overallRating || 0} /><span className="text-xs text-muted-foreground">({userData.caregiverProfile.totalReviews || 0})</span></div>
                    {userData.caregiverProfile.skills && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {JSON.parse(userData.caregiverProfile.skills || '[]').map((s: string) => (
                          <Badge key={s} variant="secondary" className="text-[10px] rounded-full">{s}</Badge>
                        ))}
                      </div>
                    )}
                    {userData.caregiverProfile.languages && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground text-xs">Languages:</span>
                        <span>{JSON.parse(userData.caregiverProfile.languages || '[]').join(', ') || '—'}</span>
                      </div>
                    )}
                    {userData.caregiverProfile.bio && <p className="text-xs text-muted-foreground mt-1">{userData.caregiverProfile.bio}</p>}
                    <div className="flex items-center gap-2 text-sm"><IndianRupee className="w-3.5 h-3.5 text-muted-foreground" /><span>{userData.caregiverProfile.hourlyRate || 0}/hr</span></div>
                    <div className="flex items-center gap-2 text-sm">
                      {userData.caregiverProfile.isVerified ? (
                        <><BadgeCheck className="w-4 h-4 text-[#14532d]" /><span className="text-[#14532d] text-xs font-medium">Verified</span></>
                      ) : (
                        <><XCircle className="w-4 h-4 text-gray-400" /><span className="text-gray-400 text-xs">Not Verified</span></>
                      )}
                      <span className="text-xs text-muted-foreground ml-2">{userData.caregiverProfile.completedJobs || 0} completed jobs</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Patient Profiles */}
              {userData.role === 'FAMILY' && userData.patientProfiles && userData.patientProfiles.length > 0 && (
                <Card className="rounded-2xl border-0 shadow-sm">
                  <CardHeader className="pb-2 px-4 pt-4">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />Patient Profiles ({userData.patientProfiles.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    {userData.patientProfiles.map((p: any) => (
                      <div key={p.id} className="bg-muted/60 rounded-xl p-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{p.name}</span>
                          <Badge variant="outline" className="text-[10px] rounded-full">{p.gender}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Age: {p.age}</span>
                          {p.city && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{p.city}</span>}
                          <span>Mobility: {p.mobilityStatus || 'mobile'}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Recent Bookings */}
              {userData.bookings && userData.bookings.length > 0 && (
                <Card className="rounded-2xl border-0 shadow-sm">
                  <CardHeader className="pb-2 px-4 pt-4">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Bookings</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    {userData.bookings.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between bg-muted/60 rounded-xl p-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-sm">
                            <span className="font-medium truncate">{b.patient?.name || 'Patient'}</span>
                            <span className="text-muted-foreground text-xs">→</span>
                            <span className="text-muted-foreground text-sm truncate">{b.caregiver?.user?.name || 'Caregiver'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            {b.startDate && <span>{new Date(b.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                            {b.totalAmount != null && <span className="flex items-center gap-0.5"><IndianRupee className="w-3 h-3" />{Number(b.totalAmount).toLocaleString('en-IN')}</span>}
                          </div>
                        </div>
                        <Badge className={`text-[10px] rounded-full ${statusColors[b.status] || 'bg-gray-100 text-gray-700'}`}>{b.status?.replace(/_/g, ' ')}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Recent Reviews */}
              {userData.reviews && userData.reviews.length > 0 && (
                <Card className="rounded-2xl border-0 shadow-sm">
                  <CardHeader className="pb-2 px-4 pt-4">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Reviews</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    {userData.reviews.map((r: any) => (
                      <div key={r.id} className="bg-muted/60 rounded-xl p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <StarRating rating={r.rating || 0} />
                          <span className="text-xs text-muted-foreground">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</span>
                        </div>
                        {r.comment && <p className="text-xs text-muted-foreground line-clamp-2">{r.comment}</p>}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Recent Complaints */}
              {userData.complaints && userData.complaints.length > 0 && (
                <Card className="rounded-2xl border-0 shadow-sm">
                  <CardHeader className="pb-2 px-4 pt-4">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Complaints</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    {userData.complaints.map((c: any) => (
                      <div key={c.id} className="bg-muted/60 rounded-xl p-3 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">{c.subject || 'Complaint'}</span>
                          <Badge className={`text-[10px] rounded-full ${statusColors[c.status] || 'bg-gray-100 text-gray-700'}`}>{c.status?.replace(/_/g, ' ')}</Badge>
                          {c.priority && <Badge className={`text-[10px] rounded-full ${priorityColors[c.priority] || ''}`}>{c.priority}</Badge>}
                        </div>
                        <span className="text-xs text-muted-foreground">{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="p-6 text-center text-muted-foreground">Failed to load user data.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
