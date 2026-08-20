'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  CheckCircle2,
  Loader2,
  IndianRupee,
  Shield,
  AlertCircle,
  XCircle,
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
import { useToast } from '@/hooks/use-toast';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onSuccess?: () => void;
}

type PaymentStep = 'details' | 'processing' | 'success' | 'failed';

// Declare Razorpay global type
declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PaymentDialog({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: PaymentDialogProps) {
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();
  const [step, setStep] = useState<PaymentStep>('details');
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [loadingScript, setLoadingScript] = useState(false);

  // Load Razorpay checkout script dynamically
  useEffect(() => {
    if (isOpen && !window.Razorpay && !loadingScript) {
      setLoadingScript(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => setLoadingScript(false);
      script.onerror = () => {
        setLoadingScript(false);
        console.error('Failed to load Razorpay SDK');
      };
      document.body.appendChild(script);
    }
  }, [isOpen, loadingScript]);

  if (!booking) return null;

  const totalAmount = booking.totalAmount || 0;
  const platformFee = Math.round(totalAmount * 0.15);
  const caregiverFee = totalAmount - platformFee;

  const handlePay = async () => {
    if (!user?.id) return;
    setErrorMsg('');
    setStep('processing');

    try {
      // Step 1: Create Razorpay order from backend
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: totalAmount, // Backend expects INR, converts to paise
        }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Step 2: Open Razorpay Checkout
      const options = {
        key: orderData.key,
        amount: orderData.amount, // Already in paise from backend
        currency: orderData.currency || 'INR',
        name: 'SevaSaathi',
        description: orderData.description || `Payment for booking #${booking.id.slice(-6)}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // Step 3: Verify payment on backend
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: booking.id,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              setPaymentResult({
                transactionId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
              });
              setStep('success');
              toast({
                title: 'Payment Successful! ✅',
                description: 'Your care booking has been confirmed.',
              });
              onSuccess?.();
            } else {
              throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (verifyErr: any) {
            setStep('failed');
            setErrorMsg(verifyErr.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || '',
        },
        theme: {
          color: '#14532d', // Forest green
        },
        modal: {
          ondismiss: function () {
            // User closed the Razorpay modal without paying
            setStep('details');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setStep('failed');
        setErrorMsg(response.error.description || 'Payment failed. Please try again.');
      });
      rzp.open();
    } catch (err: any) {
      setStep('failed');
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      toast({
        title: 'Payment Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    if (step === 'processing') return;
    setStep('details');
    setPaymentResult(null);
    setErrorMsg('');
    onClose();
  };

  const shiftLabel = booking.shiftType?.replace(/_/g, ' ') || 'Shift';
  const startDate = booking.startDate
    ? new Date(booking.startDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl">
        <AnimatePresence mode="wait">
          {/* STEP: Details */}
          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-forest-900 text-white px-6 py-5 rounded-t-2xl">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-lime-400" />
                    Make Payment
                  </DialogTitle>
                  <DialogDescription className="text-forest-200 text-sm mt-1">
                    Secure payment via Razorpay for your care booking
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Booking Summary */}
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Booking Summary
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Caregiver</span>
                      <p className="font-medium text-gray-800">
                        {booking.caregiver?.user?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Patient</span>
                      <p className="font-medium text-gray-800">
                        {booking.patient?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Date</span>
                      <p className="font-medium text-gray-800">{startDate}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Shift</span>
                      <p className="font-medium text-gray-800">
                        <Badge
                          variant="outline"
                          className="text-[10px] rounded-full border-forest-200 text-forest-700"
                        >
                          {shiftLabel}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-100" />

                {/* Payment Breakdown */}
                <Card className="border-forest-100 bg-forest-50/30 rounded-xl">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Payment Breakdown
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Caregiver Fee</span>
                      <span className="font-medium text-gray-800">
                        ₹{caregiverFee.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="text-orange-600">Platform Fee (15%)</span>
                        <span className="text-[10px] text-orange-400 font-medium">
                          (Service fee)
                        </span>
                      </div>
                      <span className="font-medium text-orange-600">
                        ₹{platformFee.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <Separator className="bg-forest-200/50" />
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-gray-900">
                        Total Amount
                      </span>
                      <span className="text-xl font-bold text-forest-900">
                        ₹{totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Pay Button */}
                <Button
                  onClick={handlePay}
                  disabled={loadingScript}
                  className="w-full h-12 bg-black hover:bg-gray-900 text-white rounded-xl text-base font-semibold gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  {loadingScript ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <IndianRupee className="h-5 w-5" />
                  )}
                  {loadingScript
                    ? 'Loading payment gateway...'
                    : `Pay ₹${totalAmount.toLocaleString('en-IN')}`}
                </Button>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Secured by Razorpay · 256-bit SSL encryption</span>
                </div>
                <p className="text-center text-[10px] text-gray-300">
                  Supports UPI, Cards, Net Banking, Wallets & EMI
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP: Processing */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center py-16 px-6"
            >
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-forest-900/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-forest-900 animate-spin" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Processing Payment
              </h3>
              <p className="text-sm text-gray-500 text-center">
                Please complete the payment in the Razorpay window...
              </p>
              <p className="text-xs text-gray-400 mt-4">
                ₹{totalAmount.toLocaleString('en-IN')}
              </p>
            </motion.div>
          )}

          {/* STEP: Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-14 px-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 0.1,
                }}
                className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5"
              >
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold text-gray-900 mb-1"
              >
                Payment Successful!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-gray-500 mb-6"
              >
                Your care booking has been confirmed
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full bg-gray-50 rounded-xl p-4 mb-5"
              >
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount Paid</span>
                    <span className="font-semibold text-forest-900">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {paymentResult?.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Transaction ID</span>
                      <span className="font-mono text-xs text-gray-600">
                        {paymentResult.transactionId}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Method</span>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>Razorpay</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="w-full"
              >
                <Button
                  onClick={handleClose}
                  className="w-full h-11 bg-forest-900 hover:bg-forest-800 text-white rounded-xl font-semibold cursor-pointer"
                >
                  Done
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* STEP: Failed */}
          {step === 'failed' && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-14 px-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 0.1,
                }}
                className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5"
              >
                <XCircle className="h-10 w-10 text-red-500" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold text-gray-900 mb-1"
              >
                Payment Failed
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-gray-500 mb-2 text-center"
              >
                {errorMsg || 'Something went wrong. Please try again.'}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2 text-xs text-gray-400 mt-4"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Amount was not charged. Please try again.</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="w-full mt-6"
              >
                <Button
                  onClick={() => {
                    setStep('details');
                    setErrorMsg('');
                  }}
                  className="w-full h-11 bg-forest-900 hover:bg-forest-800 text-white rounded-xl font-semibold cursor-pointer"
                >
                  Try Again
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
