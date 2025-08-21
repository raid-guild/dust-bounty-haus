// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

import { Script } from "./Script.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { adminSystem } from "../src/codegen/systems/AdminSystemLib.sol";
import { ObjectType } from "@dust/world/src/types/ObjectType.sol";

// example
// forge script script/SetItemPrices.s.sol:SetItemPrices --rpc-url $ETH_RPC_URL 
// --private-key $PRIVATE_KEY --broadcast --sig "run(uint16,uint256)" 32774 20000000000000000000

// woden axe 32774
// copper axe 32775
// wheat slop 32790

contract SetItemPrices is Script {
  // Hardcoded world address
  address constant WORLD_ADDRESS = 0x253eb85B3C953bFE3827CC14a151262482E7189C;

  function run(uint16 objectType, uint256 price) external {
    StoreSwitch.setStoreAddress(WORLD_ADDRESS);
    startBroadcast();
    adminSystem.setItemPrice(ObjectType.wrap(objectType), price);
    vm.stopBroadcast();
  }
}
