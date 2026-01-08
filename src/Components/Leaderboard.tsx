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
      
      // Use public RPC if no wallet is connected
      let provider;
      if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        // Use Base mainnet public RPC
        provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
      }
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

      // Call getLeaderboard() - your contract returns top 5
      const [addresses, scores] = await contract.getLeaderboard();

      console.log("📊 Raw leaderboard data:", { addresses, scores });

      // Format leaderboard entries - contract already sorts them
      const formatted: LeaderboardEntry[] = addresses
        .map((addr: string, i: number) => ({
          address: addr,
          score: Number(scores[i]),
        }))
        .filter((entry: LeaderboardEntry) => entry.score > 0); // Only show players with scores

      setLeaderboard(formatted);
      
      console.log("✅ Leaderboard loaded:", formatted.length, "players");
    } catch (err: any) {
      console.error("❌ Error loading leaderboard:", err);
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();

    // Set up event listener for score submissions
    const setupEventListener = async () => {
      try {
        let provider;
        if (window.ethereum) {
          provider = new ethers.BrowserProvider(window.ethereum);
        } else {
          provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
        }
        
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

        const handleScoreSubmitted = (player: string, score: bigint, timestamp: bigint) => {
          console.log(`🎯 New score event: ${player} scored ${score.toString()}`);
          // Reload leaderboard after score submission
          setTimeout(() => {
            console.log("🔄 Refreshing leaderboard...");
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

  // Reload when new transaction is confirmed
  useEffect(() => {
    if (txHash) {
      console.log("✅ New transaction detected:", txHash);
      console.log("🔄 Refreshing leaderboard in 3 seconds...");
      // Wait for blockchain to update
      setTimeout(() => {
        loadLeaderboard();
      }, 3000);
    }
  }, [txHash]);

  return (
    <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-2xl shadow-2xl p-6 w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-2xl text-white flex items-center gap-2">
          🏆 Top Players
        </h2>
        <button
          onClick={loadLeaderboard}
          disabled={loading}
          className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-all disabled:opacity-50 shadow-md"
          title="Refresh leaderboard"
        >
          {loading ? "⏳" : "🔄"}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-400 border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-300">Loading leaderboard...</p>
        </div>
      ) : error ? (
        <div className="text-center py-6">
          <p className="text-sm text-red-300 mb-3">❌ {error}</p>
          <button
            onClick={loadLeaderboard}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-all"
          >
            🔄 Retry
          </button>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-5xl mb-3">🎮</p>
          <p className="text-sm text-gray-300">No players yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((item, i) => (
            <div
              key={`${item.address}-${i}`}
              className={`flex justify-between items-center rounded-xl px-4 py-3 shadow-lg transition-all hover:scale-102 ${
                i === 0
                  ? "bg-gradient-to-r from-yellow-500 to-yellow-600 border-2 border-yellow-300"
                  : i === 1
                  ? "bg-gradient-to-r from-gray-400 to-gray-500 border-2 border-gray-300"
                  : i === 2
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 border-2 border-orange-300"
                  : "bg-green-700/60 hover:bg-green-700/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-3xl ${i < 3 ? 'animate-bounce' : ''}`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </span>
                <span className="truncate max-w-[140px] sm:max-w-[180px] font-mono text-sm font-medium">
                  {item.address.slice(0, 6)}...{item.address.slice(-4)}
                </span>
              </div>
              <span className={`font-bold text-xl ${
                i === 0 ? 'text-yellow-100' : 
                i === 1 ? 'text-gray-100' : 
                i === 2 ? 'text-orange-100' : 
                'text-green-100'
              }`}>
                {item.score}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-xs text-green-200 text-center">
        🔗 Live on Base • Updates automatically
      </div>
    </div>
  );
};

export default Leaderboard;