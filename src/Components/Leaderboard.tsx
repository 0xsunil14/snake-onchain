import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import contractABI from "../SnakeOnChainABI.json";

const CONTRACT_ADDRESS = "0xcC8E9a9CeBF3b3a6dd21BD79A7756E3d5f4C9061";

interface LeaderboardEntry {
  address: string;
  score: number;
}

interface LeaderboardProps {
  txHash: string | null;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ txHash }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let provider;
      if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
      }
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
      const [addresses, scores] = await contract.getLeaderboard();

      const formatted: LeaderboardEntry[] = addresses
        .map((addr: string, i: number) => ({
          address: addr,
          score: Number(scores[i]),
        }))
        .filter((entry: LeaderboardEntry) => entry.score > 0);

      setLeaderboard(formatted);
    } catch (err: any) {
      console.error("❌ Error loading leaderboard:", err);
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();

    const setupEventListener = async () => {
      try {
        let provider;
        if (window.ethereum) {
          provider = new ethers.BrowserProvider(window.ethereum);
        } else {
          provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
        }
        
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

        const handleScoreSubmitted = () => {
          setTimeout(() => {
            loadLeaderboard();
          }, 2000);
        };

        contract.on("ScoreSubmitted", handleScoreSubmitted);
        
        return () => {
          contract.off("ScoreSubmitted", handleScoreSubmitted);
        };
      } catch (err) {
        console.error("Error setting up event listener:", err);
      }
    };

    setupEventListener();
  }, []);

  useEffect(() => {
    if (txHash) {
      setTimeout(() => {
        loadLeaderboard();
      }, 3000);
    }
  }, [txHash]);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-2xl">
            🏆
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Leaderboard</h2>
            <p className="text-xs text-gray-400">Top 5 Players on Base</p>
          </div>
        </div>
        <button
          onClick={loadLeaderboard}
          disabled={loading}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-all disabled:opacity-50 border border-slate-700"
          title="Refresh leaderboard"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-lg">🔄</span>
          )}
        </button>
      </div>

      {/* Leaderboard Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-gray-400">Loading leaderboard...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">⚠️</div>
          <p className="text-sm text-red-400 mb-4">{error}</p>
          <button
            onClick={loadLeaderboard}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-all"
          >
            🔄 Try Again
          </button>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700">
          <div className="text-6xl mb-3">🎮</div>
          <p className="text-lg font-semibold text-white mb-1">No Players Yet</p>
          <p className="text-sm text-gray-400">Be the first to submit a score!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((item, i) => (
            <div
              key={`${item.address}-${i}`}
              className={`flex items-center justify-between rounded-xl px-4 py-4 transition-all ${
                i === 0
                  ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/40"
                  : i === 1
                  ? "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-2 border-gray-400/40"
                  : i === 2
                  ? "bg-gradient-to-r from-orange-600/20 to-red-500/20 border-2 border-orange-500/40"
                  : "bg-slate-800/50 border border-slate-700 hover:bg-slate-800/70"
              }`}
            >
              {/* Rank & Address */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`text-3xl ${i < 3 ? 'animate-bounce' : ''}`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (
                    <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-sm font-bold text-gray-300">
                      {i + 1}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-mono text-sm font-semibold truncate ${
                    i === 0 ? 'text-yellow-300' : 
                    i === 1 ? 'text-gray-300' : 
                    i === 2 ? 'text-orange-300' : 
                    'text-blue-300'
                  }`}>
                    {item.address.slice(0, 6)}...{item.address.slice(-4)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {i === 0 ? '👑 Champion' : i === 1 ? '⭐ Runner-up' : i === 2 ? '🔥 Third Place' : 'Player'}
                  </p>
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <p className={`text-2xl font-bold ${
                  i === 0 ? 'text-yellow-300' : 
                  i === 1 ? 'text-gray-300' : 
                  i === 2 ? 'text-orange-300' : 
                  'text-blue-300'
                }`}>
                  {item.score}
                </p>
                <p className="text-xs text-gray-500">points</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span>Live on Base • Updates automatically</span>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;