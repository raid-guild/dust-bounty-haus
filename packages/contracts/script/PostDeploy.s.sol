import { AdminSystem } from "../src/AdminSystem.sol";
import { ObjectType } from "@dust/world/src/types/ObjectType.sol";
// ObjectType values
ObjectType constant WOODEN_AXE = ObjectType.wrap(32774);
ObjectType constant COPPER_AXE = ObjectType.wrap(32775);
ObjectType constant WHEAT_SLOP = ObjectType.wrap(32790);

// Default prices
uint256 constant WOODEN_AXE_PRICE = 50000000000000000000; // 50 RAID
uint256 constant COPPER_AXE_PRICE = 200000000000000000000; // 200 RAID
uint256 constant WHEAT_SLOP_PRICE = 150000000000000000000; // 150 RAID
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { console } from "forge-std/console.sol";

import { Script } from "./Script.sol";
import { Systems } from "@latticexyz/world/src/codegen/tables/Systems.sol";

import { Admin } from "../src/codegen/tables/Admin.sol";
import { adminSystem } from "../src/codegen/systems/AdminSystemLib.sol";
import { forceFieldMintProgram } from "../src/codegen/systems/ForceFieldMintProgramLib.sol";
import { ItemPrice } from "../src/codegen/tables/ItemPrice.sol";

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

        // Set default item prices using AdminSystem
    console.log("Setting item prices");
    adminSystem.setItemPrice(WOODEN_AXE, WOODEN_AXE_PRICE);
    adminSystem.setItemPrice(COPPER_AXE, COPPER_AXE_PRICE);
    adminSystem.setItemPrice(WHEAT_SLOP, WHEAT_SLOP_PRICE);

    uint256 price = ItemPrice.get(WOODEN_AXE);
    console.log("WOODEN_AXE price:", price);

    // (address programAddress, ) = Systems.get(forceFieldMintProgram.toResourceId());
    // (bool success, ) = programAddress.call(abi.encodeWithSignature("setAccessGroup()"));
    // require(success, "setAccessGroup() failed");


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
