import React, { useState } from 'react';
import GlassmorphicCard from './GlassmorphicCard.tsx';
import { createRazorpayOrder, verifyRazorpayPayment } from '../services/api.ts';
import { useAuth } from '../AuthContext.tsx';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface AddCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCredits: (amount: number) => Promise<void>;
}

const creditOptions = [500, 1000, 2500, 5000];

const AddCreditsModal: React.FC<AddCreditsModalProps> = ({ isOpen, onClose, onAddCredits }) => {
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, refreshUser } = useAuth();

  const finalAmount = customAmount ? parseInt(customAmount) : amount;

  const handlePayment = async () => {
    if (finalAmount <= 0 || finalAmount < 100) {
      alert('Minimum amount is 100 credits');
      return;
    }

    setIsProcessing(true);

    try {
      const orderData = await createRazorpayOrder(finalAmount);

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'SubSynapse',
        description: `Add ${finalAmount} credits to wallet`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            const verificationResult = await verifyRazorpayPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            await refreshUser();
            alert(`Payment successful! ${verificationResult.amountAdded} credits added to your wallet.`);
            resetAndClose();
          } catch (error: any) {
            alert('Payment verification failed: ' + error.message);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#0ea5e9',
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setIsProcessing(false);
    } catch (error: any) {
      alert('Failed to initiate payment: ' + error.message);
      setIsProcessing(false);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    setAmount(0);
  };

  const resetAndClose = () => {
    setAmount(1000);
    setCustomAmount('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={resetAndClose}
    >
      <GlassmorphicCard
        className="w-full max-w-md m-4 p-8 relative"
        onClick={(e) => e.stopPropagation()}
        hasAnimation
        isReady={isOpen}
      >
        <button
          onClick={resetAndClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Add Credits to Your Wallet
        </h2>

        <div className="space-y-4">
          <p className="text-slate-300 text-center">
            Select an amount or enter a custom value.
          </p>

          <div className="grid grid-cols-4 gap-4">
            {creditOptions.map(opt => (
              <button
                key={opt}
                onClick={() => { setAmount(opt); setCustomAmount(''); }}
                className={`py-3 rounded-lg font-semibold transition ${
                  amount === opt && !customAmount
                    ? 'bg-sky-500 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {opt.toLocaleString()}
              </button>
            ))}
          </div>

          <input
            type="number"
            placeholder="Or enter a custom amount (min. 100)"
            value={customAmount}
            onChange={handleCustomChange}
            className="w-full px-4 py-2 bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-white placeholder-gray-400 transition"
          />

          <div className="pt-4 space-y-3">
            <button
              onClick={handlePayment}
              disabled={finalAmount < 100 || isProcessing}
              className="w-full font-bold py-3 px-6 rounded-xl transition duration-300 transform hover:scale-105 shadow-lg text-center bg-sky-500 hover:bg-sky-400 text-white disabled:bg-sky-500/50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isProcessing ? 'Processing...' : `Pay ₹${finalAmount.toLocaleString()}`}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Secured by Razorpay</span>
            </div>
          </div>
        </div>
      </GlassmorphicCard>
    </div>
  );
};

export default AddCreditsModal;
