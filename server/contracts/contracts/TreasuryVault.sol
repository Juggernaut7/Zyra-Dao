// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title TreasuryVault
 * @dev Manages DAO treasury funds with multi-signature approval
 */
contract TreasuryVault is Ownable, ReentrancyGuard, Pausable {
    struct Transaction {
        address to;
        uint256 amount;
        string description;
        bool executed;
        bool exists;
        uint256 approvals;
        mapping(address => bool) approvers;
    }

    uint256 public transactionCount;
    uint256 public requiredApprovals = 2; // Minimum approvals needed
    uint256 public constant MAX_APPROVALS = 10;

    mapping(uint256 => Transaction) public transactions;
    mapping(address => bool) public isApprover;
    address[] public approvers;

    event TransactionCreated(
        uint256 indexed transactionId,
        address indexed to,
        uint256 amount,
        string description
    );

    event TransactionApproved(
        uint256 indexed transactionId,
        address indexed approver
    );

    event TransactionExecuted(
        uint256 indexed transactionId,
        address indexed to,
        uint256 amount
    );

    event ApproverAdded(address indexed approver);
    event ApproverRemoved(address indexed approver);
    event RequiredApprovalsUpdated(uint256 newRequiredApprovals);

    modifier onlyApprover() {
        require(isApprover[msg.sender], "Not an approver");
        _;
    }

    modifier validTransaction(uint256 _transactionId) {
        require(transactions[_transactionId].exists, "Transaction does not exist");
        _;
    }

    modifier notExecuted(uint256 _transactionId) {
        require(!transactions[_transactionId].executed, "Transaction already executed");
        _;
    }

    modifier notApproved(uint256 _transactionId) {
        require(!transactions[_transactionId].approvers[msg.sender], "Already approved");
        _;
    }

    constructor(address[] memory _approvers, uint256 _requiredApprovals) {
        require(_approvers.length > 0, "At least one approver required");
        require(_requiredApprovals > 0 && _requiredApprovals <= _approvers.length, "Invalid required approvals");

        for (uint256 i = 0; i < _approvers.length; i++) {
            require(_approvers[i] != address(0), "Invalid approver address");
            isApprover[_approvers[i]] = true;
            approvers.push(_approvers[i]);
        }

        requiredApprovals = _requiredApprovals;
    }

    /**
     * @dev Create a new transaction request
     * @param _to Recipient address
     * @param _amount Amount to transfer
     * @param _description Description of the transaction
     */
    function createTransaction(
        address _to,
        uint256 _amount,
        string memory _description
    ) external onlyApprover returns (uint256) {
        require(_to != address(0), "Invalid recipient address");
        require(_amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= _amount, "Insufficient balance");

        uint256 transactionId = transactionCount++;
        
        Transaction storage transaction = transactions[transactionId];
        transaction.to = _to;
        transaction.amount = _amount;
        transaction.description = _description;
        transaction.executed = false;
        transaction.exists = true;
        transaction.approvals = 0;

        emit TransactionCreated(transactionId, _to, _amount, _description);
        return transactionId;
    }

    /**
     * @dev Approve a transaction
     * @param _transactionId ID of the transaction
     */
    function approveTransaction(
        uint256 _transactionId
    ) external onlyApprover validTransaction(_transactionId) notExecuted(_transactionId) notApproved(_transactionId) {
        Transaction storage transaction = transactions[_transactionId];
        transaction.approvers[msg.sender] = true;
        transaction.approvals++;

        emit TransactionApproved(_transactionId, msg.sender);

        // Auto-execute if enough approvals
        if (transaction.approvals >= requiredApprovals) {
            _executeTransaction(_transactionId);
        }
    }

    /**
     * @dev Execute a transaction (internal)
     * @param _transactionId ID of the transaction
     */
    function _executeTransaction(uint256 _transactionId) internal {
        Transaction storage transaction = transactions[_transactionId];
        
        transaction.executed = true;
        
        (bool success, ) = transaction.to.call{value: transaction.amount}("");
        require(success, "Transaction execution failed");

        emit TransactionExecuted(_transactionId, transaction.to, transaction.amount);
    }

    /**
     * @dev Execute a transaction manually (if enough approvals)
     * @param _transactionId ID of the transaction
     */
    function executeTransaction(
        uint256 _transactionId
    ) external onlyApprover validTransaction(_transactionId) notExecuted(_transactionId) {
        Transaction storage transaction = transactions[_transactionId];
        require(
            transaction.approvals >= requiredApprovals,
            "Insufficient approvals"
        );

        _executeTransaction(_transactionId);
    }

    /**
     * @dev Add a new approver (only owner)
     * @param _approver Address of the new approver
     */
    function addApprover(address _approver) external onlyOwner {
        require(_approver != address(0), "Invalid approver address");
        require(!isApprover[_approver], "Already an approver");
        require(approvers.length < MAX_APPROVALS, "Maximum approvers reached");

        isApprover[_approver] = true;
        approvers.push(_approver);

        emit ApproverAdded(_approver);
    }

    /**
     * @dev Remove an approver (only owner)
     * @param _approver Address of the approver to remove
     */
    function removeApprover(address _approver) external onlyOwner {
        require(isApprover[_approver], "Not an approver");
        require(approvers.length > 1, "Cannot remove last approver");
        require(requiredApprovals <= approvers.length - 1, "Required approvals too high");

        isApprover[_approver] = false;

        // Remove from approvers array
        for (uint256 i = 0; i < approvers.length; i++) {
            if (approvers[i] == _approver) {
                approvers[i] = approvers[approvers.length - 1];
                approvers.pop();
                break;
            }
        }

        emit ApproverRemoved(_approver);
    }

    /**
     * @dev Update required approvals (only owner)
     * @param _newRequiredApprovals New required approvals count
     */
    function updateRequiredApprovals(uint256 _newRequiredApprovals) external onlyOwner {
        require(_newRequiredApprovals > 0, "Required approvals must be greater than 0");
        require(_newRequiredApprovals <= approvers.length, "Required approvals too high");

        requiredApprovals = _newRequiredApprovals;
        emit RequiredApprovalsUpdated(_newRequiredApprovals);
    }

    /**
     * @dev Deposit ETH to the treasury
     */
    function deposit() external payable {
        require(msg.value > 0, "Amount must be greater than 0");
    }

    /**
     * @dev Get transaction details
     * @param _transactionId ID of the transaction
     */
    function getTransaction(
        uint256 _transactionId
    ) external view validTransaction(_transactionId) returns (
        address to,
        uint256 amount,
        string memory description,
        bool executed,
        uint256 approvals
    ) {
        Transaction storage transaction = transactions[_transactionId];
        return (
            transaction.to,
            transaction.amount,
            transaction.description,
            transaction.executed,
            transaction.approvals
        );
    }

    /**
     * @dev Check if an address has approved a transaction
     * @param _transactionId ID of the transaction
     * @param _approver Address of the approver
     */
    function hasApproved(
        uint256 _transactionId,
        address _approver
    ) external view validTransaction(_transactionId) returns (bool) {
        return transactions[_transactionId].approvers[_approver];
    }

    /**
     * @dev Get all approvers
     */
    function getAllApprovers() external view returns (address[] memory) {
        return approvers;
    }

    /**
     * @dev Get treasury balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Pause the contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal (only owner, when paused)
     */
    function emergencyWithdraw(address _to, uint256 _amount) external onlyOwner whenPaused {
        require(_to != address(0), "Invalid recipient address");
        require(_amount > 0 && _amount <= address(this).balance, "Invalid amount");

        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Emergency withdrawal failed");
    }
}
