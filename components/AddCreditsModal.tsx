import React, { useState } from 'react';
import GlassmorphicCard from './GlassmorphicCard.tsx';

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

  const finalAmount = customAmount ? parseInt(customAmount) : amount;

  const handlePayment = async () => {
    if (finalAmount <= 0 || finalAmount < 100) {
      alert('Minimum amount is 100 credits');
      return;
    }

    setIsProcessing(true);

    try {
      await onAddCredits(finalAmount);
      alert(`Successfully added ${finalAmount} credits to your wallet!`);
      resetAndClose();
    } catch (error: any) {
      alert('Failed to add credits: ' + error.message);
    } finally {
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
              {isProcessing ? 'Processing...' : `Add ${finalAmount.toLocaleString()} Credits`}
            </button>

            <p className="text-xs text-center text-slate-400">
              Credits will be added instantly to your wallet
            </p>
          </div>
        </div>
      </GlassmorphicCard>
    </div>
  );
};

export default AddCreditsModal;
