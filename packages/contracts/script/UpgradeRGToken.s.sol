// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import { RGToken } from "../src/RGToken.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

interface IProxy {
    function upgradeTo(address newImplementation) external;
}

contract UpgradeRGTokenScript is Script {
    // Set these before running the script
    address public proxyAddress = address(0xb607Fc7B1d6D7670b6EBE7D33A708B5416b8347C);
    

    function run() external {
        vm.startBroadcast();
        console.log("Using address:", tx.origin);

        // 1. Deploy new implementation
        RGToken newImplementation = new RGToken();

        // 2. Upgrade proxy to new implementation
        IProxy(proxyAddress).upgradeTo(address(newImplementation));

        vm.stopBroadcast();
    }
}