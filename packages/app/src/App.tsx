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
  console.log("User address:", userAddress);
  // Always call useRecord to preserve hook order
  const spawnCountKey = { player: userAddress ?? "0x0000000000000000000000000000000000000000" };
  const spawnCountRecord = useRecord({
    stash,
    table: tables.SpawnCount,
    key: spawnCountKey,
  });
  // Debug output
  console.log("spawnCountKey", spawnCountKey);
  console.log("spawnCountRecord", spawnCountRecord);

  // TODO: Implement spawnPlayer logic
  async function handleSpawn() {
    setIsSpawning(true);
    setSpawnError(null);
    try {
      if (!dustClient) throw new Error("Dust client not connected");
      const { error } = await spawnPlayer(dustClient);
      if (error) {
        setSpawnError(error);
      }
    } catch (e: any) {
      setSpawnError(e.message || "Failed to spawn");
      console.error("Spawn error:", e);
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

  // Determine spawn requirements
  const spawnCount = (spawnCountRecord as any)?.value?.count ?? 0;
  const raidBalanceNum = raidBalance ? parseFloat(raidBalance) : 0;
  const needsRaid = spawnCount >= 1;
  const hasEnoughRaid = !needsRaid || raidBalanceNum >= 50;
  const canSpawn = !isSpawning && hasEnoughRaid;
  let spawnDisabledReason = "";
  if (isSpawning) spawnDisabledReason = "Spawning in progress...";
  else if (!hasEnoughRaid && needsRaid) spawnDisabledReason = "You need at least 50 RAID to spawn again.";

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
          {userAddress && spawnCountRecord && ((spawnCountRecord as any).value || (spawnCountRecord as any).value === undefined) && (
            <span className="ml-2">{(spawnCountRecord as any).value?.count ?? 0}</span>
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
      {/* Debug info for spawnCountRecord */}
      <details className="mb-2 w-full max-w-xl">
        <summary className="cursor-pointer text-xs text-gray-500">Debug: spawnCountRecord</summary>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
          {JSON.stringify({ key: spawnCountKey, record: spawnCountRecord }, null, 2)}
        </pre>
      </details>
      <button
        onClick={handleSpawn}
        disabled={!canSpawn}
        title={spawnDisabledReason}
        className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 disabled:opacity-50"
      >
        {isSpawning ? "Spawning..." : "Agree and Spawn"}
      </button>
      {!canSpawn && spawnDisabledReason && (
        <p className="text-red-500 mt-2">{spawnDisabledReason}</p>
      )}
    </div>
  );
}
