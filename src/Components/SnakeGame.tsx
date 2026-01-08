import React, { useEffect, useRef, useState, useCallback } from "react";
import { ethers } from "ethers";
import contractABI from "../SnakeOnChainABI.json";

const CONTRACT_ADDRESS = "0xcC8E9a9CeBF3b3a6dd21BD79A7756E3d5f4C9061";

type Point = { x: number; y: number };
type Direction = { x: number; y: number };

interface SnakeGameProps {
  setOnChainScore: React.Dispatch<React.SetStateAction<number | null>>;
  setTxHash: React.Dispatch<React.SetStateAction<string | null>>;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

const SnakeGame: React.FC<SnakeGameProps> = ({
  setOnChainScore,
  setTxHash,
  setStatus,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [moveDelay, setMoveDelay] = useState(150);
  const [snake, setSnake] = useState<Point[]>([]);
  const [dir, setDir] = useState<Direction>({ x: 1, y: 0 });
  const [food, setFood] = useState<Point | null>(null);
  const [paused, setPaused] = useState(false);
  
  const cellSize = 20;
  const cols = 25;
  const rows = 25;

  const spawnFood = useCallback((snakeArr: Point[]): Point => {
    const occupied = new Set(snakeArr.map((p) => `${p.x},${p.y}`));
    for (let i = 0; i < 500; i++) {
      const x = Math.floor(Math.random() * cols);
      const y = Math.floor(Math.random() * rows);
      if (!occupied.has(`${x},${y}`)) return { x, y };
    }
    return { x: 0, y: 0 };
  }, [cols, rows]);

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
    setTxHash(null);
    setStatus("");
  }, [cols, rows, spawnFood, setTxHash, setStatus]);

  const updateSnake = useCallback(() => {
    if (!running || paused || snake.length === 0) return;
    
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    head.x = (head.x + cols) % cols;
    head.y = (head.y + rows) % rows;

    if (snake.some((s) => s.x === head.x && s.y === head.y)) {
      setRunning(false);
      setGameOver(true);
      setStatus("💀 Game Over! Submit your score on-chain!");
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
  }, [running, paused, snake, dir, food, cols, rows, spawnFood, setStatus]);

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

    // Background with grid
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
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

    // Draw food with glow
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

    // Draw snake with glow
    snake.forEach((s, i) => {
      ctx.shadowBlur = i === 0 ? 20 : 10;
      ctx.shadowColor = i === 0 ? "#60a5fa" : "#3b82f6";
      ctx.fillStyle = i === 0 ? "#60a5fa" : "#3b82f6";
      ctx.fillRect(
        s.x * cellSize + 1,
        s.y * cellSize + 1,
        cellSize - 2,
        cellSize - 2
      );
    });
    ctx.shadowBlur = 0;
  }, [snake, food, cols, rows, cellSize]);

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

    canvas.addEventListener("touchstart", handleStart);
    canvas.addEventListener("touchend", handleEnd);
    return () => {
      canvas.removeEventListener("touchstart", handleStart);
      canvas.removeEventListener("touchend", handleEnd);
    };
  }, []);

  const submitOnChain = async () => {
    let localTxHash = "";
    
    try {
      if (!window.ethereum) {
        setStatus("⚠️ No wallet found. Please install MetaMask or Coinbase Wallet.");
        return;
      }

      if (score <= 0) {
        setStatus("⚠️ Play first before submitting!");
        return;
      }

      setStatus("⏳ Preparing transaction...");

      await window.ethereum.request({ method: "eth_requestAccounts" });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

      setStatus("⏳ Sending transaction...");

      const tx = await contract.submitScore(score, {
        gasLimit: 200000,
      });

      localTxHash = tx.hash;
      console.log("📤 Transaction sent:", localTxHash);
      
      setStatus("⏳ Waiting for confirmation...");

      const receipt = await tx.wait();

      console.log("📥 Transaction receipt:", receipt);

      if (receipt && receipt.status === 1) {
        console.log("✅ Transaction SUCCESS!");
        setTxHash(localTxHash);
        setStatus("✅ Score submitted successfully!");

        try {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const [highScore] = await contract.getMyScore();
          setOnChainScore(Number(highScore));
          console.log("📊 Updated high score:", Number(highScore));
        } catch (scoreErr) {
          console.log("Could not fetch score:", scoreErr);
        }
      } else {
        setStatus("❌ Transaction failed");
      }
    } catch (err: any) {
      console.error("❌ Transaction error:", err);

      if (localTxHash) {
        setTxHash(localTxHash);
        setStatus("✅ Transaction submitted! Verifying...");
        
        setTimeout(async () => {
          try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const receipt = await provider.getTransactionReceipt(localTxHash);
            if (receipt && receipt.status === 1) {
              setStatus("✅ Score submitted successfully!");
            } else if (receipt && receipt.status === 0) {
              setStatus("❌ Transaction failed");
            }
          } catch (e) {
            console.log("Could not verify:", e);
          }
        }, 5000);
        return;
      }

      const errorMessage = err?.message || String(err);
      
      if (err?.code === 4001 || errorMessage.includes("user rejected")) {
        setStatus("❌ Transaction rejected");
      } else if (errorMessage.includes("insufficient funds")) {
        setStatus("❌ Insufficient funds for gas");
      } else {
        setStatus("❌ Transaction failed. Try again.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-2xl">
      {/* Game Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="rounded-xl border-4 border-slate-700 shadow-2xl touch-none"
        />
        
        {/* Overlay for Pause/Game Over */}
        {(paused || gameOver) && (
          <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <div className="text-center p-6">
              <h2 className="text-4xl font-bold text-white mb-4">
                {gameOver ? "🎮 Game Over!" : "⏸️ Paused"}
              </h2>
              <p className="text-2xl text-blue-400 font-bold mb-4">
                Score: {score}
              </p>
              {!gameOver && (
                <p className="text-gray-300 text-sm">Press SPACE or ESC to resume</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Score Display */}
      <div className="flex items-center gap-6 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 rounded-xl shadow-lg">
          <p className="text-xs text-blue-200 uppercase tracking-wide">Score</p>
          <p className="text-3xl font-bold text-white">{score}</p>
        </div>
        
        {gameOver && (
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 rounded-xl shadow-lg animate-pulse">
            <p className="text-xs text-red-200 uppercase tracking-wide">Game Over</p>
            <p className="text-xl font-bold text-white">Submit On-Chain!</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={resetGame}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-lg transition-all transform hover:scale-105"
        >
          {gameOver ? "🔄 Play Again" : "🎮 New Game"}
        </button>

        {running && !gameOver && (
          <button
            onClick={() => setPaused(p => !p)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold shadow-lg transition-all transform hover:scale-105"
          >
            {paused ? "▶️ Resume" : "⏸️ Pause"}
          </button>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={submitOnChain}
        disabled={score === 0}
        className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {score === 0 ? "🎮 Play to Submit Score" : "🚀 Submit Score On-Chain (FREE)"}
      </button>

      {/* Instructions */}
      <div className="text-xs text-gray-400 text-center space-y-1 max-w-md">
        <p>🎮 Use Arrow Keys or WASD to move</p>
        <p>📱 Swipe on mobile</p>
        <p>⏸️ Press SPACE or ESC to pause</p>
      </div>
    </div>
  );
};

export default SnakeGame;