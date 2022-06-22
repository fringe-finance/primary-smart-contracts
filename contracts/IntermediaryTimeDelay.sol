// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "./util/PermissionGroup.sol";

contract IntermediaryTimeDelay is PermissionGroup{
    
    uint256 public constant minimumDelayPeriod = 60;

    uint256 public delayPeriod;

    mapping (bytes32 => uint) public queuedTransactions;

    event SetDelayPeriod(uint256 oldDelayPeriod, uint256 newDelayPeriod);

    event QueueTransaction(address sender, bytes32 indexed txHash, address indexed target, uint256 lockTime, bytes data);
    event ExecuteTransaction(bytes32 indexed txHash, address indexed target, bytes data, address sender);
    event CancelTransaction(bytes32 indexed txHash, address indexed target, bytes data, address sender);

    constructor() {
        delayPeriod = 300;
    }

    function setDelayPeriod(uint256 _delayPeriod) public onlyOperator {
        require(minimumDelayPeriod <= _delayPeriod, "IntermediaryTimeDelay: too low delayPeriod");
        emit SetDelayPeriod(delayPeriod, _delayPeriod);
        delayPeriod = _delayPeriod;
    }

    function queueTransaction(address _target, bytes memory _data) public onlyOperator returns (bytes32) {
        bytes32 txHash = keccak256(abi.encode(_target, _data));
        require(queuedTransactions[txHash] == 0, "IntermediaryTimeDelay: already in the queue");
        queuedTransactions[txHash] = block.timestamp;

        emit QueueTransaction(msg.sender, txHash, _target, block.timestamp, _data);
        return txHash;
    }

    function cancelTransaction(address _target, bytes memory _data) public onlyOperator {
        require(_target != address(0), "IntermediaryTimeDelay: invalid address");
        bytes32 txHash = keccak256(abi.encode(_target, _data));
        require(queuedTransactions[txHash] != 0, "IntermediaryTimeDelay: not found");
        queuedTransactions[txHash] = 0;

        emit CancelTransaction(txHash, _target, _data, msg.sender);
    }

    function executeTransaction(address _target, bytes memory _data) public onlyOperator returns (bytes memory response) {
        require(_target != address(0), "IntermediaryTimeDelay: invalid address");
        bytes32 txHash = keccak256(abi.encode(_target, _data));
        require(queuedTransactions[txHash] != 0, "IntermediaryTimeDelay: Call first lockTransaction");
        require(block.timestamp >= queuedTransactions[txHash]+ delayPeriod, "IntermediaryTimeDelay: not time yet ");

        // solium-disable-next-line security/no-call-value
        (bool success, bytes memory returnData) = _target.call(_data);
        require(success, "IntermediaryTimeDelay: Transaction execution reverted.");
        queuedTransactions[txHash] = 0;

        emit ExecuteTransaction(txHash, _target, _data, msg.sender);

        return returnData;
    }


}