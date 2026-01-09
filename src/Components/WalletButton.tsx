import React from "react";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from "@coinbase/onchainkit/identity";

const WalletButton: React.FC = () => {
  return (
    <Wallet>
      <ConnectWallet className="!bg-gradient-to-r !from-blue-600 !to-blue-700 hover:!from-blue-700 hover:!to-blue-800 !shadow-lg !transition-all">
        <Avatar className="h-6 w-6" />
        <Name className="!font-semibold" />
      </ConnectWallet>
      <WalletDropdown className="!bg-slate-900 !border-slate-700">
        <Identity 
          className="px-4 pt-3 pb-2 !bg-slate-800/50 hover:!bg-slate-800" 
          hasCopyAddressOnClick
        >
          <Avatar />
          <Name className="!text-white" />
          <Address className="!text-gray-400" />
          <EthBalance className="!text-green-400" />
        </Identity>
        <WalletDropdownLink
          icon="wallet"
          href="https://keys.coinbase.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:!bg-slate-800 !text-white"
        >
          Wallet
        </WalletDropdownLink>
        <WalletDropdownDisconnect className="hover:!bg-red-500/10 !text-red-400" />
      </WalletDropdown>
    </Wallet>
  );
};

export default WalletButton;