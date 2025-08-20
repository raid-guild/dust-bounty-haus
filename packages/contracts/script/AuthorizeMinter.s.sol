// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import { Script } from "./Script.sol";
import { RGToken } from "../src/RGToken.sol";

// new token 0xb607Fc7B1d6D7670b6EBE7D33A708B5416b8347C

contract AuthorizeMinter is Script {
  function run() external {
    vm.startBroadcast();
    RGToken(0xb607Fc7B1d6D7670b6EBE7D33A708B5416b8347C).authorizeMinter(0xE88c2Bcbc0DA6bbccba8B3de8da7217F06b6a7D1);
    vm.stopBroadcast();
  }
}