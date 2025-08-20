// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { console } from "forge-std/console.sol";

import { Script } from "./Script.sol";
import { Systems } from "@latticexyz/world/src/codegen/tables/Systems.sol";

import { Admin } from "../src/codegen/tables/Admin.sol";
import { forceFieldMintProgram } from "../src/codegen/systems/ForceFieldMintProgramLib.sol";

address constant ADMIN1 = 0xCED608Aa29bB92185D9b6340Adcbfa263DAe075b;
address constant ADMIN2 = 0x34bfCd82f1E3Dac79c6b3D033ab871EE4f6AAECa;

contract PostDeploy is Script {
  function run(address worldAddress) external {
    StoreSwitch.setStoreAddress(worldAddress);
    address sender = startBroadcast();


    console.log("Setting admin", sender);
    Admin.set(sender, true);
    console.log("Setting admin", ADMIN1);
    Admin.set(ADMIN1, true);
    console.log("Setting admin", ADMIN2);
    Admin.set(ADMIN2, true);

    (address programAddress, ) = Systems.get(forceFieldMintProgram.toResourceId());
    (bool success, ) = programAddress.call(abi.encodeWithSignature("setAccessGroup()"));
    require(success, "setAccessGroup() failed");



    vm.stopBroadcast();

    if (block.chainid == 31337) {
      console.log("Setting local world address to:", worldAddress);
      _setLocalWorldAddress(worldAddress);
    }
  }

  // Set the world address by directly writing to storage for local setup
  function _setLocalWorldAddress(address worldAddress) internal {
    bytes32 worldSlot = keccak256("mud.store.storage.StoreSwitch");
    bytes32 worldAddressBytes32 = bytes32(uint256(uint160(worldAddress)));
    vm.store(forceFieldMintProgram.getAddress(), worldSlot, worldAddressBytes32);
  }
}
