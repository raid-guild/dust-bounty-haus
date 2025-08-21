

import { encodePlayer } from "@dust/world/internal";
import { useQuery } from "@tanstack/react-query";
import { useDustClient } from "./useDustClient";

export function usePlayerEntityId() {
  const { data: dustClient } = useDustClient();

  return useQuery({
    queryKey: ["player-entity-id", dustClient?.appContext?.userAddress],
    queryFn: () => {
      if (!dustClient?.appContext?.userAddress) return undefined;
      return encodePlayer(dustClient.appContext.userAddress);
    },
  });

}