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

  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  // Force Base network
  useEffect(() => {
    if (isConnected && chainId !== base.id) {
      switchChain({ chainId: base.id });
    }
  }, [isConnected, chainId, switchChain]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center text-2xl">
              🐍
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Snake On-Chain</h1>
              <p className="text-xs text-gray-400">Play • Compete • Win</p>
            </div>
          </div>
          <WalletButton />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Status Banner */}
        {status && (
          <div className={`rounded-xl p-4 text-center font-medium ${
            status.includes("✅") 
              ? "bg-green-500/10 text-green-400 border border-green-500/20" 
              : status.includes("❌")
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
          }`}>
            {status}
          </div>
        )}

        {/* High Score Display */}
        {onChainScore !== null && onChainScore > 0 && (
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-2xl">
                  🏆
                </div>
                <div>
                  <p className="text-sm text-gray-400">Your High Score</p>
                  <p className="text-3xl font-bold text-white">{onChainScore}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Stored On-Chain</p>
                <p className="text-xs text-green-400">✓ Base Network</p>
              </div>
            </div>
          </div>
        )}

        {/* Game Section */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 overflow-hidden">
          <SnakeGame
            setOnChainScore={setOnChainScore}
            setTxHash={setTxHash}
            setStatus={setStatus}
          />
        </div>

        {/* Leaderboard Section */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 overflow-hidden">
          <Leaderboard txHash={txHash} />
        </div>

        {/* Footer Info */}
        <div className="text-center space-y-2 pb-6">
          <p className="text-xs text-gray-500">
            🎮 Classic Snake Game • 🔗 Built on Base
          </p>
          <p className="text-xs text-gray-600">
            Submit your scores on-chain for FREE (gas only)
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;