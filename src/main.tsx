import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Wagmi v2 setup (Base only)
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create Wagmi config with Base only
const config = createConfig({
  chains: [base],
  connectors: [
    injected(), // MetaMask, Coinbase Wallet, etc.
  ],
  transports: {
    [base.id]: http(),
  },
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </WagmiProvider>
);