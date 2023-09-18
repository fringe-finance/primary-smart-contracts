// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

/**
 * @title PrimaryLendingPlatformProxyAdmin.
 * @notice The PrimaryLendingPlatformProxyAdmin contract is the contract that provides the functionality for upgrading the proxy contracts.
 * @dev Contract that provides the functionality for upgrading the proxy contracts. Inherit from ProxyAdmin.
 */
contract PrimaryLendingPlatformProxyAdmin is ProxyAdmin {
    uint256 public constant minimumDelayPeriod = 1 days;

    uint256 public delayPeriod;

    struct UpgradeData {
        uint256 appendTimestamp;
        uint256 delayPeriod;
        address oldImplementation;
        address newImplementation;
    }

    mapping(address => UpgradeData) public upgradeData;

    /**
     * @dev Emitted when the delay period is set.
     * @param oldDelayPeriod The old delay period value.
     * @param newDelayPeriod The new delay period value.
     */
    event SetDelayPeriod(uint256 oldDelayPeriod, uint256 newDelayPeriod);

    /**
     * @dev Emitted when a new upgrade is appended to the upgrade schedule.
     * @param proxy The address of the proxy contract being upgraded.
     * @param appendTimestamp The timestamp when the upgrade was appended to the schedule.
     * @param delayPeriod The delay period before the upgrade can be executed.
     * @param oldImplementation The address of the current implementation contract.
     * @param newImplementation The address of the new implementation contract.
     */
    event AppendUpgrade(address indexed proxy, uint256 appendTimestamp, uint256 delayPeriod, address oldImplementation, address newImplementation);

    /**
     * @dev Emitted when a proxy contract is upgraded to a new implementation.
     * @param proxy The address of the upgraded proxy contract.
     * @param upgradeTimestamp The timestamp of the upgrade.
     * @param oldImplementation The address of the old implementation contract.
     * @param newImplementation The address of the new implementation contract.
     */
    event Upgrade(address indexed proxy, uint256 upgradeTimestamp, address oldImplementation, address newImplementation);

    constructor() {
        delayPeriod = 7 days;
    }

    /**
     * @dev Sets the delay period for the PrimaryLendingPlatformProxyAdmin contract.
     * @param _delayPeriod The new delay period to be set.
     *
     * Requirements:
     * - The caller must be the owner of the contract.
     * - `_delayPeriod` must be greater than or equal to the minimum delay period.
     */
    function setDelayPeriod(uint256 _delayPeriod) external onlyOwner {
        require(minimumDelayPeriod <= _delayPeriod, "PrimaryLendingPlatformProxyAdmin: too low delayPeriod");
        emit SetDelayPeriod(delayPeriod, _delayPeriod);
        delayPeriod = _delayPeriod;
    }

    /**
     * @dev Changes the admin of a transparent proxy.
     * @param proxy The address of the proxy to change the admin of.
     * @param newAdmin The address of the new admin.
     *
     * Requirements:
     * - The caller must be the owner of the contract.
     * - This function is forbidden and will always revert.
     */
    function changeProxyAdmin(ITransparentUpgradeableProxy proxy, address newAdmin) public override onlyOwner {
        proxy;
        newAdmin;
        if (false) {
            delayPeriod++;
        }
        revert("PrimaryLendingPlatformProxyAdmin: ChangeProxyAdmin is forbidden");
    }

    /**
     * @dev Appends an upgrade to the upgrade queue for the given proxy contract.
     * @param proxy The proxy contract to upgrade.
     * @param newImplementation The address of the new implementation contract.
     *
     * Requirements:
     * - The caller must be the owner of the contract.
     * - The upgrade queue for the given proxy contract must be empty.
     *
     * Effects:
     * - Sets the append timestamp for the upgrade.
     * - Sets the delay period for the upgrade.
     * - Sets the old implementation for the upgrade.
     * - Sets the new implementation for the upgrade.
     */
    function appendUpgrade(ITransparentUpgradeableProxy proxy, address newImplementation) public onlyOwner {
        UpgradeData storage _upgrade = upgradeData[address(proxy)];
        if (_upgrade.appendTimestamp != 0) {
            revert("PrimaryLendingPlatformProxyAdmin: Wait for next upgrade");
        }
        _upgrade.appendTimestamp = block.timestamp;
        _upgrade.delayPeriod = delayPeriod;
        _upgrade.oldImplementation = getProxyImplementation(proxy);
        _upgrade.newImplementation = newImplementation;
        emit AppendUpgrade(address(proxy), _upgrade.appendTimestamp, _upgrade.delayPeriod, _upgrade.oldImplementation, newImplementation);
    }

    /**
     * @dev Upgrades the implementation of a transparent proxy contract.
     * @param proxy The transparent proxy contract to upgrade.
     * @param implementation The address of the new implementation contract.
     *
     * Requirements:
     * - The caller must be the owner of the contract.
     * - The `appendUpgrade` function must have been called before.
     * - The delay period must have passed since the `appendUpgrade` function was called.
     * - The new implementation address must match the one provided in the `appendUpgrade` function.
     */
    function upgrade(ITransparentUpgradeableProxy proxy, address implementation) public override onlyOwner {
        UpgradeData storage _upgrade = upgradeData[address(proxy)];
        if (_upgrade.appendTimestamp == 0) {
            revert("PrimaryLendingPlatformProxyAdmin: Call first appendUpgrade(...)");
        }
        require(_upgrade.appendTimestamp + _upgrade.delayPeriod <= block.timestamp);
        if (implementation == _upgrade.newImplementation) {
            super.upgrade(proxy, implementation);
            emit Upgrade(address(proxy), block.timestamp, _upgrade.oldImplementation, implementation);
            delete upgradeData[address(proxy)];
        } else {
            // proxy contract don't upgrade the implementation
            delete upgradeData[address(proxy)];
        }
    }

    /**
     * @dev Upgrades the implementation of the transparent proxy to a new implementation and calls a function on the new implementation.
     * This function is only callable by the contract owner.
     * @param proxy The transparent proxy to be upgraded.
     * @param implementation The address of the new implementation contract.
     * @param data The data to be passed to the new implementation contract.
     * @notice This function is deprecated.
     */
    function upgradeAndCall(ITransparentUpgradeableProxy proxy, address implementation, bytes memory data) public payable override onlyOwner {
        proxy;
        implementation;
        data;
        revert("PrimaryLendingPlatformProxyAdmin: Use default upgrade()");
    }
}
