// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import { RGToken } from "../src/RGToken.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployUUPSRGToken is Script {
    // Set your initialization parameters here
    string public name = "RaidGuild DUST Token";
    string public symbol = "RAID";
    address public initialOwner = 0x8FD9fEA62AA61883920C2F4083048C6Ff31aAdf9; // update if needed

    function run() external {
        vm.startBroadcast();

        // 1. Deploy the RGToken implementation
        RGToken implementation = new RGToken();

        // 2. Encode the initializer call
        bytes memory data = abi.encodeWithSelector(
            RGToken.initialize.selector,
            name,
            symbol,
            initialOwner
        );

        // 3. Deploy the UUPS proxy (ERC1967Proxy)
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), data);

        console.log("UUPS RGToken deployed at:", address(proxy));
        console.log("Implementation at:", address(implementation));

        vm.stopBroadcast();
    }
}
