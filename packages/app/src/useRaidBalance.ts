import { useEffect, useState } from "react";
import { ethers } from "ethers";

// RGTokenSystem contract address and ABI
const RG_TOKEN_SYSTEM_ADDRESS = "0xb607Fc7B1d6D7670b6EBE7D33A708B5416b8347C"; // TODO: Set this to your deployed RGTokenSystem address
const RG_TOKEN_SYSTEM_ABI = [
  "function balanceOf(address account) view returns (uint256)"
];

export function useRaidBalance(_provider: any, userAddress: string | undefined | null) {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Replace with your actual RPC URL
  const RPC_URL = "https://rpc.redstonechain.com"; 
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  useEffect(() => {
    if (!userAddress) {
      setBalance(null);
      return;
    }
    setLoading(true);
    setError(null);
    const contract = new ethers.Contract(RG_TOKEN_SYSTEM_ADDRESS, RG_TOKEN_SYSTEM_ABI, provider);
    contract.balanceOf(userAddress)
      .then((bal: any) => {
        // Format as human-readable decimal (18 decimals)
        const formatted = ethers.formatUnits(bal, 18);
        setBalance(formatted);
      })
      .catch((e: any) => {
        setError(e.message);
        console.error("RAID balance error:", e);
      })
      .finally(() => setLoading(false));
  }, [userAddress]);

  return { balance, loading, error };
}
