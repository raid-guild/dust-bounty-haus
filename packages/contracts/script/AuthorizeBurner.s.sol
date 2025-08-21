// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import { Script } from "./Script.sol";
import { RGToken } from "../src/RGToken.sol";

// new token 0xb607Fc7B1d6D7670b6EBE7D33A708B5416b8347C

contract AuthorizeMinter is Script {
  function run() external {
    vm.startBroadcast();
    RGToken(0xb607Fc7B1d6D7670b6EBE7D33A708B5416b8347C).authorizeBurner(0xE3672FCc5fC960Db60C9e7B0cDCdEFd113270E25);
    vm.stopBroadcast();
  }
}