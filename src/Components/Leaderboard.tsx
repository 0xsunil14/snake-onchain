import React, { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import contractABI from "../SnakeOnChainABI.json";

const CONTRACT_ADDRESS = "0xcC8E9a9CeBF3b3a6dd21BD79A7756E3d5f4C9061";

interface LeaderboardEntry {
  address: string;
  score: number;
  rank: number;
}

interface LeaderboardProps {
  txHash: string | null;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ txHash }) => {
  const publicClient = usePublicClient();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPlayers, setTotalPlayers] = useState(0);
  
  const ITEMS_PER_PAGE = 10;

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!publicClient) {
        setError("Client not ready");
        return;
      }

      // Get leaderboard
      const data = await publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: contractABI,
        functionName: 'getLeaderboard',
      }) as [readonly `0x${string}`[], readonly bigint[]];

      const [addresses, scores] = data;

      console.log("📊 Leaderboard data:", { 
        totalPlayers: addresses.length,
        addresses: addresses.slice(0, 5),
        scores: scores.slice(0, 5).map(s => Number(s))
      });

      // Format leaderboard entries with ranks
      const formatted: LeaderboardEntry[] = addresses
        .map((addr, i) => ({
          address: addr,
          score: Number(scores[i]),
          rank: i + 1,
        }))
        .filter((entry) => entry.score > 0);

      setLeaderboard(formatted);
      setTotalPlayers(formatted.length);
      
      console.log("✅ Leaderboard loaded:", formatted.length, "players");
    } catch (err: unknown) {
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
      if (!publicClient) return;

      try {
        const unwatch = publicClient.watchContractEvent({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: contractABI,
          eventName: 'ScoreSubmitted',
          onLogs: (logs) => {
            console.log("🎯 New score event detected");
            setTimeout(() => {
              console.log("🔄 Refreshing leaderboard...");
              loadLeaderboard();
            }, 2000);
          },
        });

        return () => {
          unwatch();
        };
      } catch (err) {
        console.error("Error setting up event listener:", err);
      }
    };

    setupEventListener();
  }, [publicClient]);

  // Reload when new transaction is confirmed
  useEffect(() => {
    if (txHash) {
      console.log("✅ New transaction detected:", txHash);
      console.log("🔄 Refreshing leaderboard in 3 seconds...");
      setTimeout(() => {
        loadLeaderboard();
      }, 3000);
    }
  }, [txHash]);

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  // Pagination
  const totalPages = Math.ceil(leaderboard.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPlayers = leaderboard.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-700/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold text-2xl bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-transparent bg-clip-text">
            🏆 Leaderboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Top {totalPlayers} Players
          </p>
        </div>
        <button
          onClick={loadLeaderboard}
          disabled={loading}
          className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm transition-all disabled:opacity-50 border border-slate-600/50"
          title="Refresh leaderboard"
        >
          {loading ? "⏳" : "🔄"}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin text-4xl mb-2">⏳</div>
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-sm text-red-300 mb-3">{error}</p>
          <button
            onClick={loadLeaderboard}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm transition-all"
          >
            Try Again
          </button>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🎮</div>
          <p className="text-slate-300">No players yet</p>
          <p className="text-sm text-slate-500 mt-1">Be the first!</p>
        </div>
      ) : (
        <>
          {/* Leaderboard List */}
          <div className="space-y-2 mb-4">
            {currentPlayers.map((item) => (
              <div
                key={`${item.address}-${item.rank}`}
                className={`flex justify-between items-center rounded-xl px-4 py-3 shadow-lg transition-all hover:scale-102 ${
                  item.rank === 1
                    ? "bg-gradient-to-r from-yellow-600/30 to-yellow-500/30 border-2 border-yellow-400/50"
                    : item.rank === 2
                    ? "bg-gradient-to-r from-gray-400/30 to-gray-300/30 border-2 border-gray-300/50"
                    : item.rank === 3
                    ? "bg-gradient-to-r from-orange-600/30 to-orange-500/30 border-2 border-orange-400/50"
                    : "bg-slate-700/30 border border-slate-600/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-2xl min-w-[50px] text-center ${
                      item.rank <= 3 ? "animate-pulse" : ""
                    }`}
                  >
                    {getMedalEmoji(item.rank)}
                  </span>
                  <span className="font-mono text-sm truncate max-w-[120px]">
                    {item.address.slice(0, 6)}...{item.address.slice(-4)}
                  </span>
                </div>
                <span
                  className={`font-bold text-xl ${
                    item.rank === 1
                      ? "text-yellow-300"
                      : item.rank === 2
                      ? "text-gray-200"
                      : item.rank === 3
                      ? "text-orange-300"
                      : "text-blue-300"
                  }`}
                >
                  {item.score}
                </span>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <div className="text-xs text-slate-400 text-center space-y-1">
          <div>🎯 Top {Math.min(100, totalPlayers)} players on Base</div>
          <div className="text-slate-500">Updates in real-time</div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;