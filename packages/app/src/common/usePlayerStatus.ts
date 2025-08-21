import { useRecord } from "@latticexyz/stash/react";
import { stash, tables } from "../mud/stash";
import { useMemo } from "react";
import { bigIntMax } from "@latticexyz/common/utils";
import { usePlayerEntityId } from "./usePlayerEntityId";

export function usePlayerStatus(): "alive" | "dead" {
  const { data: playerEntityId } = usePlayerEntityId();
  console.log("Player Entity ID:", playerEntityId);
  console.log("table:", tables.Energy); 
  const energy = useRecord({
    stash,
    table: tables.Energy,
    key: { entityId: playerEntityId ?? "0x" },
  });

  console.log("Player Energy:", energy);  

  const optimisticEnergy = useMemo(() => {
    if (!energy) return undefined;
    const currentTime = BigInt(Date.now());
    const lastUpdatedTime = energy.lastUpdatedTime * 1000n;
    const elapsed = (currentTime - lastUpdatedTime) / 1000n;
    const energyDrained = elapsed * energy.drainRate;
    return bigIntMax(0n, energy.energy - energyDrained);
  }, [energy]);

  return optimisticEnergy ? "alive" : "dead";
}
