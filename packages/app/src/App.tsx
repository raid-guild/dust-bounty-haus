import React from "react";
// Helper to truncate addresses
function truncateAddress(addr: string, start = 6, end = 4) {
  if (!addr) return "";
  return addr.slice(0, start) + "..." + addr.slice(-end);
}

// RAID token info
const RAID_TOKEN_ADDRESS = "0xb607Fc7B1d6D7670b6EBE7D33A708B5416b8347C";
const RAID_TOKEN_SYMBOL = "RAID";
const RAID_TOKEN_DECIMALS = 18;
const RAID_TOKEN_IMAGE = 'https://charactersheets.mypinata.cloud/ipfs/QmUoW3bZ7QcJXaDPySdV32TEUWojd5eir6b2eUkrvEfKy4';
import { spawnPlayer } from "./spawnPlayer";
import { useDustClient } from "./common/useDustClient";
import { useSyncStatus } from "./mud/useSyncStatus";
import { usePlayerStatus } from "./common/usePlayerStatus";
import { AccountName } from "./common/AccountName";
import { useRaidBalance } from "./useRaidBalance";
import { useRecord } from "@latticexyz/stash/react";
import { stash, tables } from "./mud/stash";

// Item ObjectType values and display names (from contracts):
const ITEMS = [
  { name: "Wooden Axe", objectType: 32774 },
  { name: "Copper Axe", objectType: 32775 },
  { name: "Wheat Slop", objectType: 32790 },
];

