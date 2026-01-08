import React from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

const WalletButton: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // ✅ Explicit connectors
  const coinbaseConnector = connectors.find(
    (c) => c.name === "Coinbase Wallet"
  );
  const injectedConnector = connectors.find(
    (c) => c.type === "injected"
  );

  const handleConnect = async () => {
    try {
      // ✅ Prefer Coinbase Wallet (Base-first)
      if (coinbaseConnector) {
        await connect({ connector: coinbaseConnector });
        return;
      }

      // ✅ Fallback to injected (MetaMask)
      if (injectedConnector) {
        await connect({ connector: injectedConnector });
      }
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 rounded-xl shadow-lg">
        <div className="flex flex-col items-end">
          <span className="text-xs text-blue-200">Connected</span>
          <span className="text-sm font-mono font-semibold">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium transition-all"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105"
    >
      Connect Wallet
    </button>
  );
};

export default WalletButton;
