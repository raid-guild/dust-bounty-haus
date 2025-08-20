// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";


interface IOwnable {
    function owner() external view returns (address);
}

interface IUUPS {
    function proxiableUUID() external view returns (bytes32);
}

contract CheckRGTokenOwner is Script {
    // Set your proxy address here
    address public proxyAddress = address(0xb607Fc7B1d6D7670b6EBE7D33A708B5416b8347C);

    function run() external view {
        address owner = IOwnable(proxyAddress).owner();
        console.log("RGToken proxy owner:", owner, tx.origin);

        // Try to call proxiableUUID
        try IUUPS(proxyAddress).proxiableUUID() returns (bytes32 slot) {
            console.log("proxiableUUID supported. Slot:", uint256(slot));
        } catch {
            console.log("proxiableUUID not supported: this is NOT a UUPS proxy");
        }

        // Check EIP-1967 admin slot
        bytes32 adminSlot = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;
        address admin;
        assembly {
            admin := sload(adminSlot)
        }
        console.log("Proxy admin address (EIP-1967 slot):", admin);
        if (admin != address(0)) {
            console.log("Likely a TransparentUpgradeableProxy (admin slot set)");
        } else {
            console.log("Admin slot is zero (not a Transparent proxy, or admin is zero)");
        }
    }
}