export default function App() {
  // Dialog for setWaypoint feedback
  const [waypointDialog, setWaypointDialog] = React.useState<{ open: boolean; message: string; error?: boolean }>({ open: false, message: "", error: false });
  // Tab state
  const [activeTab, setActiveTab] = React.useState<'main' | 'items' | 'waypoints'>('main');

  // Waypoints data
  const WAYPOINTS: { label: string; coords: [number, number, number] }[] = [
    { label: 'Floating Castle (Force Field)', coords: [1304, 154, -925] },
    { label: 'Axe Shop', coords: [1324, 154, -926] },
    { label: 'Guild Games', coords: [1305, 154, -908] },
    { label: 'Forest Maze', coords: [1301, 149, -953] },
    { label: 'Guild Hall', coords: [1279, 155, -929] },
    { label: 'Moloch Monument', coords: [1258, 153, -945] },
    { label: 'Member Totems', coords: [1238, 151, -934] },
    { label: 'Obby Towners', coords: [1246, 151, -916] },
    { label: 'Farm Village', coords: [1046, 62, -932] },
    { label: 'Daily Dust Tree', coords: [1033, 70, -917] },
    { label: 'Visiting Giant Sea Turtle', coords: [1019, 66, -903] },
  ];

  const { data: dustClient } = useDustClient();
  const syncStatus = useSyncStatus();
  const playerStatus = usePlayerStatus();

  // Placeholder for spawn state
  const [isSpawning, setIsSpawning] = React.useState(false);
  const [spawnError, setSpawnError] = React.useState<string | null>(null);
  const [showSpawnSuccess, setShowSpawnSuccess] = React.useState(false);

  // RAID balance
  const { balance: raidBalance, loading: raidLoading, error: raidError, refetch: refetchRaidBalance } = useRaidBalance(
    dustClient?.provider,
    dustClient?.appContext.userAddress
  );

  const userAddress = dustClient?.appContext.userAddress;
  const spawnCountKey = { player: userAddress ?? "0x0000000000000000000000000000000000000000" };
  const spawnCountRecord = useRecord({ stash, table: tables.SpawnCount, key: spawnCountKey });

  const itemPurchaseRecords = ITEMS.map(item => useRecord({ stash, table: tables.ChestPurchases, key: { player: userAddress ?? "0x0000000000000000000000000000000000000000", item: item.objectType } }));
  const itemPriceRecords = ITEMS.map(item => useRecord({ stash, table: tables.ItemPrice, key: { item: item.objectType } }));

  async function handleSpawn() {
    setIsSpawning(true);
    setSpawnError(null);
    try {
      if (!dustClient) throw new Error("Dust client not connected");
      const { error } = await spawnPlayer(dustClient);
      if (error) setSpawnError(error);
      else setShowSpawnSuccess(true);
    } catch (e: any) {
      setSpawnError(e.message || "Failed to spawn");
    } finally {
      setIsSpawning(false);
    }
  }

  async function handleSetWaypoint(label: string, coords: [number, number, number]) {
    if (!dustClient) return;
    try {
      const { encodeBlock } = await import("@dust/world/internal");
      const entityId = encodeBlock(coords);
      await dustClient.provider.request({ method: "setWaypoint", params: { entity: entityId, label: `${label} (${coords.join(', ')})` } });
      setWaypointDialog({ open: true, message: `Waypoint set to ${label} at (${coords.join(', ')})`, error: false });
    } catch (err: any) {
      setWaypointDialog({ open: true, message: `Failed to set waypoint: ${err?.message ?? err}`, error: true });
    }
  }

  if (!dustClient) {
    const url = `https://alpha.dustproject.org?debug-app=${window.location.origin}/dust-app.json`;
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <a href={url} className="text-center text-blue-500 underline">Open this page in DUST to connect to dustkit</a>
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

  const spawnCount = (spawnCountRecord as any)?.count ?? 0;
  const raidBalanceNum = raidBalance ? parseFloat(raidBalance) : 0;
  const needsRaid = spawnCount >= 1;
  const hasEnoughRaid = !needsRaid || raidBalanceNum >= 50;
  const isPlayerDead = playerStatus === "dead";
  const canSpawn = !isSpawning && hasEnoughRaid && isPlayerDead;
  let spawnDisabledReason = "";
  if (!isPlayerDead) spawnDisabledReason = "You can only spawn if your player is dead.";
  else if (isSpawning) spawnDisabledReason = "Spawning in progress...";
  else if (!hasEnoughRaid && needsRaid) spawnDisabledReason = "You need at least 50 RAID to spawn again.";

  // Colors
  const RG_RED = "#e11d48";
  const RG_DARK = "#18141a";
  const RG_CARD = "#23202a";
  const RG_TEXT = "#f3f3f3";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-2" style={{ background: RG_DARK }}>
      {/* Modals */}
      {showSpawnSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60">
          <div className="flex flex-col items-center bg-white rounded-lg shadow-lg p-8" style={{ minWidth: 320, background: RG_CARD, border: `2px solid ${RG_RED}` }}>
            <div className="mb-4 flex flex-col items-center">
              <img src="/rglogo.png" alt="Raid Guild" style={{ width: 48, height: 48 }} />
              <h2 className="text-2xl font-bold mt-2" style={{ color: RG_RED }}>Spawn Successful!</h2>
            </div>
            <p className="mb-4 text-center" style={{ color: RG_TEXT }}>You have successfully spawned your player. Good luck on your adventure!</p>
            <button className="px-6 py-2 rounded shadow font-bold" style={{ background: RG_RED, color: RG_TEXT }} onClick={() => setShowSpawnSuccess(false)}>Close</button>
          </div>
        </div>
      )}

      {waypointDialog.open && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60">
          <div className="flex flex-col items-center bg-white rounded-lg shadow-lg p-8" style={{ minWidth: 320, background: RG_CARD, border: `2px solid ${waypointDialog.error ? RG_RED : '#22c55e'}` }}>
            <div className="mb-4 flex flex-col items-center">
              <img src="/rglogo.png" alt="Raid Guild" style={{ width: 48, height: 48, filter: waypointDialog.error ? 'grayscale(1)' : undefined }} />
              <h2 className="text-2xl font-bold mt-2" style={{ color: waypointDialog.error ? RG_RED : '#22c55e' }}>{waypointDialog.error ? 'Error' : 'Waypoint Set!'}</h2>
            </div>
            <p className="mb-4 text-center" style={{ color: RG_TEXT }}>{waypointDialog.message}</p>
            <button className="px-6 py-2 rounded shadow font-bold" style={{ background: waypointDialog.error ? RG_RED : '#22c55e', color: RG_TEXT }} onClick={() => setWaypointDialog({ ...waypointDialog, open: false })}>Close</button>
          </div>
        </div>
      )}

      {/* Card */}
      <div className="flex flex-col items-center border rounded shadow-lg" style={{ width: 360, height: 580, maxWidth: '100vw', maxHeight: '100vh', padding: 28, background: RG_CARD, borderColor: RG_RED }}>
        {/* Tabs */}
        <div className="flex w-full mb-4">
          <button className={`flex-1 py-2 rounded-tl rounded-bl font-bold ${activeTab === 'main' ? '' : 'opacity-60'}`} style={{ background: activeTab === 'main' ? RG_RED : RG_CARD, color: RG_TEXT, border: `1px solid ${RG_RED}` }} onClick={() => setActiveTab('main')}>Main</button>
          <button className={`flex-1 py-2 rounded-tr rounded-br font-bold ${activeTab === 'items' ? '' : 'opacity-60'}`} style={{ background: activeTab === 'items' ? RG_RED : RG_CARD, color: RG_TEXT, border: `1px solid ${RG_RED}` }} onClick={() => setActiveTab('items')}>Shop Items</button>
          <button className={`flex-1 py-2 font-bold ${activeTab === 'waypoints' ? '' : 'opacity-60'}`} style={{ background: activeTab === 'waypoints' ? RG_RED : RG_CARD, color: RG_TEXT, border: `1px solid ${RG_RED}` }} onClick={() => setActiveTab('waypoints')}>Tour</button>
        </div>

        {/* Main Tab */}
        {activeTab === 'main' && (
          <>
            <div className="flex items-center justify-center w-full mb-4 gap-2">
              <img src="/rglogo.png" alt="Raid Guild" style={{ width: 32, height: 32 }} />
              <span className="text-xl font-bold tracking-tight" style={{ color: RG_RED }}>Raid Guild</span>
            </div>
            <p className="mb-2 text-lg font-semibold truncate w-full text-center" style={{ color: RG_TEXT }}>Hello <AccountName address={dustClient.appContext.userAddress} /></p>

            <div className="mb-1 w-full flex items-center justify-between">
              <b style={{ color: RG_TEXT }}>Your RAID Balance:</b>
              <span className="flex items-center gap-1">
                {raidLoading && <span className="text-gray-400">Loading...</span>}
                {raidError && <span className="text-red-400">Error</span>}
                {raidBalance !== null && !raidLoading && !raidError && <span style={{ color: RG_TEXT }}>{raidBalance}</span>}
                <button onClick={refetchRaidBalance} title="Refresh balance" style={{ marginLeft: 6, background: 'none', border: 'none', cursor: 'pointer', color: RG_RED, fontSize: 16, padding: 0 }} disabled={raidLoading} aria-label="Refresh RAID balance">&#x21bb;</button>
              </span>
            </div>

            <div className="mb-1 w-full flex items-center justify-between">
              <b style={{ color: RG_TEXT }}>Your Spawn Count:</b>
              <span>{!userAddress && <span className="text-gray-400">-</span>}{userAddress && spawnCountRecord && (spawnCountRecord as any).error && <span className="text-red-400">Error</span>}{userAddress && spawnCountRecord && <span style={{ color: RG_TEXT }}>{(spawnCountRecord as any).count ?? 0}</span>}</span>
            </div>

            <div className="mb-3 w-full flex items-center justify-between">
              <b style={{ color: RG_TEXT }}>RAID Token:</b>
              <span className="flex items-center gap-2">
                <code className="text-xs px-1 rounded" style={{ background: RG_DARK, color: RG_TEXT }}>{truncateAddress(RAID_TOKEN_ADDRESS)}</code>
                <button className="text-xs underline hover:opacity-80" style={{ padding: '2px 6px', color: RG_RED, fontWeight: 600 }} onClick={async () => {
                  if ((window as any).ethereum) {
                    try {
                      await (window as any).ethereum.request({ method: 'wallet_watchAsset', params: { type: 'ERC20', options: { address: RAID_TOKEN_ADDRESS, symbol: RAID_TOKEN_SYMBOL, decimals: RAID_TOKEN_DECIMALS, image: RAID_TOKEN_IMAGE } } });
                    } catch (err: any) { alert('MetaMask error: ' + (err?.message ?? err)); }
                  } else { alert('MetaMask not detected'); }
                }}>Add to MetaMask</button>
              </span>
            </div>

            <h2 className="text-lg font-bold mb-2 w-full text-center" style={{ color: RG_RED }}>Spawn System</h2>
            <ul className="list-disc ml-4 mb-2 text-sm w-full" style={{ color: RG_TEXT }}>
              <li><b>One free spawn</b>.</li>
              <li>After your free spawn, you must hold <b>50 RAID</b> to spawn again.</li>
              <li>Get Raid by energizing the <a href="#" style={{ color: RG_RED, textDecoration: 'underline' }} onClick={async (e) => { e.preventDefault(); if (!dustClient) return; try { const { encodeBlock } = await import('@dust/world/internal'); const entityId = encodeBlock([1304, 154, -925]); await dustClient.provider.request({ method: 'setWaypoint', params: { entity: entityId, label: 'forcefield (1304,154,-925)' } }); setWaypointDialog({ open: true, message: 'Waypoint set to forcefield at (1304, 154, -925)', error: false }); } catch (err: any) { setWaypointDialog({ open: true, message: 'Failed to set waypoint: ' + (err?.message ?? err), error: true }); } }}>forcefield</a></li>
            </ul>

            {spawnError && <p className="mb-1 text-xs w-full text-center" style={{ color: RG_RED }}>{spawnError}</p>}
            <button onClick={handleSpawn} disabled={!canSpawn} title={spawnDisabledReason} className="px-6 py-2 rounded shadow w-full mt-auto font-bold" style={{ minHeight: 40, background: RG_RED, color: RG_TEXT }}> {isSpawning ? 'Spawning...' : 'Spawn'}</button>
            {!canSpawn && spawnDisabledReason && <p className="mt-2 text-xs w-full text-center" style={{ color: RG_RED }}>{spawnDisabledReason}</p>}
          </>
        )}

        {/* Items Tab */}
        {activeTab === 'items' && (
          <div className="w-full">
            <h2 className="text-lg font-bold mb-2 w-full text-center" style={{ color: RG_RED }}>Items Purchased</h2>
            <table className="w-full text-sm mb-2" style={{ color: RG_TEXT }}>
              <thead>
                <tr><th className="text-left pb-1">Item</th><th className="text-right pb-1">Cost (RAID)</th><th className="text-right pb-1">Purchased</th></tr>
              </thead>
              <tbody>
                {ITEMS.map((item, i) => (
                  <tr key={item.objectType}><td>{item.name}</td><td className="text-right">{itemPriceRecords[i] && (itemPriceRecords[i] as any).error && <span className="text-red-400">Error</span>}{itemPriceRecords[i] && (itemPriceRecords[i] as any).price !== undefined && <span style={{ color: RG_TEXT }}>{(parseFloat((itemPriceRecords[i] as any).price) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>}{itemPriceRecords[i] && (itemPriceRecords[i] as any).price === undefined && !(itemPriceRecords[i] as any).error && <span className="text-gray-400">-</span>}</td><td className="text-right">{!userAddress && <span className="text-gray-400">-</span>}{userAddress && itemPurchaseRecords[i] && (itemPurchaseRecords[i] as any).error && <span className="text-red-400">Error</span>}{userAddress && itemPurchaseRecords[i] && <span style={{ color: RG_TEXT }}>{(itemPurchaseRecords[i] as any).count ?? 0}</span>}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Waypoints Tab */}
        {activeTab === 'waypoints' && (
          <div className="w-full">
            {/* Background image container with muted overlay */}
            <div className="w-full relative mb-2" style={{ borderRadius: 6, overflow: 'hidden' }}>
              {/* Background image (muted) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: "url('/rghqmap.png')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'grayscale(1) contrast(0.9) blur(0.5px)',
                  opacity: 0.45,
                }}
              />
              {/* Dark overlay to ensure readability */}
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)' }} />
              {/* Foreground content */}
              <div style={{ position: 'relative', zIndex: 1, padding: 10 }}>
                <h2 className="text-lg font-bold mb-2 w-full text-center" style={{ color: RG_RED }}>Camp Waypoints</h2>
                <ul className="mb-2">
                  {WAYPOINTS.map((wp) => (
                    <li key={wp.label} className="flex items-center justify-between mb-2 text-sm">
                      <span style={{ color: RG_TEXT }}>{wp.label}</span>
                      <button className="ml-2 px-2 py-1 rounded text-xs font-bold" style={{ background: RG_RED, color: RG_TEXT, border: `1px solid ${RG_RED}` }} onClick={() => handleSetWaypoint(wp.label, wp.coords)}>
                        Set Waypoint
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-center" style={{ color: RG_TEXT }}>Tap a button to set your in-game waypoint to a key location in the Raid Guild Camp.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
