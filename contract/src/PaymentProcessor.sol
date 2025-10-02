// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title PaymentProcessor
 * @dev Handles payment links, username transfers, and transaction memos for USDC
 */
contract PaymentProcessor is ReentrancyGuard, Ownable, Pausable {
    IERC20 public immutable usdcToken;
    
    struct PaymentLink {
        address creator;
        uint256 amount;
        uint256 expiresAt;
        string description;
        string customFields;
        bool isActive;
        bool isOneTime;
        uint256 usageCount;
        uint256 maxUsage;
    }
    
    struct Transaction {
        address from;
        address to;
        uint256 amount;
        string memo;
        bytes32 paymentLinkId;
        uint256 timestamp;
        uint256 blockNumber;
    }
    
    // Storage
    mapping(bytes32 => PaymentLink) public paymentLinks;
    mapping(string => address) public usernameToAddress;
    mapping(address => string) public addressToUsername;
    mapping(address => Transaction[]) public userTransactions;
    mapping(bytes32 => address[]) public paymentLinkUsers;
    
    // Events
    event PaymentLinkCreated(
        bytes32 indexed linkId,
        address indexed creator,
        uint256 amount,
        uint256 expiresAt,
        bool isOneTime
    );
    
    event PaymentLinkUsed(
        bytes32 indexed linkId,
        address indexed payer,
        address indexed recipient,
        uint256 amount,
        string payerData
    );
    
    event PaymentLinkDeactivated(bytes32 indexed linkId, address indexed creator);
    
    event UsernameRegistered(address indexed user, string username);
    
    event TransferWithMemo(
        address indexed from,
        address indexed to,
        uint256 amount,
        string memo
    );
    
    event UsernameTransfer(
        address indexed from,
        address indexed to,
        string indexed username,
        uint256 amount,
        string memo
    );
    
    constructor(address _usdcToken) Ownable(msg.sender) {
        usdcToken = IERC20(_usdcToken);
    }
    
    /**
     * @dev Register a username for the caller
     */
    function registerUsername(string calldata username) external {
        require(bytes(username).length > 0 && bytes(username).length <= 32, "Invalid username length");
        require(usernameToAddress[username] == address(0), "Username already taken");
        require(bytes(addressToUsername[msg.sender]).length == 0, "Address already has username");
        
        usernameToAddress[username] = msg.sender;
        addressToUsername[msg.sender] = username;
        
        emit UsernameRegistered(msg.sender, username);
    }
    
    /**
     * @dev Transfer USDC with memo
     */
    function transferWithMemo(
        address to,
        uint256 amount,
        string calldata memo
    ) external nonReentrant whenNotPaused {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        
        require(usdcToken.transferFrom(msg.sender, to, amount), "Transfer failed");
        
        // Record transaction
        Transaction memory txn = Transaction({
            from: msg.sender,
            to: to,
            amount: amount,
            memo: memo,
            paymentLinkId: bytes32(0),
            timestamp: block.timestamp,
            blockNumber: block.number
        });
        
        userTransactions[msg.sender].push(txn);
        userTransactions[to].push(txn);
        
        emit TransferWithMemo(msg.sender, to, amount, memo);
    }
    
    /**
     * @dev Transfer USDC to username
     */
    function transferToUsername(
        string calldata username,
        uint256 amount,
        string calldata memo
    ) external nonReentrant whenNotPaused {
        address recipient = usernameToAddress[username];
        require(recipient != address(0), "Username not found");
        require(amount > 0, "Amount must be greater than 0");
        
        require(usdcToken.transferFrom(msg.sender, recipient, amount), "Transfer failed");
        
        // Record transaction
        Transaction memory txn = Transaction({
            from: msg.sender,
            to: recipient,
            amount: amount,
            memo: memo,
            paymentLinkId: bytes32(0),
            timestamp: block.timestamp,
            blockNumber: block.number
        });
        
        userTransactions[msg.sender].push(txn);
        userTransactions[recipient].push(txn);
        
        emit UsernameTransfer(msg.sender, recipient, username, amount, memo);
    }
    
    /**
     * @dev Create a payment link
     */
    function createPaymentLink(
        bytes32 linkId,
        uint256 amount,
        uint256 expiresAt,
        string calldata description,
        string calldata customFields,
        bool isOneTime,
        uint256 maxUsage
    ) external whenNotPaused {
        require(paymentLinks[linkId].creator == address(0), "Link ID already exists");
        require(amount > 0, "Amount must be greater than 0");
        require(expiresAt == 0 || expiresAt > block.timestamp, "Invalid expiration");
        
        paymentLinks[linkId] = PaymentLink({
            creator: msg.sender,
            amount: amount,
            expiresAt: expiresAt,
            description: description,
            customFields: customFields,
            isActive: true,
            isOneTime: isOneTime,
            usageCount: 0,
            maxUsage: maxUsage == 0 ? type(uint256).max : maxUsage
        });
        
        emit PaymentLinkCreated(linkId, msg.sender, amount, expiresAt, isOneTime);
    }
    
    /**
     * @dev Process payment via link
     */
    function processPaymentLink(
        bytes32 linkId,
        string calldata payerData
    ) external nonReentrant whenNotPaused {
        PaymentLink storage link = paymentLinks[linkId];
        require(link.creator != address(0), "Payment link not found");
        require(link.isActive, "Payment link is inactive");
        require(link.expiresAt == 0 || block.timestamp <= link.expiresAt, "Payment link expired");
        require(link.usageCount < link.maxUsage, "Payment link usage limit reached");
        
        link.usageCount++;
        paymentLinkUsers[linkId].push(msg.sender);
        
        // Deactivate if one-time use
        if (link.isOneTime) {
            link.isActive = false;
        }
        
        require(usdcToken.transferFrom(msg.sender, link.creator, link.amount), "Transfer failed");
        
        // Record transaction
        Transaction memory txn = Transaction({
            from: msg.sender,
            to: link.creator,
            amount: link.amount,
            memo: string(abi.encodePacked("Payment Link: ", link.description)),
            paymentLinkId: linkId,
            timestamp: block.timestamp,
            blockNumber: block.number
        });
        
        userTransactions[msg.sender].push(txn);
        userTransactions[link.creator].push(txn);
        
        emit PaymentLinkUsed(linkId, msg.sender, link.creator, link.amount, payerData);
    }
    
    /**
     * @dev Deactivate a payment link
     */
    function deactivatePaymentLink(bytes32 linkId) external {
        PaymentLink storage link = paymentLinks[linkId];
        require(link.creator == msg.sender, "Only creator can deactivate");
        require(link.isActive, "Link already inactive");
        
        link.isActive = false;
        
        emit PaymentLinkDeactivated(linkId, msg.sender);
    }
    
    /**
     * @dev Get payment link details
     */
    function getPaymentLinkDetails(bytes32 linkId) external view returns (PaymentLink memory) {
        return paymentLinks[linkId];
    }
    
    /**
     * @dev Get user transaction count
     */
    function getUserTransactionCount(address user) external view returns (uint256) {
        return userTransactions[user].length;
    }
    
    /**
     * @dev Get user transactions with pagination
     */
    function getUserTransactions(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (Transaction[] memory) {
        Transaction[] storage txns = userTransactions[user];
        require(offset < txns.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > txns.length) {
            end = txns.length;
        }
        
        Transaction[] memory result = new Transaction[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = txns[i];
        }
        
        return result;
    }
    
    /**
     * @dev Get payment link users
     */
    function getPaymentLinkUsers(bytes32 linkId) external view returns (address[] memory) {
        return paymentLinkUsers[linkId];
    }
    
    /**
     * @dev Emergency pause (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
