import { useEffect, useRef, useState } from 'react';
import { squareService, type SquareCard, type SquareTokenizeResult } from '../../../services/api/squareService';
import { Loader2, Lock, CreditCard, X } from 'lucide-react';

interface SquarePaymentFormProps {
  amount: number;
  packId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const SquarePaymentForm = ({ amount, packId, onSuccess, onCancel }: SquarePaymentFormProps) => {
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<SquareCard | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    const initSquare = async () => {
      try {
        const payments = await squareService.initializePayments();
        
        const card = await payments.card();
        await card.attach('#card-container');
        cardRef.current = card;
        
        if (mounted.current) {
          setIsReady(true);
        }
      } catch (err) {
        if (mounted.current) {
          setError('Failed to load payment form. Please try again.');
        }
      }
    };

    initSquare();

    return () => {
      mounted.current = false;
      if (cardRef.current) {
        void cardRef.current.destroy().catch(() => {});
      }
    };
  }, []);

  const handlePayment = async () => {
    if (!cardRef.current) return;
    setIsProcessing(true);
    setError(null);

    try {
      const result = await cardRef.current.tokenize();
      
      if (result.status === 'OK') {
        const token = result.token;
        const success = await squareService.processPayment(token, packId);
        
        if (success) {
          onSuccess();
        } else {
          setError('Payment processing failed.');
        }
      } else {
        const resultWithErrors = result as SquareTokenizeResult;
        const message = 'errors' in resultWithErrors ? resultWithErrors.errors?.[0]?.message : undefined;
        setError(message || 'Payment failed');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-background border border-white/10 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Secure Checkout</h3>
              <p className="text-xs text-white/50 flex items-center gap-1">
                <Lock size={10} /> Powered by Square
              </p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 bg-gradient-to-b from-blue-500/5 to-transparent">
          <div className="text-center">
            <p className="text-sm text-white/60 mb-1">Total to pay</p>
            <div className="text-4xl font-black text-white tracking-tight">
              ${amount.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div 
            id="card-container" 
            className="min-h-[100px] bg-transparent"
          />
          
          {!isReady && !error && (
            <div className="flex items-center justify-center py-8 text-white/50 gap-2">
              <Loader2 className="animate-spin" size={20} />
              <span>Loading secure form...</span>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={!isReady || isProcessing}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white font-bold py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Processing...
              </>
            ) : (
              <>
                Pay ${amount.toFixed(2)}
                <Lock size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
              </>
            )}
          </button>
          
          <div className="mt-4 flex justify-center gap-4 opacity-30 grayscale">
          </div>
        </div>
      </div>
    </div>
  );
};
