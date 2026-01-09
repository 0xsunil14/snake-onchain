import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import contractABI from "../SnakeOnChainABI.json";

const CONTRACT_ADDRESS = "0xd65573199aF4805dFbaF21143Cd6F651743D5590";

type Point = { x: number; y: number };
type Direction = { x: number; y: number };

interface SnakeGameProps {
  setOnChainScore: React.Dispatch<React.SetStateAction<number | null>>;
  setTxHash: React.Dispatch<React.SetStateAction<string | null>>;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
}

const SnakeGame: React.FC<SnakeGameProps> = ({
  setOnChainScore,
  setTxHash,
  setStatus,
}) => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [moveDelay, setMoveDelay] = useState(150);
  const [snake, setSnake] = useState<Point[]>([]);
  const [dir, setDir] = useState<Direction>({ x: 1, y: 0 });
  const [food, setFood] = useState<Point | null>(null);
  const [paused, setPaused] = useState(false);
  
  const cellSize = 20;
  const cols = 20;
  const rows = 20;

  const spawnFood = useCallback((snakeArr: Point[]): Point => {
    const occupied = new Set(snakeArr.map((p) => `${p.x},${p.y}`));
    for (let i = 0; i < 500; i++) {
      const x = Math.floor(Math.random() * cols);
      const y = Math.floor(Math.random() * rows);
      if (!occupied.has(`${x},${y}`)) return { x, y };
    }
    return { x: 0, y: 0 };
  }, []);

  const resetGame = useCallback(() => {
    const midX = Math.floor(cols / 2);
    const midY = Math.floor(rows / 2);
    const startSnake = [
      { x: midX, y: midY },
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY },
    ];
    setSnake(startSnake);
    setDir({ x: 1, y: 0 });
    setScore(0);
    setMoveDelay(150);
    setFood(spawnFood(startSnake));
    setRunning(true);
    setGameOver(false);
    setPaused(false);
  }, [spawnFood]);

  const updateSnake = useCallback(() => {
    if (!running || paused || snake.length === 0) return;
    
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    head.x = (head.x + cols) % cols;
    head.y = (head.y + rows) % rows;

    if (snake.some((s) => s.x === head.x && s.y === head.y)) {
      setRunning(false);
      setGameOver(true);
      if (score > highScore) setHighScore(score);
      setStatus("💀 Game Over! Connect wallet to submit your score.");
      return;
    }

    let newSnake = [head, ...snake.slice(0, -1)];
    if (food && head.x === food.x && head.y === food.y) {
      newSnake = [head, ...snake];
      setScore((s) => s + 1);
      setFood(spawnFood(newSnake));
      setMoveDelay((d) => Math.max(d - 3, 80));
    }
    setSnake(newSnake);
  }, [running, paused, snake, dir, food, spawnFood, score, highScore, setStatus]);

  useEffect(() => {
    if (!running || paused) return;
    const id = setTimeout(updateSnake, moveDelay);
    return () => clearTimeout(id);
  }, [running, paused, updateSnake, moveDelay]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = cols * cellSize;
    const height = rows * cellSize;
    canvas.width = width;
    canvas.height = height;

    // Dark background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);
    
    // Grid
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= cols; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, height);
      ctx.stroke();
    }
    for (let i = 0; i <= rows; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(width, i * cellSize);
      ctx.stroke();
    }

    // Food
    if (food) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#10b981";
      ctx.fillStyle = "#10b981";
      ctx.fillRect(
        food.x * cellSize + 2,
        food.y * cellSize + 2,
        cellSize - 4,
        cellSize - 4
      );
      ctx.shadowBlur = 0;
    }

    // Snake
    snake.forEach((s, i) => {
      ctx.shadowBlur = i === 0 ? 20 : 10;
      ctx.shadowColor = i === 0 ? "#3b82f6" : "#60a5fa";
      ctx.fillStyle = i === 0 ? "#3b82f6" : "#60a5fa";
      ctx.fillRect(
        s.x * cellSize + 1,
        s.y * cellSize + 1,
        cellSize - 2,
        cellSize - 2
      );
    });
    ctx.shadowBlur = 0;
  }, [snake, food]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!running) return;
      
      if (e.key === " " || e.key === "Escape") {
        e.preventDefault();
        setPaused(p => !p);
        return;
      }
      
      const map: Record<string, Direction> = {
        ArrowUp: { x: 0, y: -1 },
        w: { x: 0, y: -1 },
        W: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        s: { x: 0, y: 1 },
        S: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        a: { x: -1, y: 0 },
        A: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        d: { x: 1, y: 0 },
        D: { x: 1, y: 0 },
      };
      const newDir = map[e.key];
      if (!newDir) return;
      e.preventDefault();
      setDir((d) => {
        if (newDir.x + d.x === 0 && newDir.y + d.y === 0) return d;
        return newDir;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let startX = 0, startY = 0;

    const handleStart = (e: TouchEvent) => {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
    };
    
    const handleEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      
      if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
      
      setDir((d) => {
        if (Math.abs(dx) > Math.abs(dy)) {
          return dx > 0 && d.x !== -1 ? { x: 1, y: 0 } : d.x !== 1 ? { x: -1, y: 0 } : d;
        }
        return dy > 0 && d.y !== -1 ? { x: 0, y: 1 } : d.y !== 1 ? { x: 0, y: -1 } : d;
      });
    };

    canvas.addEventListener("touchstart", handleStart, { passive: true });
    canvas.addEventListener("touchend", handleEnd, { passive: true });
    return () => {
      canvas.removeEventListener("touchstart", handleStart);
      canvas.removeEventListener("touchend", handleEnd);
    };
  }, []);

  const submitOnChain = async () => {
    if (!isConnected || !address) {
      setStatus("⚠️ Please connect your wallet first");
      return;
    }

    if (!walletClient || !publicClient) {
      setStatus("⚠️ Wallet not ready. Please try again.");
      return;
    }

    if (score <= 0) {
      setStatus("⚠️ Play the game first to get a score!");
      return;
    }

    try {
      setStatus("⏳ Preparing transaction...");

      const { request } = await publicClient.simulateContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: contractABI,
        functionName: 'submitScore',
        args: [BigInt(score)],
        account: address,
      });

      setStatus("⏳ Confirm transaction in your wallet...");

      const hash = await walletClient.writeContract(request);
      
      setStatus("⏳ Waiting for confirmation...");

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1 
      });

      if (receipt.status === 'success') {
        setTxHash(hash);
        setStatus("✅ Score submitted successfully on Base!");

        setTimeout(async () => {
          try {
            const data = await publicClient.readContract({
              address: CONTRACT_ADDRESS as `0x${string}`,
              abi: contractABI,
              functionName: 'getMyScore',
              args: [],
              account: address,
            }) as [bigint, bigint];

            setOnChainScore(Number(data[0]));
          } catch (err) {
            console.log("Could not fetch score:", err);
          }
        }, 2000);
      } else {
        setStatus("❌ Transaction failed");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      if (errorMessage.includes("User rejected") || errorMessage.includes("user rejected")) {
        setStatus("❌ Transaction rejected");
      } else if (errorMessage.includes("insufficient funds")) {
        setStatus("❌ Insufficient funds for gas");
      } else if (errorMessage.includes("Cooldown active")) {
        setStatus("❌ Cooldown active. Wait 1 hour between submissions.");
      } else {
        setStatus("❌ Transaction failed. Try again.");
      }
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Game Canvas Container */}
      <div className="relative mx-auto max-w-md">
        <canvas
          ref={canvasRef}
          className="w-full h-auto rounded-xl border-2 border-slate-700 shadow-2xl touch-none"
        />
        
        {/* Overlay */}
        {(paused || gameOver || !running) && (
          <div className="absolute inset-0 bg-black/80 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <div className="text-center p-6">
              {gameOver ? (
                <>
                  <div className="text-6xl mb-4">💀</div>
                  <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
                  <p className="text-4xl text-blue-400 font-bold mb-4">{score}</p>
                  <p className="text-gray-300 text-sm mb-4">
                    {score > highScore ? "🎉 New High Score!" : `Best: ${highScore}`}
                  </p>
                </>
              ) : paused ? (
                <>
                  <div className="text-6xl mb-4">⏸️</div>
                  <h2 className="text-3xl font-bold text-white mb-2">Paused</h2>
                  <p className="text-gray-300 text-sm">Press SPACE or ESC to resume</p>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">🐍</div>
                  <h2 className="text-3xl font-bold text-white mb-2">Ready to Play?</h2>
                  <p className="text-gray-300 text-sm">Tap "Start Game" to begin</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Score Display */}
      <div className="flex gap-3 justify-center mt-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 px-6 py-3 rounded-xl">
          <p className="text-xs text-blue-300 uppercase tracking-wider">Score</p>
          <p className="text-3xl font-bold text-white">{score}</p>
        </div>
        
        {highScore > 0 && (
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 px-6 py-3 rounded-xl">
            <p className="text-xs text-purple-300 uppercase tracking-wider">Best</p>
            <p className="text-3xl font-bold text-white">{highScore}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 mt-6 max-w-md mx-auto">
        <div className="flex gap-3">
          <button
            onClick={resetGame}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-lg transition-all active:scale-95"
          >
            {gameOver ? "🔄 Play Again" : running ? "🔄 Restart" : "🎮 Start Game"}
          </button>

          {running && !gameOver && (
            <button
              onClick={() => setPaused(p => !p)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold shadow-lg transition-all active:scale-95"
            >
              {paused ? "▶️" : "⏸️"}
            </button>
          )}
        </div>

        <button
          onClick={submitOnChain}
          disabled={!isConnected || score === 0}
          className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {!isConnected 
            ? "🔗 Connect Wallet to Submit" 
            : score === 0 
            ? "🎮 Play to Submit Score" 
            : "🚀 Submit Score On-Chain (FREE)"}
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700 max-w-md mx-auto">
        <p className="text-xs text-gray-400 text-center space-y-1">
          <span className="block">🎮 Arrow Keys / WASD to move</span>
          <span className="block">📱 Swipe on mobile</span>
          <span className="block">⏸️ SPACE / ESC to pause</span>
        </p>
      </div>
    </div>
  );
};

export default SnakeGame;