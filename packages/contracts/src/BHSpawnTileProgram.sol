// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System, WorldContextConsumer } from "@latticexyz/world/src/System.sol";

import { HookContext, ISpawn } from "@dust/world/src/ProgramHooks.sol";


import { BaseProgram } from "./BaseProgram.sol";
import { SpawnCount } from "./codegen/tables/SpawnCount.sol";
import { RGToken } from "./RGToken.sol";


uint256 constant FREE_SPAWNS = 1;
uint256 constant SPAWN_COST = 50 ether;

uint128 constant MAX_SPAWN_ENERGY = 245280000000000000;
uint128 constant ALLOWED_SPAWN_ENERGY = MAX_SPAWN_ENERGY / 2;

// Set this to the correct RGToken address for your deployment
address constant RAID_TOKEN_ADDRESS = 0xb607Fc7B1d6D7670b6EBE7D33A708B5416b8347C;


contract BHSpawnTileProgram is ISpawn, System, BaseProgram {
  RGToken public immutable RAID = RGToken(RAID_TOKEN_ADDRESS);

  function onSpawn(HookContext calldata ctx, SpawnData calldata spawn) external onlyWorld {
    address player = ctx.caller.getPlayerAddress();
    uint32 count = SpawnCount.get(player);

    // Check spawn energy
    require(spawn.energy <= ALLOWED_SPAWN_ENERGY, "Spawn energy too high");

    if (count >= FREE_SPAWNS) {
      // Player must hold enough RAID to spawn
      require(RAID.balanceOf(player) >= SPAWN_COST, "Not enough RAID");
    }
    SpawnCount.set(player, count + 1);
  }

  // Required due to inheriting from System and WorldConsumer
  function _msgSender() public view override(WorldContextConsumer, BaseProgram) returns (address) {
    return BaseProgram._msgSender();
  }

  function _msgValue() public view override(WorldContextConsumer, BaseProgram) returns (uint256) {
    return BaseProgram._msgValue();
  }
}