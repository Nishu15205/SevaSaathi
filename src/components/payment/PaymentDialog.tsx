'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Smartphone,
  Building,
  CheckCircle2,
  Loader2,
  IndianRupee,
  Shield,
  X,
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
import { toast } from 'sonner';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onSuccess?: () => void;
}

type PaymentStep = 'details' | 'processing' | 'success';
type PaymentMethod = 'upi' | 'card' | 'netbanking';

const paymentMethods: {
  id: PaymentMethod;
  label: string;
  icon: React.ReactNode;
  desc: string;
}[] = [
  {
    id: 'upi',
    label: 'UPI',
    icon: <Smartphone className="h-5 w-5" />,
    desc: 'GPay, PhonePe, Paytm',
  },
  {
    id: 'card',
    label: 'Card',
    icon: <CreditCard className="h-5 w-5" />,
    desc: 'Credit or Debit Card',
  },
  {
    id: 'netbanking',
    label: 'Net Banking',
    icon: <Building className="h-5 w-5" />,
    desc: 'All major banks',
  },
];

export function PaymentDialog({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: PaymentDialogProps) {
  const user = useAuthStore((s) => s.user);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [step, setStep] = useState<PaymentStep>('details');
  const [paymentResult, setPaymentResult] = useState<any>(null);

  if (!booking) return null;

  const totalAmount = booking.totalAmount || 0;
  const platformFee = Math.round(totalAmount * 0.15);
  const caregiverFee = totalAmount - platformFee;

  const handlePay = async () => {
    if (!user?.id) return;

    if (selectedMethod === 'upi' && !upiId.trim()) {
      toast.error('Please enter your UPI ID');
      return;
    }

    setStep('processing');

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          paymentMethod: selectedMethod,
          userId: user.id,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      setPaymentResult(data.payment);

      // Wait 2 seconds for the backend auto-complete, then fetch the updated payment
      setTimeout(async () => {
        try {
          const detailRes = await fetch(`/api/payments/${data.payment.id}`);
          const detailData = await detailRes.json();
          if (detailData.payment) {
            setPaymentResult(detailData.payment);
          }
        } catch {
          // Keep the original result
        }
        setStep('success');
        toast.success('Payment completed successfully!');
        onSuccess?.();
      }, 2500);
    } catch (err: any) {
      toast.error(err.message || 'Payment failed');
      setStep('details');
    }
  };

  const handleClose = () => {
    if (step === 'processing') return;
    setStep('details');
    setPaymentResult(null);
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
                    Secure payment for your care booking
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
                          (SevaSaathi service fee)
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

                {/* Payment Method Selection */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Payment Method
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                          selectedMethod === method.id
                            ? 'border-forest-900 bg-forest-50 shadow-sm'
                            : 'border-gray-100 hover:border-gray-200 bg-white'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            selectedMethod === method.id
                              ? 'bg-forest-900 text-white'
                              : 'bg-gray-50 text-gray-400'
                          }`}
                        >
                          {method.icon}
                        </div>
                        <span
                          className={`text-xs font-semibold ${
                            selectedMethod === method.id
                              ? 'text-forest-900'
                              : 'text-gray-500'
                          }`}
                        >
                          {method.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* UPI ID input */}
                <AnimatePresence>
                  {selectedMethod === 'upi' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        UPI ID
                      </label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="you@upi"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900/20 focus:border-forest-900 transition-all"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pay Button */}
                <Button
                  onClick={handlePay}
                  className="w-full h-12 bg-black hover:bg-gray-900 text-white rounded-xl text-base font-semibold gap-2.5 cursor-pointer"
                >
                  <IndianRupee className="h-5 w-5" />
                  Pay ₹{totalAmount.toLocaleString('en-IN')}
                </Button>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Secured by 256-bit SSL encryption</span>
                </div>
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
                Please do not close this window while we process your payment...
              </p>
              <p className="text-xs text-gray-400 mt-4">
                ₹{totalAmount.toLocaleString('en-IN')} via{' '}
                {paymentMethods.find((m) => m.id === selectedMethod)?.label}
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
                Your care booking has been paid for
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
                    <span className="text-gray-600 capitalize">
                      {selectedMethod}
                    </span>
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
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
