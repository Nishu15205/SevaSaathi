'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Loader2,
  IndianRupee,
  Shield,
  AlertCircle,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onSuccess?: () => void;
}

type PaymentStep = 'upi' | 'paid' | 'verifying' | 'success' | 'failed';

export function PaymentDialog({ isOpen, onClose, booking, onSuccess }: PaymentDialogProps) {
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState<PaymentStep>('upi');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [copied, setCopied] = useState('');

  if (!booking) return null;

  const totalAmount = booking.totalAmount || 0;
  const platformFee = Math.round(totalAmount * 0.10);
  const caregiverFee = totalAmount - platformFee;
  const shiftLabel = booking.shiftType?.replace(/_/g, ' ') || 'Shift';
  const startDate = booking.startDate
    ? new Date(booking.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A';

  const platformUpiId = 'nishu@webwallah.in';
  const platformName = 'SevaSaathi';
  const paymentRef = `SS-${booking.id.slice(-8).toUpperCase()}`;

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const upiDeepLink = `upi://pay?pa=${platformUpiId}&pn=${encodeURIComponent(platformName)}&am=${totalAmount / 100}&cu=INR&tn=${encodeURIComponent(paymentRef)}`;

  const handleOpenUpi = async () => {
    // Create order in DB first
    setLoading(true);
    try {
      await api.payments.createOrder(booking.id, totalAmount / 100);
      // Open UPI app
      window.location.href = upiDeepLink;
      setStep('paid');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create order');
      setStep('failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPaid = async () => {
    setLoading(true);
    setStep('verifying');
    try {
      const verifyRes = await api.payments.verify({ bookingId: booking.id, paymentMethod: 'upi' });
      if (verifyRes.success) {
        setPaymentResult({ transactionId: paymentRef, method: 'UPI' });
        setStep('success');
        toast.success('Payment confirmed! Booking is now active.');
        onSuccess?.();
      } else {
        throw new Error(verifyRes.message || 'Confirmation failed');
      }
    } catch (err: any) {
      setStep('failed');
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 'verifying') return;
    // Warn user that booking requires payment
    if (step === 'upi') {
      // Allow closing but notify
      toast.error('Payment is required to confirm your booking. You can pay later from My Bookings tab.');
    }
    setStep('upi');
    setPaymentResult(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl">
        <AnimatePresence mode="wait">
          {/* STEP: UPI Payment Details */}
          {step === 'upi' && (
            <motion.div key="upi" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <div className="bg-forest-900 text-white px-6 py-5 rounded-t-2xl">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-lime-400" />
                    Pay for Care Services
                  </DialogTitle>
                  <DialogDescription className="text-forest-200 text-sm mt-1">
                    Secure payment via UPI — pay directly to the platform
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Amount */}
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-3xl font-bold text-forest-900">{'\u20B9'}{totalAmount.toLocaleString('en-IN')}</p>
                </div>

                {/* Booking Info */}
                <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 rounded-xl p-3">
                  <div><span className="text-gray-400">Caregiver</span><p className="font-medium text-gray-800 text-xs mt-0.5">{booking.caregiver?.user?.name || 'N/A'}</p></div>
                  <div><span className="text-gray-400">Patient</span><p className="font-medium text-gray-800 text-xs mt-0.5">{booking.patient?.name || 'N/A'}</p></div>
                  <div><span className="text-gray-400">Date</span><p className="font-medium text-gray-800 text-xs mt-0.5">{startDate}</p></div>
                  <div><span className="text-gray-400">Shift</span><p className="font-medium text-gray-800 text-xs mt-0.5">{shiftLabel}</p></div>
                </div>

                <Separator />

                {/* UPI Details Card */}
                <Card className="border-2 border-forest-200 rounded-xl overflow-hidden">
                  <div className="bg-forest-50 px-4 py-2 border-b border-forest-100">
                    <p className="text-xs font-semibold text-forest-700">Pay to this UPI Address</p>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <Label className="text-xs text-gray-500">UPI ID</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2.5 font-mono text-sm font-semibold text-gray-800">{platformUpiId}</div>
                        <Button variant="outline" size="sm" onClick={() => copyText(platformUpiId, 'upi')} className="shrink-0 rounded-lg h-9 w-9 p-0">
                          {copied === 'upi' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Payment Reference (add in UPI note)</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2.5 font-mono text-sm font-bold text-yellow-800">{paymentRef}</div>
                        <Button variant="outline" size="sm" onClick={() => copyText(paymentRef, 'ref')} className="shrink-0 rounded-lg h-9 w-9 p-0">
                          {copied === 'ref' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Cost Breakdown */}
                <div className="space-y-1.5 text-xs text-gray-500">
                  <div className="flex justify-between"><span>Caregiver Fee (90%)</span><span className="text-gray-700">{'\u20B9'}{caregiverFee.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-orange-600">Platform Fee (10%)</span><span className="text-orange-600">{'\u20B9'}{platformFee.toLocaleString('en-IN')}</span></div>
                </div>

                {/* Pay Button */}
                <Button
                  onClick={handleOpenUpi}
                  disabled={loading}
                  className="w-full h-12 bg-black hover:bg-gray-900 text-white rounded-xl text-base font-semibold gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Smartphone className="h-5 w-5" />}
                  {loading ? 'Opening UPI...' : `Pay {'\u20B9'}${totalAmount.toLocaleString('en-IN')} via UPI`}
                </Button>

                <p className="text-[11px] text-gray-400 text-center">Opens GPay / PhonePe / Paytm / any UPI app</p>
              </div>
            </motion.div>
          )}

          {/* STEP: Awaiting Confirmation */}
          {step === 'paid' && (
            <motion.div key="paid" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center py-12 px-6">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Smartphone className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Payment Sent?</h3>
              <p className="text-sm text-gray-500 text-center mb-4">Complete the payment in your UPI app, then confirm below</p>
              <div className="w-full bg-gray-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Amount</span><span className="font-semibold text-forest-900">{'\u20B9'}{totalAmount.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">To</span><span className="text-gray-600 font-mono text-xs">{platformUpiId}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Reference</span><span className="font-mono text-xs text-gray-600">{paymentRef}</span></div>
              </div>
              <div className="flex gap-3 w-full">
                <Button variant="outline" onClick={() => setStep('upi')} className="flex-1 h-11 rounded-xl">Back</Button>
                <Button onClick={handleConfirmPaid} disabled={loading} className="flex-1 h-11 bg-forest-900 hover:bg-forest-800 text-white rounded-xl font-semibold gap-2 cursor-pointer disabled:opacity-50">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  I've Paid
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP: Verifying */}
          {step === 'verifying' && (
            <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 px-6">
              <Loader2 className="h-10 w-10 text-forest-900 animate-spin mb-4" />
              <h3 className="text-lg font-bold text-gray-900">Confirming...</h3>
              <p className="text-sm text-gray-500">Please wait</p>
            </motion.div>
          )}

          {/* STEP: Success */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center justify-center py-14 px-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Payment Confirmed! {'\u2713'}</h3>
              <p className="text-sm text-gray-500 mb-6">Your care booking is now active</p>
              <div className="w-full bg-gray-50 rounded-xl p-4 mb-5 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-gray-400">Paid</span><span className="font-semibold">{'\u20B9'}{totalAmount.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Reference</span><span className="font-mono text-xs">{paymentRef}</span></div>
              </div>
              <Button onClick={handleClose} className="w-full h-11 bg-forest-900 text-white rounded-xl font-semibold">Done</Button>
            </motion.div>
          )}

          {/* STEP: Failed */}
          {step === 'failed' && (
            <motion.div key="failed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center justify-center py-14 px-6">
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Payment Issue</h3>
              <p className="text-sm text-gray-500 text-center mb-2">{errorMsg || 'Something went wrong'}</p>
              <Button onClick={() => { setStep('upi'); setErrorMsg(''); }} className="w-full h-11 bg-forest-900 text-white rounded-xl font-semibold mt-6">Try Again</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
