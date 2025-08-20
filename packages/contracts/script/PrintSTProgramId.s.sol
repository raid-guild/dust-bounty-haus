// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

import { Script } from "./Script.sol";
import { console } from "forge-std/console.sol";
import { WorldResourceIdLib, ResourceId } from "@latticexyz/world/src/WorldResourceId.sol";
import { RESOURCE_SYSTEM } from "@latticexyz/world/src/worldResourceTypes.sol";
import { defaultProgramSystem } from "@dust/programs/src/codegen/systems/DefaultProgramSystemLib.sol";
import { EntityId } from "@dust/world/src/types/EntityId.sol";

// Entity: 0x030000051b0000009afffffc6200000000000000000000000000000000000000
// Default Program: 0x7379646670726f6772616d735f310000537061776e54696c6550726f6772616d


contract PrintSTProgramId is Script {
  function run() external view {
    bytes14 namespace = "rgtmpff1"; // your deployed namespace
    bytes16 systemName = "BHSpawnTileProgr"; // your deployed system name
    ResourceId programId = WorldResourceIdLib.encode({
      typeId: RESOURCE_SYSTEM,
      namespace: namespace,
      name: systemName
    });
    console.log("Program ID for BHSpawnTileProgram:");
    console.logBytes32(bytes32(namespace));
    console.logBytes32(bytes32(systemName));
    console.log("Program ID (ResourceId):");
    console.logBytes32(ResourceId.unwrap(programId));
    (uint256 groupId, bool locked)  = defaultProgramSystem.getAccessGroupId(EntityId.wrap(0x030000051b0000009afffffc6200000000000000000000000000000000000000));
    console.log("Access Group ID:", groupId);
    console.log("Is Access Group Locked:", locked);
  }
}
