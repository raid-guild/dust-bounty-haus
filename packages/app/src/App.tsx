import React from "react";
import { spawnPlayer } from "./spawnPlayer";
import { useDustClient } from "./common/useDustClient";
import { useSyncStatus } from "./mud/useSyncStatus";
import { usePlayerStatus } from "./common/usePlayerStatus";
import { usePlayerPositionQuery } from "./common/usePlayerPositionQuery";
import { AccountName } from "./common/AccountName";
import { useRaidBalance } from "./useRaidBalance";
import { useRecord } from "@latticexyz/stash/react";
import { stash, tables } from "./mud/stash";
// import IWorldAbi from "dustkit/out/IWorld.sol/IWorld.abi";

export default function App() {
  const { data: dustClient } = useDustClient();
  const syncStatus = useSyncStatus();
  const playerStatus = usePlayerStatus();
  const playerPosition = usePlayerPositionQuery();

  // Placeholder for spawn state
  const [isSpawning, setIsSpawning] = React.useState(false);
  const [spawnError, setSpawnError] = React.useState<string | null>(null);


  // RAID balance
  const { balance: raidBalance, loading: raidLoading, error: raidError } = useRaidBalance(
    dustClient?.provider,
    dustClient?.appContext.userAddress
  );

  // Player spawn count from MUD table (only if address is defined)
  const userAddress = dustClient?.appContext.userAddress;
  // Always call useRecord to preserve hook order
  const spawnCountRecord = useRecord({
    stash,
    table: tables.SpawnCount,
    key: { player: userAddress ?? "0x0000000000000000000000000000000000000000" },
  });

  // TODO: Implement spawnPlayer logic
  async function handleSpawn() {
    setIsSpawning(true);
    setSpawnError(null);
    try {
      // TODO: Import the correct ABI for your SpawnSystem and pass as needed
      await spawnPlayer({ dustClient });
    } catch (e: any) {
      setSpawnError(e.message || "Failed to spawn");
    } finally {
      setIsSpawning(false);
    }
  }

  if (!dustClient) {
    const url = `https://alpha.dustproject.org?debug-app=${window.location.origin}/dust-app.json`;
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <a href={url} className="text-center text-blue-500 underline">
          Open this page in DUST to connect to dustkit
        </a>
      </div>
    );
  }

  if (!syncStatus.isLive || !playerStatus) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <p className="text-center">Syncing ({syncStatus.percentage}%)...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <p className="mb-4 text-lg">
        Hello <AccountName address={dustClient.appContext.userAddress} />
      </p>
      <div className="max-w-xl mb-6 p-4 border rounded bg-white/80">
        <div className="mb-2">
          <b>Your RAID Balance:</b>
          {raidLoading && <span className="ml-2 text-gray-500">Loading...</span>}
          {raidError && <span className="ml-2 text-red-500">Error</span>}
          {raidBalance !== null && !raidLoading && !raidError && (
            <span className="ml-2">{raidBalance}</span>
          )}
        </div>
        <div className="mb-2">
          <b>Your Spawn Count:</b>
          {!userAddress && <span className="ml-2 text-gray-500">-</span>}
          {userAddress && spawnCountRecord && (spawnCountRecord as any).error && (
            <span className="ml-2 text-red-500">Error</span>
          )}
          {userAddress && spawnCountRecord && (spawnCountRecord as any).value && (
            <span className="ml-2">{(spawnCountRecord as any).value.count ?? 0}</span>
          )}
          {userAddress && spawnCountRecord && !(spawnCountRecord as any).error && !(spawnCountRecord as any).value && (
            <span className="ml-2 text-gray-500">Loading...</span>
          )}
        </div>
        <h2 className="text-xl font-bold mb-2">Spawn System</h2>
        <ul className="list-disc ml-6 mb-2">
          <li>Each new player gets <b>one free spawn</b>.</li>
          <li>After your free spawn, you must hold <b>50 RAID</b> at token address <code>0xb607Fc7B1d6D7670b6EBE7D33A708B5416b8347C</code> to spawn again.</li>
          <li>Get Raid by energizing the forcefield</li>
          <li>Learn more about the RAID token and the future projects it will power in the Daily Dust</li>
        </ul>
        <p className="text-gray-700">By clicking Agree and Spawn, you will be placed at the spawn tile.</p>
      </div>
      {playerPosition.data && (
        <p className="mb-4">Your position: {JSON.stringify(playerPosition.data, null, " ")}</p>
      )}
      {spawnError && <p className="text-red-500 mb-2">{spawnError}</p>}
      <button
        onClick={handleSpawn}
        disabled={isSpawning}
        className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 disabled:opacity-50"
      >
        {isSpawning ? "Spawning..." : "Agree and Spawn"}
      </button>
    </div>
  );
}
