'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Loader2,
  IndianRupee,
  Shield,
  XCircle,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onSuccess?: () => void;
}

type PaymentStep = 'init' | 'loading' | 'checkout' | 'verifying' | 'success' | 'failed';

// Razorpay types for the global script
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      close: () => void;
    };
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
}

export function PaymentDialog({ isOpen, onClose, booking, onSuccess }: PaymentDialogProps) {
  const [step, setStep] = useState<PaymentStep>('init');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const totalAmount = booking?.totalAmount || 0;
  const platformFee = Math.round(totalAmount * 0.10);
  const caregiverFee = totalAmount - platformFee;
  const shiftLabel = booking?.shiftType?.replace(/_/g, ' ') || 'Shift';
  const startDate = booking?.startDate
    ? new Date(booking.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A';
  const paymentRef = booking ? `SS-${booking.id.slice(-8).toUpperCase()}` : '';

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('init');
      setErrorMsg('');
    }
  }, [isOpen]);

  const openRazorpayCheckout = useCallback(async () => {
    if (!booking) return;
    setLoading(true);
    setStep('loading');

    try {
      // 1. Load Razorpay script
      await loadRazorpayScript();

      // 2. Create order from backend
      const amount = totalAmount / 100; // API expects in rupees, backend converts to paise
      const res = await api.payments.createOrder(booking.id, amount);

      if (!res.isReal) {
        // Fallback: Razorpay not configured on server
        toast.error('Payment gateway not configured. Please contact support.');
        setStep('failed');
        setLoading(false);
        return;
      }

      // 3. Open Razorpay Checkout
      const options: RazorpayOptions = {
        key: res.key,
        amount: res.amount,
        currency: res.currency,
        name: res.name,
        description: res.description,
        order_id: res.orderId,
        prefill: res.prefill,
        theme: { color: '#14532d' },
        handler: async (response: RazorpayResponse) => {
          setStep('verifying');
          try {
            const verifyRes = await api.payments.verify({
              bookingId: booking.id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (verifyRes.success) {
              setStep('success');
              toast.success('Payment confirmed! Booking is now active.');
              onSuccess?.();
            } else {
              throw new Error(verifyRes.message || 'Payment verification failed');
            }
          } catch (err: any) {
            setStep('failed');
            setErrorMsg(err.message || 'Verification failed. Please contact support.');
          }
          setLoading(false);
        },
        modal: {
          ondismiss: () => {
            setStep('init');
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      setStep('checkout');
      setLoading(false);
    } catch (err: any) {
      console.error('Payment error:', err);
      setStep('failed');
      setErrorMsg(err.message || 'Failed to initialize payment. Please try again.');
      setLoading(false);
    }
  }, [booking, totalAmount, onSuccess]);

  // When Razorpay checkout is open, our dialog overlay blocks clicks on it.
  // This effect injects CSS to push Razorpay above our dialog.
  useEffect(() => {
    if (step !== 'checkout') return;
    const id = 'rzp-zindex-fix';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      .razorpay-backdrop { z-index: 99999 !important; }
      .razorpay-container { z-index: 100000 !important; }
      .razorpay-overlay { z-index: 99999 !important; }
      /* Make our dialog overlay non-interactive so Razorpay can receive clicks */
      [data-radix-dialog-overlay] { pointer-events: none !important; }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById(id)?.remove(); };
  }, [step]);

  const handleClose = () => {
    if (step === 'verifying' || step === 'checkout') return;
    setStep('init');
    setErrorMsg('');
    onClose();
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl">
        <AnimatePresence mode="wait">
          {/* STEP: Payment Init / Ready to Pay */}
          {step === 'init' && (
            <motion.div
              key="init"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="bg-forest-900 text-white px-6 py-5 rounded-t-2xl">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-lime-400" />
                    Complete Payment
                  </DialogTitle>
                  <DialogDescription className="text-forest-200 text-sm mt-1">
                    Secure payment powered by Razorpay
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Amount Display */}
                <div className="text-center py-3">
                  <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                  <p className="text-4xl font-bold text-forest-900">
                    {'\u20B9'}{totalAmount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">for {shiftLabel} shift</p>
                </div>

                {/* Booking Info Card */}
                <div className="bg-gray-50 rounded-xl p-3.5 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400 text-xs">Caregiver</span>
                      <p className="font-medium text-gray-800 text-xs mt-0.5 truncate">
                        {booking.caregiver?.user?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Patient</span>
                      <p className="font-medium text-gray-800 text-xs mt-0.5 truncate">
                        {booking.patient?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Date</span>
                      <p className="font-medium text-gray-800 text-xs mt-0.5">{startDate}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Ref</span>
                      <p className="font-mono font-semibold text-xs text-gray-600">{paymentRef}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Fee Breakdown */}
                <div className="space-y-1.5 text-xs text-gray-500 px-1">
                  <div className="flex justify-between">
                    <span>Caregiver Payout (90%)</span>
                    <span className="text-gray-700">{'\u20B9'}{caregiverFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-600">Platform Fee (10%)</span>
                    <span className="text-orange-600">{'\u20B9'}{platformFee.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-4 py-1">
                  <div className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Shield className="h-3.5 w-3.5" />
                    <span>256-bit SSL</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Razorpay Secure</span>
                  </div>
                </div>

                {/* Pay Button */}
                <Button
                  onClick={openRazorpayCheckout}
                  disabled={loading}
                  className="w-full h-12 bg-black hover:bg-gray-900 text-white rounded-xl text-base font-semibold gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <CreditCard className="h-5 w-5" />
                  Pay {'\u20B9'}{totalAmount.toLocaleString('en-IN')}
                </Button>

                <p className="text-[11px] text-gray-400 text-center">
                  Supports UPI, Cards, Net Banking & Wallets
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP: Loading / Creating Order */}
          {step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 px-6"
            >
              <Loader2 className="h-10 w-10 text-forest-900 animate-spin mb-4" />
              <h3 className="text-lg font-bold text-gray-900">Preparing Payment...</h3>
              <p className="text-sm text-gray-500 mt-1">Connecting to Razorpay</p>
            </motion.div>
          )}

          {/* STEP: Razorpay Checkout is Open */}
          {step === 'checkout' && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 px-6"
            >
              <div className="w-16 h-16 rounded-full bg-forest-50 flex items-center justify-center mb-4">
                <CreditCard className="h-8 w-8 text-forest-900" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Complete Payment</h3>
              <p className="text-sm text-gray-500 mt-1 text-center max-w-xs">
                Please complete the payment in the Razorpay window. Do not close this page.
              </p>
              <div className="mt-4 bg-gray-50 rounded-lg px-4 py-2 text-sm font-semibold text-forest-900">
                {'\u20B9'}{totalAmount.toLocaleString('en-IN')}
              </div>
            </motion.div>
          )}

          {/* STEP: Verifying Payment */}
          {step === 'verifying' && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 px-6"
            >
              <Loader2 className="h-10 w-10 text-forest-900 animate-spin mb-4" />
              <h3 className="text-lg font-bold text-gray-900">Verifying Payment...</h3>
              <p className="text-sm text-gray-500 mt-1">Please wait while we confirm</p>
            </motion.div>
          )}

          {/* STEP: Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-14 px-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5"
              >
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Payment Successful! {'\u2713'}</h3>
              <p className="text-sm text-gray-500 mb-6">Your care booking is now confirmed</p>
              <div className="w-full bg-gray-50 rounded-xl p-4 mb-5 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount Paid</span>
                  <span className="font-semibold text-green-700">{'\u20B9'}{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Reference</span>
                  <span className="font-mono text-xs text-gray-600">{paymentRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Method</span>
                  <span className="text-gray-600">Razorpay</span>
                </div>
              </div>
              <Button
                onClick={handleClose}
                className="w-full h-11 bg-forest-900 hover:bg-forest-800 text-white rounded-xl font-semibold cursor-pointer"
              >
                Done
              </Button>
            </motion.div>
          )}

          {/* STEP: Failed */}
          {step === 'failed' && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-14 px-6"
            >
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Payment Failed</h3>
              <p className="text-sm text-gray-500 text-center mb-2 max-w-xs">
                {errorMsg || 'Something went wrong. Please try again.'}
              </p>
              <Button
                onClick={() => { setStep('init'); setErrorMsg(''); }}
                className="w-full h-11 bg-forest-900 hover:bg-forest-800 text-white rounded-xl font-semibold mt-6 gap-2 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
