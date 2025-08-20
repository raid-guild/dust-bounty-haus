// This script uses ethers.js to fetch all Transfer events from the old RGToken contract and reconstructs the balances of all holders.
// Save this as scripts/getOldTokenBalances.ts and run with: npx tsx scripts/getOldTokenBalances.ts

import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const OLD_TOKEN_ADDRESS = "0x0ff91dF57d264C1B7213437C9fd51b67113cF881";
const RPC_URL = process.env.ETH_RPC_URL!;

const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function decimals() view returns (uint8)",
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(OLD_TOKEN_ADDRESS, ERC20_ABI, provider);

  // Get decimals for pretty printing
  const decimals = await contract.decimals();

  // Get all Transfer events
  const filter = contract.filters.Transfer();
  const events = await contract.queryFilter(filter, 0, "latest");

  const balances: Record<string, bigint> = {};

  for (const event of events) {
    if ("args" in event && event.args) {
      const { from, to, value } = event.args;
      if (from !== ethers.ZeroAddress) {
        balances[from] = (balances[from] || 0n) - value;
      }
      if (to !== ethers.ZeroAddress) {
        balances[to] = (balances[to] || 0n) + value;
      }
    }
  }

  // Print all nonzero balances
  console.log("Address,Balance");
  for (const [address, balance] of Object.entries(balances)) {
    if (balance > 0n) {
      console.log(`${address},${ethers.formatUnits(balance, decimals)}`);
    }
  }
}

main().catch(console.error);
