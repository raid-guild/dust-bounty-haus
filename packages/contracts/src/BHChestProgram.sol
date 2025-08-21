// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { HookContext, ITransfer } from "@dust/world/src/ProgramHooks.sol";
import { System, WorldContextConsumer } from "@latticexyz/world/src/System.sol";
import { BaseProgram } from "./BaseProgram.sol";

import { Admin } from "./codegen/tables/Admin.sol";
import { ChestPurchases } from "./codegen/tables/ChestPurchases.sol";
import { ItemPrice } from "./codegen/tables/ItemPrice.sol";
import { ObjectType } from "@dust/world/src/types/ObjectType.sol";
import { RGToken } from "./RGToken.sol";

contract BHChestProgram is ITransfer, System, BaseProgram {
    // ObjectType constants
    ObjectType constant WoodenAxe = ObjectType.wrap(32774);
    ObjectType constant CopperAxe = ObjectType.wrap(32775);
    ObjectType constant WheatSlop = ObjectType.wrap(32790);


    event TokensBurnedOnPurchase
    (
        address indexed forceField,
        address indexed player,
        uint256 amount
    );
    event BHChestBeginTransfer(
        address indexed player,
        ObjectType indexed item,
        uint256 amount,
        uint256 cost
    );


    RGToken public immutable TOKEN = RGToken(0xb607Fc7B1d6D7670b6EBE7D33A708B5416b8347C);
    event ItemPurchased(address indexed player, ObjectType indexed item, uint256 amount, uint256 cost);


    // Get the cost for a player to buy an item (pass in previous count)
    function getItemCost(ObjectType item, uint256 prevCount) public view returns (uint256) {
        if (item == WoodenAxe && prevCount == 0) {
            // First WoodenAxe is free
            return 0;
        }
        // Get price from ItemPrice table
        uint256 price = ItemPrice.get(item);
        return price;
    }

    // Restrict chest withdrawals to admin, process buy for non-admins
    function onTransfer(HookContext calldata ctx, TransferData calldata transfer) external onlyWorld {
        address player = ctx.caller.getPlayerAddress();
        // If there are withdrawals (items leaving chest)
        if (transfer.withdrawals.length > 0) {
            if (!Admin.get(player)) {
                // allow admins to withdraw?
            }
            require(transfer.withdrawals.length == 1, "Only one item per buy");
            ObjectType item = transfer.withdrawals[0].objectType;
            uint32 prevCount = ChestPurchases.get(player, item);
            uint256 cost = getItemCost(item, prevCount);
            emit BHChestBeginTransfer(player, item, 1, cost);
            if (cost > 0) {
                TOKEN.burn(player, cost);
                emit TokensBurnedOnPurchase(address(this), player, cost);
            }
            ChestPurchases.set(player, item, prevCount + 1);
            emit ItemPurchased(player, item, 1, cost);
            
        }
        // only admin can deposit items
        if (transfer.deposits.length > 0) {
            require(Admin.get(player), "Only admin can deposit items");
        }
    }
  // Required due to inheriting from System and WorldConsumer
  function _msgSender() public view override(WorldContextConsumer, BaseProgram) returns (address) {
    return BaseProgram._msgSender();
  }

  function _msgValue() public view override(WorldContextConsumer, BaseProgram) returns (uint256) {
    return BaseProgram._msgValue();
  }
}