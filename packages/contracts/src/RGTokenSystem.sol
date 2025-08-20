// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { WorldConsumer } from "@latticexyz/world-consumer/src/experimental/WorldConsumer.sol";
import { IRGToken } from "./IRGToken.sol";
import { Constants } from "./Constants.sol";

import { System, WorldContextConsumer } from "@latticexyz/world/src/System.sol";
import { BaseProgram } from "./BaseProgram.sol";
/**
 * @title RGTokenSystem
 * @dev MUD System contract to interact with RGToken (UUPS proxy)
 * Allows MUD World programs to mint, burn, or transfer RGToken on behalf of users
 */
contract RGTokenSystem is System, BaseProgram {
    IRGToken public immutable rgToken = IRGToken(0xb607Fc7B1d6D7670b6EBE7D33A708B5416b8347C);

    // Mint tokens to a user (must be authorized in RGToken)
    function systemMint(address to, uint256 amount) external onlyWorld {
        rgToken.mint(to, amount);
    }

    // Burn tokens from a user (must be authorized in RGToken)
    function systemBurn(address from, uint256 amount) external onlyWorld {
        rgToken.burn(from, amount);
    }

    // System-level transfer: uses systemTransferFrom, not transferFrom
    function systemTransfer(address from, address to, uint256 amount) external onlyWorld {
        rgToken.systemTransferFrom(from, to, amount);
    }

    // Get the token balance of an address
    function balanceOf(address account) external view returns (uint256) {
        return rgToken.balanceOf(account);
    }

    // Get the total token supply
    function totalSupply() external view returns (uint256) {
        return rgToken.totalSupply();
    }

       // Required due to inheriting from System and WorldConsumer
  function _msgSender() public view override(WorldContextConsumer, BaseProgram) returns (address) {
    return BaseProgram._msgSender();
  }

  function _msgValue() public view override(WorldContextConsumer, BaseProgram) returns (uint256) {
    return BaseProgram._msgValue();
  }
}

