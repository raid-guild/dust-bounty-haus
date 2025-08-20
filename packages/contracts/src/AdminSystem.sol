// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";

import { Admin } from "./codegen/tables/Admin.sol";


contract AdminSystem is System {
  modifier onlyAdmin() {
    require(Admin.get(_msgSender()) == true, "Not the admin");
    _;
  }

  function setAdmin(address admin, bool isAdmin) external onlyAdmin {
    Admin.set(admin, isAdmin);
  }


}