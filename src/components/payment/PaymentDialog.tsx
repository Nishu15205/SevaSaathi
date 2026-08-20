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
  QrCode,
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

type PaymentStep = 'method' | 'paying' | 'success' | 'failed';
type PayMethod = 'upi' | 'cash';

export function PaymentDialog({ isOpen, onClose, booking, onSuccess }: PaymentDialogProps) {
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState<PaymentStep>('method');
  const [selectedMethod, setSelectedMethod] = useState<PayMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentResult, setPaymentResult] = useState<any>(null);

  if (!booking) return null;

  const totalAmount = booking.totalAmount || 0;
  const platformFee = Math.round(totalAmount * 0.10);
  const caregiverFee = totalAmount - platformFee;

  const handlePay = async () => {
    if (!user?.id) return;
    if (selectedMethod === 'upi' && !upiId.trim()) {
      toast.error('Please enter your UPI ID');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setStep('paying');

    try {
      const orderRes = await api.payments.createOrder(booking.id, totalAmount / 100, selectedMethod, upiId);

      // For UPI: Show QR / UPI ID to pay
      if (selectedMethod === 'upi') {
        // Simulate UPI payment - in production, integrate with a real UPI gateway
        // For now, auto-verify after showing payment details
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Verify the payment
      const verifyRes = await api.payments.verify({ bookingId: booking.id, paymentMethod: selectedMethod });

      if (verifyRes.success) {
        setPaymentResult({ transactionId: orderRes.orderId, method: selectedMethod });
        setStep('success');
        toast.success('Payment Successful! Booking confirmed.');
        onSuccess?.();
      } else {
        throw new Error(verifyRes.message || 'Payment verification failed');
      }
    } catch (err: any) {
      setStep('failed');
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 'paying') return;
    setStep('method');
    setPaymentResult(null);
    setErrorMsg('');
    setSelectedMethod('upi');
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
                    Choose a payment method for your care booking
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
                      <p className="text-xs text-gray-400">Pay via Google Pay, PhonePe, Paytm, or any UPI app</p>
                    </div>
                    <QrCode className={`h-5 w-5 ${selectedMethod === 'upi' ? 'text-forest-500' : 'text-gray-300'}`} />
                  </button>

                  {selectedMethod === 'upi' && (
                    <div className="pl-14">
                      <Label className="text-xs text-gray-500">Your UPI ID</Label>
                      <Input
                        placeholder="yourname@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="mt-1 rounded-xl"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">Enter the UPI ID you want to pay from</p>
                    </div>
                  )}

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
                      <p className="text-xs text-gray-400">Hand over cash directly. Payment confirmed after verification.</p>
                    </div>
                  </button>
                </div>

                <Separator className="bg-gray-100" />

                {/* Payment Breakdown */}
                <Card className="border-forest-100 bg-forest-50/30 rounded-xl">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Caregiver Fee</span>
                      <span className="font-medium text-gray-800">₹{caregiverFee.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-orange-600">Platform Fee (10%)</span>
                      <span className="font-medium text-orange-600">₹{platformFee.toLocaleString('en-IN')}</span>
                    </div>
                    <Separator className="bg-forest-200/50" />
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-gray-900">Total Amount</span>
                      <span className="text-xl font-bold text-forest-900">₹{totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={handlePay}
                  disabled={loading || (selectedMethod === 'upi' && !upiId.trim())}
                  className="w-full h-12 bg-black hover:bg-gray-900 text-white rounded-xl text-base font-semibold gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <IndianRupee className="h-5 w-5" />}
                  {loading ? 'Processing...' : `Pay ₹${totalAmount.toLocaleString('en-IN')}`}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Secure payment · 256-bit SSL encryption</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP: Paying */}
          {step === 'paying' && (
            <motion.div key="paying" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-20 h-20 rounded-full bg-forest-900/10 flex items-center justify-center mb-6">
                <Loader2 className="h-8 w-8 text-forest-900 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Processing Payment</h3>
              <p className="text-sm text-gray-500 text-center">Please wait while we confirm your payment...</p>
              <p className="text-xs text-gray-400 mt-4">₹{totalAmount.toLocaleString('en-IN')}</p>
            </motion.div>
          )}

          {/* STEP: Success */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center justify-center py-14 px-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }} className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Payment Successful!</h3>
              <p className="text-sm text-gray-500 mb-6">Your care booking has been confirmed</p>
              <div className="w-full bg-gray-50 rounded-xl p-4 mb-5">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount Paid</span>
                    <span className="font-semibold text-forest-900">₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Method</span>
                    <span className="text-gray-600">{selectedMethod === 'upi' ? 'UPI' : 'Cash'}</span>
                  </div>
                  {paymentResult?.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Transaction ID</span>
                      <span className="font-mono text-xs text-gray-600">{paymentResult.transactionId}</span>
                    </div>
                  )}
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
                <span>Amount was not charged. Please try again.</span>
              </div>
              <Button onClick={() => { setStep('method'); setErrorMsg(''); }} className="w-full h-11 bg-forest-900 hover:bg-forest-800 text-white rounded-xl font-semibold mt-6">Try Again</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
