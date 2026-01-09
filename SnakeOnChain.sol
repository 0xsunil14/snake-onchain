// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SnakeOnChain {
    struct Player {
        uint256 highScore;
        uint256 lastPlayed;
    }

    // Constants
    uint256 public constant MAX_SCORE = 1_000_000;
    uint256 public constant COOLDOWN_TIME = 3600; // 1 hour in seconds

    // Owner and storage
    address public owner;
    mapping(address => Player) public players;
    address[] private playerList;

    // Events
    event ScoreSubmitted(address indexed player, uint256 score, uint256 timestamp);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier validScore(uint256 _score) {
        require(_score <= MAX_SCORE, "Score exceeds maximum");
        require(
            players[msg.sender].lastPlayed == 0 ||
            block.timestamp > players[msg.sender].lastPlayed + COOLDOWN_TIME,
            "Cooldown active"
        );
        _;
    }

    // Submit score - FREE (only gas costs)
    function submitScore(uint256 _score) external validScore(_score) {
        Player storage player = players[msg.sender];
        if (_score > player.highScore) {
            player.highScore = _score;
        }
        player.lastPlayed = block.timestamp;

        // Add new player if not in list
        if (!_contains(playerList, msg.sender)) {
            playerList.push(msg.sender);
        }

        emit ScoreSubmitted(msg.sender, _score, block.timestamp);
    }

    // Check if address exists in playerList
    function _contains(address[] storage arr, address _addr) internal view returns (bool) {
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == _addr) return true;
        }
        return false;
    }

    // Get caller's score
    function getMyScore() external view returns (uint256, uint256) {
        Player memory player = players[msg.sender];
        return (player.highScore, player.lastPlayed);
    }

    // Get top 5 players - FIXED VERSION
    function getLeaderboard() external view returns (address[] memory, uint256[] memory) {
        uint256 n = playerList.length;
        
        // Return empty arrays if no players
        if (n == 0) {
            return (new address[](0), new uint256[](0));
        }

        // Create arrays to sort
        address[] memory sortedAddresses = new address[](n);
        uint256[] memory sortedScores = new uint256[](n);

        // Copy data
        for (uint256 i = 0; i < n; i++) {
            address playerAddr = playerList[i];
            sortedAddresses[i] = playerAddr;
            sortedScores[i] = players[playerAddr].highScore;
        }

        // Bubble sort (descending order) - FIXED to handle n=1
        if (n > 1) {
            for (uint256 i = 0; i < n - 1; i++) {
                for (uint256 j = 0; j < n - i - 1; j++) {
                    if (sortedScores[j] < sortedScores[j + 1]) {
                        // Swap scores
                        (sortedScores[j], sortedScores[j + 1]) = (sortedScores[j + 1], sortedScores[j]);
                        // Swap addresses
                        (sortedAddresses[j], sortedAddresses[j + 1]) = (sortedAddresses[j + 1], sortedAddresses[j]);
                    }
                }
            }
        }

        // Return top 5 (or fewer if less than 5 players)
        uint256 returnSize = n < 100 ? n : 100;
        address[] memory topAddresses = new address[](returnSize);
        uint256[] memory topScores = new uint256[](returnSize);
        
        for (uint256 i = 0; i < returnSize; i++) {
            topAddresses[i] = sortedAddresses[i];
            topScores[i] = sortedScores[i];
        }

        return (topAddresses, topScores);
    }

    // Helper function to get total number of players
    function getPlayerCount() external view returns (uint256) {
        return playerList.length;
    }
}