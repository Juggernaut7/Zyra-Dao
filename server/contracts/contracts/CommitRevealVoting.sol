// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CommitRevealVoting
 * @dev Implements commit-reveal voting mechanism for DAO proposals
 */
contract CommitRevealVoting is Ownable, ReentrancyGuard {
    struct Proposal {
        string title;
        string description;
        address proposer;
        uint256 amountRequested;
        uint256 commitStartTime;
        uint256 commitEndTime;
        uint256 revealStartTime;
        uint256 revealEndTime;
        bool executed;
        bool exists;
    }

    struct Vote {
        bytes32 commitHash;
        bool revealed;
        bool vote; // true for yes, false for no
        uint256 weight;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public votes;
    mapping(uint256 => uint256) public totalVotes;
    mapping(uint256 => uint256) public yesVotes;
    mapping(uint256 => uint256) public noVotes;

    uint256 public proposalCount;
    uint256 public constant MIN_COMMIT_DURATION = 1 days;
    uint256 public constant MIN_REVEAL_DURATION = 1 days;
    uint256 public constant QUORUM_THRESHOLD = 1000; // Minimum votes required
    uint256 public constant MAJORITY_THRESHOLD = 50; // 50% + 1 for majority

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 amountRequested
    );

    event VoteCommitted(
        uint256 indexed proposalId,
        address indexed voter,
        bytes32 commitHash
    );

    event VoteRevealed(
        uint256 indexed proposalId,
        address indexed voter,
        bool vote,
        uint256 weight
    );

    event ProposalExecuted(
        uint256 indexed proposalId,
        bool passed
    );

    modifier validProposal(uint256 _proposalId) {
        require(proposals[_proposalId].exists, "Proposal does not exist");
        _;
    }

    modifier duringCommitPhase(uint256 _proposalId) {
        require(
            block.timestamp >= proposals[_proposalId].commitStartTime &&
            block.timestamp <= proposals[_proposalId].commitEndTime,
            "Not in commit phase"
        );
        _;
    }

    modifier duringRevealPhase(uint256 _proposalId) {
        require(
            block.timestamp >= proposals[_proposalId].revealStartTime &&
            block.timestamp <= proposals[_proposalId].revealEndTime,
            "Not in reveal phase"
        );
        _;
    }

    modifier afterRevealPhase(uint256 _proposalId) {
        require(
            block.timestamp > proposals[_proposalId].revealEndTime,
            "Still in reveal phase"
        );
        _;
    }

    /**
     * @dev Create a new proposal
     * @param _title Proposal title
     * @param _description Proposal description
     * @param _amountRequested Amount requested from treasury
     * @param _commitDuration Duration of commit phase in seconds
     * @param _revealDuration Duration of reveal phase in seconds
     */
    function createProposal(
        string memory _title,
        string memory _description,
        uint256 _amountRequested,
        uint256 _commitDuration,
        uint256 _revealDuration
    ) external onlyOwner returns (uint256) {
        require(_commitDuration >= MIN_COMMIT_DURATION, "Commit duration too short");
        require(_revealDuration >= MIN_REVEAL_DURATION, "Reveal duration too short");

        uint256 proposalId = proposalCount + 1; // Get next ID without incrementing yet
        uint256 commitStartTime = block.timestamp;
        uint256 commitEndTime = commitStartTime + _commitDuration;
        uint256 revealStartTime = commitEndTime;
        uint256 revealEndTime = revealStartTime + _revealDuration;

        proposals[proposalId] = Proposal({
            title: _title,
            description: _description,
            proposer: msg.sender,
            amountRequested: _amountRequested,
            commitStartTime: commitStartTime,
            commitEndTime: commitEndTime,
            revealStartTime: revealStartTime,
            revealEndTime: revealEndTime,
            executed: false,
            exists: true
        });

        proposalCount++; // Only increment after successful proposal creation

        emit ProposalCreated(proposalId, msg.sender, _title, _amountRequested);
        return proposalId;
    }

    /**
     * @dev Commit a vote for a proposal
     * @param _proposalId ID of the proposal
     * @param _commitHash Hash of the vote and salt
     */
    function commitVote(
        uint256 _proposalId,
        bytes32 _commitHash
    ) external validProposal(_proposalId) duringCommitPhase(_proposalId) {
        require(
            votes[_proposalId][msg.sender].commitHash == bytes32(0),
            "Already voted"
        );

        votes[_proposalId][msg.sender].commitHash = _commitHash;
        totalVotes[_proposalId]++;

        emit VoteCommitted(_proposalId, msg.sender, _commitHash);
    }

    /**
     * @dev Reveal a vote for a proposal
     * @param _proposalId ID of the proposal
     * @param _vote The actual vote (true for yes, false for no)
     * @param _salt The salt used to generate the commit hash
     */
    function revealVote(
        uint256 _proposalId,
        bool _vote,
        uint256 _salt
    ) external validProposal(_proposalId) duringRevealPhase(_proposalId) {
        require(
            votes[_proposalId][msg.sender].commitHash != bytes32(0),
            "No committed vote"
        );
        require(
            !votes[_proposalId][msg.sender].revealed,
            "Vote already revealed"
        );

        bytes32 expectedHash = keccak256(abi.encodePacked(_vote, _salt));
        require(
            expectedHash == votes[_proposalId][msg.sender].commitHash,
            "Invalid reveal"
        );

        votes[_proposalId][msg.sender].revealed = true;
        votes[_proposalId][msg.sender].vote = _vote;
        votes[_proposalId][msg.sender].weight = 1; // Each vote has equal weight

        if (_vote) {
            yesVotes[_proposalId]++;
        } else {
            noVotes[_proposalId]++;
        }

        emit VoteRevealed(_proposalId, msg.sender, _vote, 1);
    }

    /**
     * @dev Execute a proposal after reveal phase ends
     * @param _proposalId ID of the proposal
     */
    function executeProposal(
        uint256 _proposalId
    ) external validProposal(_proposalId) afterRevealPhase(_proposalId) nonReentrant {
        require(!proposals[_proposalId].executed, "Already executed");

        proposals[_proposalId].executed = true;

        bool passed = false;
        uint256 totalRevealedVotes = yesVotes[_proposalId] + noVotes[_proposalId];

        // Check if quorum is met and majority is achieved
        if (
            totalRevealedVotes >= QUORUM_THRESHOLD &&
            yesVotes[_proposalId] > noVotes[_proposalId]
        ) {
            passed = true;
        }

        emit ProposalExecuted(_proposalId, passed);
    }

    /**
     * @dev Get proposal details
     * @param _proposalId ID of the proposal
     */
    function getProposal(
        uint256 _proposalId
    ) external view returns (
        string memory title,
        string memory description,
        address proposer,
        uint256 amountRequested,
        uint256 commitStartTime,
        uint256 commitEndTime,
        uint256 revealStartTime,
        uint256 revealEndTime,
        bool executed,
        bool exists
    ) {
        Proposal memory proposal = proposals[_proposalId];
        return (
            proposal.title,
            proposal.description,
            proposal.proposer,
            proposal.amountRequested,
            proposal.commitStartTime,
            proposal.commitEndTime,
            proposal.revealStartTime,
            proposal.revealEndTime,
            proposal.executed,
            proposal.exists
        );
    }

    /**
     * @dev Get voting results for a proposal
     * @param _proposalId ID of the proposal
     */
    function getVotingResults(
        uint256 _proposalId
    ) external view returns (
        uint256 totalCommittedVotes,
        uint256 totalRevealedVotes,
        uint256 yesCount,
        uint256 noCount,
        bool hasQuorum,
        bool hasMajority
    ) {
        require(proposals[_proposalId].exists, "Proposal does not exist");
        
        totalCommittedVotes = totalVotes[_proposalId];
        totalRevealedVotes = yesVotes[_proposalId] + noVotes[_proposalId];
        yesCount = yesVotes[_proposalId];
        noCount = noVotes[_proposalId];
        hasQuorum = totalRevealedVotes >= QUORUM_THRESHOLD;
        hasMajority = yesCount > noCount;

        return (
            totalCommittedVotes,
            totalRevealedVotes,
            yesCount,
            noCount,
            hasQuorum,
            hasMajority
        );
    }

    /**
     * @dev Get user's vote status for a proposal
     * @param _proposalId ID of the proposal
     * @param _voter Address of the voter
     */
    function getUserVoteStatus(
        uint256 _proposalId,
        address _voter
    ) external view returns (
        bool hasCommitted,
        bool hasRevealed,
        bool vote,
        bytes32 commitHash
    ) {
        require(proposals[_proposalId].exists, "Proposal does not exist");
        
        Vote memory userVote = votes[_proposalId][_voter];
        return (
            userVote.commitHash != bytes32(0),
            userVote.revealed,
            userVote.vote,
            userVote.commitHash
        );
    }

    /**
     * @dev Get current phase of a proposal
     * @param _proposalId ID of the proposal
     */
    function getProposalPhase(
        uint256 _proposalId
    ) external view validProposal(_proposalId) returns (string memory) {
        Proposal memory proposal = proposals[_proposalId];
        
        if (block.timestamp < proposal.commitEndTime) {
            return "commit";
        } else if (block.timestamp < proposal.revealEndTime) {
            return "reveal";
        } else {
            return "completed";
        }
    }
}
