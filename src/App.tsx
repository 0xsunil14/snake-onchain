import React, { useState, useEffect } from "react";
import SnakeGame from "./Components/SnakeGame";
import Leaderboard from "./Components/Leaderboard";
import WalletButton from "./Components/WalletButton";

import { useAccount, useSwitchChain } from "wagmi";
import { base } from "wagmi/chains";

const App: React.FC = () => {
  const [txHash, setTxHash] = useState<string | null>(null);
  const [onChainScore, setOnChainScore] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");

  // 🔹 Wallet & chain state
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  // 🔹 Force Base network (CRITICAL for Base mini apps)
  useEffect(() => {
    if (isConnected && chainId !== base.id) {
      switchChain({ chainId: base.id });
    }
  }, [isConnected, chainId, switchChain]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-green-400 text-transparent bg-clip-text drop-shadow-lg">
            🐍 Snake On-Chain
          </h1>

          {/* Base-only Wallet Button */}
          <WalletButton />
        </div>

        {/* Game + Leaderboard */}
        <div>
          {/* Status + Score */}
          {status && (
            <div className="text-sm text-gray-300 mt-2 text-center w-full">
              Status: {status}
            </div>
          )}

          {onChainScore !== null && (
            <div className="text-sm text-green-400 mt-1 text-center">
              On-chain High Score: {onChainScore}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6 justify-center items-start">
            <SnakeGame
              setOnChainScore={setOnChainScore}
              setTxHash={setTxHash}
              setStatus={setStatus}
            />
            <Leaderboard txHash={txHash} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
