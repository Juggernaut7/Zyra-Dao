const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment...");

  // Get the contract factories
  const CommitRevealVoting = await ethers.getContractFactory("CommitRevealVoting");
  const TreasuryVault = await ethers.getContractFactory("TreasuryVault");

  // Deploy CommitRevealVoting
  console.log("📝 Deploying CommitRevealVoting...");
  const votingContract = await CommitRevealVoting.deploy();
  await votingContract.waitForDeployment();
  const votingAddress = await votingContract.getAddress();
  console.log(`✅ CommitRevealVoting deployed to: ${votingAddress}`);

  // Skip TreasuryVault deployment for now - focus on voting contract
  console.log("⏭️ Skipping TreasuryVault deployment for now...");
  const treasuryAddress = "0x0000000000000000000000000000000000000000"; // Placeholder

  // Create a sample proposal
  console.log("📋 Creating sample proposal...");
  const proposalTx = await votingContract.createProposal(
    "Sample DAO Proposal",
    "This is a sample proposal for testing the voting system. It requests 0.1 ETH for community development.",
    ethers.parseEther("0.1"),
    86400, // 1 day commit phase
    86400  // 1 day reveal phase
  );
  await proposalTx.wait();
  console.log("✅ Sample proposal created");

  // Get proposal count
  const proposalCount = await votingContract.proposalCount();
  console.log(`📊 Total proposals: ${proposalCount}`);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log(`CommitRevealVoting: ${votingAddress}`);
  console.log(`TreasuryVault: ${treasuryAddress}`);
  
  console.log("\n🔗 Network Info:");
  const network = await ethers.provider.getNetwork();
  console.log(`Chain ID: ${network.chainId}`);
  console.log(`Network: ${network.name}`);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contracts: {
      CommitRevealVoting: votingAddress,
      TreasuryVault: treasuryAddress
    },
    deploymentTime: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync(
    `./deployments/${network.name}-${network.chainId}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\n💾 Deployment info saved to: ./deployments/${network.name}-${network.chainId}.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
