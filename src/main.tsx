import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import '@coinbase/onchainkit/styles.css';
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { base } from "wagmi/chains";
import { wagmiConfig } from "./wagmi";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <OnchainKitProvider
        apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY}
        chain={base}
      >
        <App />
      </OnchainKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);