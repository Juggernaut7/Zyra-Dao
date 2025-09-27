const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CommitRevealVoting", function () {
  let votingContract;
  let owner;
  let voter1;
  let voter2;
  let voter3;

  beforeEach(async function () {
    [owner, voter1, voter2, voter3] = await ethers.getSigners();
    
    const CommitRevealVoting = await ethers.getContractFactory("CommitRevealVoting");
    votingContract = await CommitRevealVoting.deploy();
    await votingContract.waitForDeployment();
  });

  describe("Proposal Creation", function () {
    it("Should create a proposal successfully", async function () {
      const tx = await votingContract.createProposal(
        "Test Proposal",
        "This is a test proposal",
        ethers.parseEther("1.0"),
        86400, // 1 day
        86400  // 1 day
      );

      await expect(tx)
        .to.emit(votingContract, "ProposalCreated")
        .withArgs(0, owner.address, "Test Proposal", ethers.parseEther("1.0"));

      const proposal = await votingContract.getProposal(0);
      expect(proposal.title).to.equal("Test Proposal");
      expect(proposal.proposer).to.equal(owner.address);
      expect(proposal.amountRequested).to.equal(ethers.parseEther("1.0"));
    });

    it("Should fail to create proposal with invalid duration", async function () {
      await expect(
        votingContract.createProposal(
          "Test Proposal",
          "This is a test proposal",
          ethers.parseEther("1.0"),
          3600, // 1 hour (too short)
          86400
        )
      ).to.be.revertedWith("Commit duration too short");
    });
  });

  describe("Voting Process", function () {
    let proposalId;

    beforeEach(async function () {
      const tx = await votingContract.createProposal(
        "Test Proposal",
        "This is a test proposal",
        ethers.parseEther("1.0"),
        86400,
        86400
      );
      await tx.wait();
      proposalId = 0;
    });

    it("Should commit votes successfully", async function () {
      const vote = true;
      const salt = ethers.randomBytes(32);
      const commitHash = ethers.keccak256(ethers.solidityPacked(["bool", "uint256"], [vote, salt]));

      await expect(votingContract.connect(voter1).commitVote(proposalId, commitHash))
        .to.emit(votingContract, "VoteCommitted")
        .withArgs(proposalId, voter1.address, commitHash);

      const voteStatus = await votingContract.getUserVoteStatus(proposalId, voter1.address);
      expect(voteStatus.hasCommitted).to.be.true;
      expect(voteStatus.commitHash).to.equal(commitHash);
    });

    it("Should reveal votes successfully", async function () {
      // First commit votes
      const vote1 = true;
      const salt1 = ethers.randomBytes(32);
      const commitHash1 = ethers.keccak256(ethers.solidityPacked(["bool", "uint256"], [vote1, salt1]));

      await votingContract.connect(voter1).commitVote(proposalId, commitHash1);

      // Fast forward to reveal phase
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");

      // Reveal vote
      await expect(votingContract.connect(voter1).revealVote(proposalId, vote1, salt1))
        .to.emit(votingContract, "VoteRevealed")
        .withArgs(proposalId, voter1.address, vote1, 1);

      const voteStatus = await votingContract.getUserVoteStatus(proposalId, voter1.address);
      expect(voteStatus.hasRevealed).to.be.true;
      expect(voteStatus.vote).to.equal(vote1);

      const results = await votingContract.getVotingResults(proposalId);
      expect(results.yesCount).to.equal(1);
      expect(results.noCount).to.equal(0);
    });

    it("Should fail to reveal with wrong salt", async function () {
      // Commit vote
      const vote = true;
      const salt = ethers.randomBytes(32);
      const commitHash = ethers.keccak256(ethers.solidityPacked(["bool", "uint256"], [vote, salt]));

      await votingContract.connect(voter1).commitVote(proposalId, commitHash);

      // Fast forward to reveal phase
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");

      // Try to reveal with wrong salt
      const wrongSalt = ethers.randomBytes(32);
      await expect(
        votingContract.connect(voter1).revealVote(proposalId, vote, wrongSalt)
      ).to.be.revertedWith("Invalid reveal");
    });

    it("Should execute proposal after reveal phase", async function () {
      // Commit and reveal multiple votes
      const votes = [true, true, false];
      const voters = [voter1, voter2, voter3];

      for (let i = 0; i < votes.length; i++) {
        const salt = ethers.randomBytes(32);
        const commitHash = ethers.keccak256(ethers.solidityPacked(["bool", "uint256"], [votes[i], salt]));
        
        await votingContract.connect(voters[i]).commitVote(proposalId, commitHash);
      }

      // Fast forward to reveal phase
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");

      // Reveal all votes
      for (let i = 0; i < votes.length; i++) {
        const salt = ethers.randomBytes(32);
        const commitHash = ethers.keccak256(ethers.solidityPacked(["bool", "uint256"], [votes[i], salt]));
        
        // Re-commit with known salt for reveal
        await votingContract.connect(voters[i]).commitVote(proposalId, commitHash);
        await votingContract.connect(voters[i]).revealVote(proposalId, votes[i], salt);
      }

      // Fast forward past reveal phase
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");

      // Execute proposal
      await expect(votingContract.executeProposal(proposalId))
        .to.emit(votingContract, "ProposalExecuted")
        .withArgs(proposalId, true); // Should pass with 2 yes, 1 no
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to create proposals", async function () {
      await expect(
        votingContract.connect(voter1).createProposal(
          "Test Proposal",
          "This is a test proposal",
          ethers.parseEther("1.0"),
          86400,
          86400
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle duplicate vote commits", async function () {
      const proposalId = 0;
      await votingContract.createProposal(
        "Test Proposal",
        "This is a test proposal",
        ethers.parseEther("1.0"),
        86400,
        86400
      );

      const vote = true;
      const salt = ethers.randomBytes(32);
      const commitHash = ethers.keccak256(ethers.solidityPacked(["bool", "uint256"], [vote, salt]));

      await votingContract.connect(voter1).commitVote(proposalId, commitHash);

      await expect(
        votingContract.connect(voter1).commitVote(proposalId, commitHash)
      ).to.be.revertedWith("Already voted");
    });

    it("Should return correct phase information", async function () {
      await votingContract.createProposal(
        "Test Proposal",
        "This is a test proposal",
        ethers.parseEther("1.0"),
        86400,
        86400
      );

      let phase = await votingContract.getProposalPhase(0);
      expect(phase).to.equal("commit");

      // Fast forward to reveal phase
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");

      phase = await votingContract.getProposalPhase(0);
      expect(phase).to.equal("reveal");

      // Fast forward past reveal phase
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");

      phase = await votingContract.getProposalPhase(0);
      expect(phase).to.equal("completed");
    });
  });
});
