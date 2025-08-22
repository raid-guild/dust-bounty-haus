import { useRecord } from "@latticexyz/stash/react";
import { stash, tables } from "../mud/stash";
import { useMemo } from "react";
import { bigIntMax } from "@latticexyz/common/utils";
import { usePlayerEntityId } from "./usePlayerEntityId";

export function usePlayerStatus(): "alive" | "dead" {
  const { data: playerEntityId } = usePlayerEntityId();
  const energy = useRecord({
    stash,
    table: tables.Energy,
    key: { entityId: playerEntityId ?? "0x" },
  });
  
  const optimisticEnergy = useMemo(() => {
    if (!energy) return undefined;
    const toBigInt = (v: unknown): bigint => {
      if (typeof v === "bigint") return v;
      if (typeof v === "number") return BigInt(Math.floor(v));
      if (typeof v === "string") {
        const s = v.trim();
        if (/^-?\d+$/.test(s)) return BigInt(s);
        const n = Number(s);
        return Number.isFinite(n) ? BigInt(Math.floor(n)) : 0n;
      }
      return 0n;
    };

    const currentTime = BigInt(Date.now());
    const lastUpdatedTime = toBigInt(energy.lastUpdatedTime) * 1000n;
    const elapsed = (currentTime - lastUpdatedTime) / 1000n;
    const energyDrained = elapsed * toBigInt(energy.drainRate ?? 0n);
    return bigIntMax(0n, toBigInt(energy.energy ?? 0n) - energyDrained);
  }, [energy]);

  return optimisticEnergy && optimisticEnergy > 0n ? "alive" : "dead";
}
