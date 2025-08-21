// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

import { WorldConsumer } from "@latticexyz/world-consumer/src/experimental/WorldConsumer.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { WorldContextConsumer } from "@latticexyz/world/src/WorldContext.sol";
import { defaultProgramSystem } from "@dust/programs/src/codegen/systems/DefaultProgramSystemLib.sol";

import {
  HookContext,
  IEnergize,
  IProgramValidator,
  IAddFragment,
  IRemoveFragment,
  IAttachProgram,
  IDetachProgram,
  IBuild,
  IMine
} from "@dust/world/src/ProgramHooks.sol";
import { ObjectTypes } from "@dust/world/src/types/ObjectType.sol";
import { Constants } from "./Constants.sol";
import { BaseProgram } from "./BaseProgram.sol";

import { EntityId } from "@dust/world/src/types/EntityId.sol";

import { RGToken } from "./RGToken.sol";

import { Admin } from "./codegen/tables/Admin.sol";
/**
 * @title ForceFieldMintProgram
 * @dev DUST program that mints tokens on energize and supports all ForceField hooks
 */
contract ForceFieldMintProgram is
  IAttachProgram,
  IDetachProgram,
  IProgramValidator,
  IEnergize,
  IAddFragment,
  IRemoveFragment,
  IBuild,
  IMine,
  System,
  BaseProgram
{
  RGToken public immutable TOKEN = RGToken(0xb607Fc7B1d6D7670b6EBE7D33A708B5416b8347C);
  uint256 public constant MINT_AMOUNT = 10 * 10**18; // 10 tokens

  event TokensMintedOnEnergize(
    address indexed forceField,
    address indexed player,
    uint256 amount,
    uint128 energyAmount
  );

  event AccessGroupSet(address sender, address msgsender, address ff, EntityId indexed forceField);

  function validateProgram(HookContext calldata, ProgramData calldata) external view {
    // Allow attachment to any entity
  }

  function setAccessGroup() external {
    EntityId forceField = EntityId.wrap(0x030000051b0000009afffffc6300000000000000000000000000000000000000);
    emit AccessGroupSet(_msgSender(), msg.sender, address(this), forceField);
    require(Admin.get(_msgSender()), "Only admin can set access groups");
    require(forceField.unwrap() != 0, "Force field not set yet");
    defaultProgramSystem.setAccessGroup(forceField, _msgSender());
  }

  function onAttachProgram(HookContext calldata ctx) public view override(BaseProgram, IAttachProgram) onlyWorld {
    address player = ctx.caller.getPlayerAddress();
    require(Admin.get(player), "Only admin can attach this program");

    require(ctx.target.getObjectType() == ObjectTypes.ForceField, "Target must be a force field");
  }

  function onDetachProgram(HookContext calldata ctx) public view override(BaseProgram, IDetachProgram) onlyWorld {
    address player = ctx.caller.getPlayerAddress();
    require(Admin.get(player), "Only admin can detach this program");
  }

  function onEnergize(HookContext calldata ctx, EnergizeData calldata energize) external onlyWorld {
    address player = address(uint160(uint256(EntityId.unwrap(ctx.caller) << 8 >> 96)));
    require(player != address(0), "Invalid player address");
    TOKEN.mint(player, MINT_AMOUNT);
    emit TokensMintedOnEnergize(
      address(uint160(uint256(EntityId.unwrap(ctx.target) << 8 >> 96))),
      player,
      MINT_AMOUNT,
      energize.amount
    );
  }

  function onAddFragment(HookContext calldata ctx, AddFragmentData calldata) external view onlyWorld {
    address player = ctx.caller.getPlayerAddress();
    require(Admin.get(player), "Only admin can add fragments to the force field");
  }

  function onRemoveFragment(HookContext calldata ctx, RemoveFragmentData calldata) external view onlyWorld {
    address player = ctx.caller.getPlayerAddress();
    require(Admin.get(player), "Only admin can remove fragments from the force field");
  }

  function onBuild(HookContext calldata ctx, BuildData calldata) external view onlyWorld {
    address player = ctx.caller.getPlayerAddress();
    require(Admin.get(player), "Only admin can build the force field");
  }

  function onMine(HookContext calldata ctx, MineData calldata) external view onlyWorld {
    address player = ctx.caller.getPlayerAddress();
    require(Admin.get(player), "Only admin can mine the force field");
  }

   // Required due to inheriting from System and WorldConsumer
  function _msgSender() public view override(WorldContextConsumer, BaseProgram) returns (address) {
    return BaseProgram._msgSender();
  }

  function _msgValue() public view override(WorldContextConsumer, BaseProgram) returns (uint256) {
    return BaseProgram._msgValue();
  }
}
