'use client';

import { useState, useEffect } from 'react';
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
  CreditCard,
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
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onSuccess?: () => void;
}

type PaymentStep = 'summary' | 'processing' | 'success' | 'failed';

export function PaymentDialog({ isOpen, onClose, booking, onSuccess }: PaymentDialogProps) {
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState<PaymentStep>('summary');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentResult, setPaymentResult] = useState<any>(null);

  // Load Razorpay script (must be before any conditional return)
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  if (!booking) return null;

  const totalAmount = booking.totalAmount || 0;
  const platformFee = Math.round(totalAmount * 0.10);
  const caregiverFee = totalAmount - platformFee;

  const shiftLabel = booking.shiftType?.replace(/_/g, ' ') || 'Shift';
  const startDate = booking.startDate
    ? new Date(booking.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A';

  const openRazorpayCheckout = (orderData: any) => {
    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      name: orderData.name,
      description: orderData.description,
      order_id: orderData.orderId,
      handler: async function (response: any) {
        // Payment successful! Verify on server
        setStep('processing');
        try {
          const verifyRes = await api.payments.verify({
            bookingId: booking.id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          });

          if (verifyRes.success) {
            setPaymentResult({
              transactionId: response.razorpay_payment_id,
              method: 'razorpay',
            });
            setStep('success');
            toast.success('Payment Successful! Booking confirmed.');
            onSuccess?.();
          } else {
            throw new Error(verifyRes.message || 'Payment verification failed');
          }
        } catch (err: any) {
          setStep('failed');
          setErrorMsg(err.message || 'Verification failed. Contact support.');
        }
      },
      prefill: orderData.prefill || {},
      theme: {
        color: '#14532d',
      },
      modal: {
        ondismiss: function () {
          // User closed the Razorpay modal without paying
          if (step === 'summary') {
            // Don't change step, let them try again
          }
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handlePay = async () => {
    if (!user?.id) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const orderRes = await api.payments.createOrder(booking.id, totalAmount / 100);

      if (orderRes.isReal && window.Razorpay) {
        // Real Razorpay checkout
        openRazorpayCheckout(orderRes);
        setLoading(false);
      } else if (!orderRes.isReal) {
        // Test mode: simulate payment
        setStep('processing');
        await new Promise(resolve => setTimeout(resolve, 1500));
        const verifyRes = await api.payments.verify({ bookingId: booking.id, paymentMethod: 'upi' });
        if (verifyRes.success) {
          setPaymentResult({ transactionId: orderRes.orderId, method: 'test' });
          setStep('success');
          toast.success('Payment Successful! (Test Mode)');
          onSuccess?.();
        } else {
          throw new Error(verifyRes.message || 'Test payment failed');
        }
        setLoading(false);
      } else {
        // Razorpay keys set but script not loaded yet
        setStep('processing');
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (window.Razorpay) {
          openRazorpayCheckout(orderRes);
        } else {
          setStep('failed');
          setErrorMsg('Payment gateway loading failed. Please refresh and try again.');
        }
        setLoading(false);
      }
    } catch (err: any) {
      setStep('failed');
      setErrorMsg(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 'processing') return;
    setStep('summary');
    setPaymentResult(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl">
        <AnimatePresence mode="wait">
          {/* STEP: Payment Summary */}
          {step === 'summary' && (
            <motion.div key="summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <div className="bg-forest-900 text-white px-6 py-5 rounded-t-2xl">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-lime-400" />
                    Make Payment
                  </DialogTitle>
                  <DialogDescription className="text-forest-200 text-sm mt-1">
                    Secure payment via Razorpay
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Booking Summary */}
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Booking Details</p>
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

                {/* Payment Methods supported */}
                <div className="flex flex-wrap gap-2">
                  {['UPI', 'Cards', 'Net Banking', 'Wallets'].map(m => (
                    <span key={m} className="text-[11px] font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                      {m}
                    </span>
                  ))}
                </div>

                <Separator className="bg-gray-100" />

                {/* Cost Breakdown */}
                <Card className="border-forest-100 bg-forest-50/30 rounded-xl">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Caregiver Fee</span>
                      <span className="font-medium text-gray-800">{'₹'}{caregiverFee.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-orange-600">Platform Fee (10%)</span>
                      <span className="font-medium text-orange-600">{'₹'}{platformFee.toLocaleString('en-IN')}</span>
                    </div>
                    <Separator className="bg-forest-200/50" />
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-forest-900">{'₹'}{totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={handlePay}
                  disabled={loading}
                  className="w-full h-12 bg-black hover:bg-gray-900 text-white rounded-xl text-base font-semibold gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CreditCard className="h-5 w-5" />
                  )}
                  {loading ? 'Creating order...' : `Pay {'₹'}${totalAmount.toLocaleString('en-IN')}`}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Powered by Razorpay · 256-bit SSL</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP: Processing */}
          {step === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-20 h-20 rounded-full bg-forest-900/10 flex items-center justify-center mb-6">
                <Loader2 className="h-8 w-8 text-forest-900 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Processing Payment</h3>
              <p className="text-sm text-gray-500 text-center">Please wait while we confirm your payment...</p>
            </motion.div>
          )}

          {/* STEP: Success */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center justify-center py-14 px-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }} className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Payment Successful! {'✔'}</h3>
              <p className="text-sm text-gray-500 mb-6">Your care booking has been confirmed</p>
              <div className="w-full bg-gray-50 rounded-xl p-4 mb-5">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount Paid</span>
                    <span className="font-semibold text-forest-900">{'₹'}{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Method</span>
                    <span className="text-gray-600">{paymentResult?.method === 'test' ? 'Test Mode' : 'Razorpay'}</span>
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
                <span>Amount was not charged. Try again.</span>
              </div>
              <Button onClick={() => { setStep('summary'); setErrorMsg(''); }} className="w-full h-11 bg-forest-900 hover:bg-forest-800 text-white rounded-xl font-semibold mt-6">Try Again</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
