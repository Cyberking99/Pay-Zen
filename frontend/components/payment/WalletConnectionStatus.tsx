import React from 'react';

interface WalletConnectionStatusProps {
  isConnected: boolean;
  walletAddress?: string;
  className?: string;
}

export const WalletConnectionStatus: React.FC<WalletConnectionStatusProps> = ({
  isConnected,
  walletAddress,
  className = "",
}) => {
  if (!isConnected) return null;

  return (
    <div className={`mt-4 p-3 bg-green-50 border border-green-200 rounded-lg ${className}`}>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-green-700 font-medium">
          Wallet Connected
        </span>
      </div>
      {walletAddress && (
        <p className="text-xs text-green-600 mt-1 font-mono">
          {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
        </p>
      )}
    </div>
  );
};
