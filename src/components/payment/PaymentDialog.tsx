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
  Smartphone,
  Banknote,
  Copy,
  Check,
  Clock,
  ExternalLink,
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

type PaymentStep = 'method' | 'upi_details' | 'awaiting' | 'verifying' | 'success' | 'failed';
type PayMethod = 'upi' | 'cash';

export function PaymentDialog({ isOpen, onClose, booking, onSuccess }: PaymentDialogProps) {
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState<PaymentStep>('method');
  const [selectedMethod, setSelectedMethod] = useState<PayMethod>('upi');
  const [upiRef, setUpiRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  if (!booking) return null;

  const totalAmount = booking.totalAmount || 0;
  const platformFee = Math.round(totalAmount * 0.10);
  const caregiverFee = totalAmount - platformFee;

  // Platform UPI details (admin receives payment here)
  const platformUpiId = 'nishu@webwallah.in'; // from .env in production
  const platformUpiName = 'SevaSaathi - Nishu';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProceedToPay = () => {
    if (selectedMethod === 'upi') {
      // First create the order in DB
      setLoading(true);
      api.payments.createOrder(booking.id, totalAmount / 100, 'upi', upiRef || undefined)
        .then(() => {
          setStep('upi_details');
          setLoading(false);
        })
        .catch((err: any) => {
          setErrorMsg(err.message || 'Failed to create order');
          setStep('failed');
          setLoading(false);
        });
    } else {
      // Cash: create order and go straight to awaiting
      setLoading(true);
      api.payments.createOrder(booking.id, totalAmount / 100, 'cash')
        .then(() => {
          setStep('awaiting');
          setLoading(false);
        })
        .catch((err: any) => {
          setErrorMsg(err.message || 'Failed to create order');
          setStep('failed');
          setLoading(false);
        });
    }
  };

  const handleConfirmPaid = async () => {
    setLoading(true);
    setStep('verifying');
    try {
      const verifyRes = await api.payments.verify({ bookingId: booking.id, paymentMethod: selectedMethod });
      if (verifyRes.success) {
        setPaymentResult({ transactionId: verifyRes.paymentId || `SS-${Date.now()}`, method: selectedMethod });
        setStep('success');
        toast.success('Payment confirmed! Booking is now active.');
        onSuccess?.();
      } else {
        throw new Error(verifyRes.message || 'Verification failed');
      }
    } catch (err: any) {
      setStep('failed');
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 'verifying' || step === 'awaiting') return;
    setStep('method');
    setPaymentResult(null);
    setErrorMsg('');
    setSelectedMethod('upi');
    setUpiRef('');
    onClose();
  };

  const shiftLabel = booking.shiftType?.replace(/_/g, ' ') || 'Shift';
  const startDate = booking.startDate
    ? new Date(booking.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl">
        <AnimatePresence mode="wait">
          {/* STEP: Choose Method */}
          {step === 'method' && (
            <motion.div key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <div className="bg-forest-900 text-white px-6 py-5 rounded-t-2xl">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-lime-400" />
                    Make Payment
                  </DialogTitle>
                  <DialogDescription className="text-forest-200 text-sm mt-1">
                    Choose how you want to pay for care services
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Booking Summary */}
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Booking Summary</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Caregiver</span>
                      <p className="font-medium text-gray-800">{booking.caregiver?.user?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Patient</span>
                      <p className="font-medium text-gray-800">{booking.patient?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Date</span>
                      <p className="font-medium text-gray-800">{startDate}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Shift</span>
                      <Badge variant="outline" className="text-[10px] rounded-full border-forest-200 text-forest-700">{shiftLabel}</Badge>
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-100" />

                {/* Payment Methods */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment Method</p>
                  
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('upi')}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      selectedMethod === 'upi' ? 'border-forest-500 bg-forest-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedMethod === 'upi' ? 'bg-forest-100' : 'bg-gray-100'}`}>
                      <Smartphone className={`h-5 w-5 ${selectedMethod === 'upi' ? 'text-forest-700' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${selectedMethod === 'upi' ? 'text-forest-900' : 'text-gray-700'}`}>UPI Payment</p>
                      <p className="text-xs text-gray-400">Pay via GPay, PhonePe, Paytm or any UPI app</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('cash')}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      selectedMethod === 'cash' ? 'border-forest-500 bg-forest-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedMethod === 'cash' ? 'bg-forest-100' : 'bg-gray-100'}`}>
                      <Banknote className={`h-5 w-5 ${selectedMethod === 'cash' ? 'text-forest-700' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${selectedMethod === 'cash' ? 'text-forest-900' : 'text-gray-700'}`}>Pay Cash to Caregiver</p>
                      <p className="text-xs text-gray-400">Hand over cash directly to the caregiver</p>
                    </div>
                  </button>
                </div>

                <Separator className="bg-gray-100" />

                {/* Payment Breakdown */}
                <Card className="border-forest-100 bg-forest-50/30 rounded-xl">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Caregiver Fee</span>
                      <span className="font-medium text-gray-800">{'\u20B9'}{caregiverFee.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-orange-600">Platform Fee (10%)</span>
                      <span className="font-medium text-orange-600">{'\u20B9'}{platformFee.toLocaleString('en-IN')}</span>
                    </div>
                    <Separator className="bg-forest-200/50" />
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-forest-900">{'\u20B9'}{totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={handleProceedToPay}
                  disabled={loading}
                  className="w-full h-12 bg-black hover:bg-gray-900 text-white rounded-xl text-base font-semibold gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <IndianRupee className="h-5 w-5" />}
                  {loading ? 'Creating order...' : `Pay {'\u20B9'}{totalAmount.toLocaleString('en-IN')}`}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Secure payment via UPI</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP: UPI Payment Details */}
          {step === 'upi_details' && (
            <motion.div key="upi_details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <div className="bg-forest-900 text-white px-6 py-5 rounded-t-2xl">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-lime-400" />
                    Pay via UPI
                  </DialogTitle>
                  <DialogDescription className="text-forest-200 text-sm mt-1">
                    Send payment to the platform UPI below
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Amount to pay */}
                <div className="text-center py-3">
                  <p className="text-sm text-gray-500">Amount to Pay</p>
                  <p className="text-3xl font-bold text-forest-900 mt-1">{'\u20B9'}{totalAmount.toLocaleString('en-IN')}</p>
                </div>

                {/* Platform UPI Details Card */}
                <Card className="border-2 border-forest-200 rounded-xl overflow-hidden">
                  <div className="bg-forest-50 px-4 py-2.5 border-b border-forest-100">
                    <p className="text-xs font-semibold text-forest-700 uppercase tracking-wider">Pay to this UPI</p>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    {/* UPI ID */}
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500">UPI ID</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-50 rounded-lg px-4 py-3 font-mono text-sm font-semibold text-gray-800">
                          {platformUpiId}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(platformUpiId)}
                          className="shrink-0 rounded-lg h-10 w-10 p-0"
                        >
                          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Account Name</p>
                      <p className="text-sm font-medium text-gray-800">{platformUpiName}</p>
                    </div>

                    {/* Reference */}
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Payment Reference (mention in UPI note)</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 font-mono text-sm font-bold text-yellow-800">
                          SS-{booking.id.slice(-8).toUpperCase()}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(`SS-${booking.id.slice(-8).toUpperCase()}`)}
                          className="shrink-0 rounded-lg h-10 w-10 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-[11px] text-yellow-600">Copy this reference and add it in your UPI payment note</p>
                    </div>
                  </CardContent>
                </Card>

                {/* UPI App Links */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 text-center">Open your UPI app and pay</p>
                  <div className="grid grid-cols-3 gap-2">
                    <a
                      href={`upi://pay?pa=${platformUpiId}&pn=${encodeURIComponent(platformUpiName)}&am=${totalAmount / 100}&cu=INR&tn=${encodeURIComponent(`SS-${booking.id.slice(-8).toUpperCase()}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-[11px] font-medium text-gray-600">Open UPI</span>
                    </a>
                  </div>
                </div>

                {/* Optional: Transaction Reference */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Your UPI Transaction ID (optional)</Label>
                  <Input
                    placeholder="e.g. 432156789012"
                    value={upiRef}
                    onChange={(e) => setUpiRef(e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <Button
                  onClick={() => setStep('awaiting')}
                  className="w-full h-12 bg-forest-900 hover:bg-forest-800 text-white rounded-xl text-base font-semibold gap-2.5 cursor-pointer"
                >
                  {'\u2713'} I Have Sent the Payment
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Payment will be verified by admin</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP: Awaiting Confirmation (Cash/UPI) */}
          {step === 'awaiting' && (
            <motion.div key="awaiting" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-20 h-20 rounded-full bg-forest-900/10 flex items-center justify-center mb-6">
                <Clock className="h-8 w-8 text-forest-900 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Payment Pending Verification</h3>
              {selectedMethod === 'upi' ? (
                <p className="text-sm text-gray-500 text-center mb-4">
                  Please send {'\u20B9'}{totalAmount.toLocaleString('en-IN')} to <strong>{platformUpiId}</strong> and click confirm below.
                </p>
              ) : (
                <p className="text-sm text-gray-500 text-center mb-4">
                  Please pay {'\u20B9'}{totalAmount.toLocaleString('en-IN')} in cash directly to the caregiver and click confirm below.
                </p>
              )}
              <div className="w-full bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount</span>
                  <span className="font-semibold text-forest-900">{'\u20B9'}{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Method</span>
                  <span className="text-gray-600">{selectedMethod === 'upi' ? 'UPI' : 'Cash'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Reference</span>
                  <span className="font-mono text-xs text-gray-600">SS-{booking.id.slice(-8).toUpperCase()}</span>
                </div>
              </div>
              <div className="flex gap-3 w-full">
                <Button variant="outline" onClick={() => setStep('method')} className="flex-1 h-11 rounded-xl font-semibold">
                  Back
                </Button>
                <Button
                  onClick={handleConfirmPaid}
                  disabled={loading}
                  className="flex-1 h-11 bg-forest-900 hover:bg-forest-800 text-white rounded-xl font-semibold gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm Payment
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP: Verifying */}
          {step === 'verifying' && (
            <motion.div key="verifying" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-20 h-20 rounded-full bg-forest-900/10 flex items-center justify-center mb-6">
                <Loader2 className="h-8 w-8 text-forest-900 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Confirming Payment...</h3>
              <p className="text-sm text-gray-500 text-center">Booking will be confirmed shortly</p>
            </motion.div>
          )}

          {/* STEP: Success */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center justify-center py-14 px-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }} className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Payment Confirmed!</h3>
              <p className="text-sm text-gray-500 mb-6">Your care booking is now active</p>
              <div className="w-full bg-gray-50 rounded-xl p-4 mb-5">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount</span>
                    <span className="font-semibold text-forest-900">{'\u20B9'}{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Method</span>
                    <span className="text-gray-600">{selectedMethod === 'upi' ? 'UPI' : 'Cash'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reference</span>
                    <span className="font-mono text-xs text-gray-600">{paymentResult?.transactionId}</span>
                  </div>
                </div>
              </div>
              <Button onClick={handleClose} className="w-full h-11 bg-forest-900 hover:bg-forest-800 text-white rounded-xl font-semibold">Done</Button>
            </motion.div>
          )}

          {/* STEP: Failed */}
          {step === 'failed' && (
            <motion.div key="failed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center justify-center py-14 px-6">
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Payment Failed</h3>
              <p className="text-sm text-gray-500 mb-2 text-center">{errorMsg || 'Something went wrong'}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-4">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Please try again</span>
              </div>
              <Button onClick={() => { setStep('method'); setErrorMsg(''); }} className="w-full h-11 bg-forest-900 hover:bg-forest-800 text-white rounded-xl font-semibold mt-6">Try Again</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
