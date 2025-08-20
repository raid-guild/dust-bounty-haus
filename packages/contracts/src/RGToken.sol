// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {ERC20PermitUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import {ERC20VotesUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import {ERC20PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {NoncesUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/NoncesUpgradeable.sol";

/**
 * @title RGToken
 * @dev Upgradeable governance token with voting, permits, and pausability
 * Minted when players energize ForceFields in the MUD world
 */
contract RGToken is 
    Initializable,
    ERC20Upgradeable, 
    ERC20PermitUpgradeable, 
    ERC20VotesUpgradeable,
    ERC20PausableUpgradeable,
    OwnableUpgradeable, 
    UUPSUpgradeable 
{
    // Storage layout: keep old mappings, add new ones after
    mapping(address => bool) public authorizedMinters;
    mapping(address => bool) public authorizedTransferers;
    mapping(address => bool) public authorizedBurners;

    // Modifiers for granular access
    modifier onlyMinter() {
        require(authorizedMinters[msg.sender], "Not authorized to mint");
        _;
    }
    modifier onlyTransferer() {
        require(authorizedTransferers[msg.sender], "Not authorized to transfer");
        _;
    }
    modifier onlyBurner() {
        require(authorizedBurners[msg.sender], "Not authorized to burn");
        _;
    }

    // OnlyOwner functions to manage each role
    function authorizeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }
    function revokeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRevoked(minter);
    }
    function authorizeTransferer(address transferer) external onlyOwner {
        authorizedTransferers[transferer] = true;
    }
    function revokeTransferer(address transferer) external onlyOwner {
        authorizedTransferers[transferer] = false;
    }
    function authorizeBurner(address burner) external onlyOwner {
        authorizedBurners[burner] = true;
    }
    function revokeBurner(address burner) external onlyOwner {
        authorizedBurners[burner] = false;
    }

    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);
    event TokensMinted(address indexed to, uint256 amount, address indexed minter);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory name,
        string memory symbol,
        address initialOwner
    ) public initializer {
        __ERC20_init(name, symbol);
        __ERC20Permit_init(name);
        __ERC20Votes_init();
        __ERC20Pausable_init();
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }

    function mint(address to, uint256 amount) external onlyMinter {
        // Auto-delegate to self on first token receipt
        if (balanceOf(to) == 0 && delegates(to) == address(0)) {
            _delegate(to, to);
        }
        _mint(to, amount);
        emit TokensMinted(to, amount, msg.sender);
    }

    function burn(address from, uint256 amount) external onlyBurner {
        _burn(from, amount);
    }

    function systemTransferFrom(address from, address to, uint256 amount) external onlyTransferer {
        _transfer(from, to, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function transferOwnershipToForceFieldOwner(address forceFieldOwner) external onlyOwner {
        require(forceFieldOwner != address(0), "Invalid ForceField owner address");
        _transferOwnership(forceFieldOwner);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // Required overrides for multiple inheritance
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable, ERC20PausableUpgradeable)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20PermitUpgradeable, NoncesUpgradeable)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
