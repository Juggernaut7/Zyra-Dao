const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting simple deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.01")) {
    console.log("⚠️  Warning: Low balance. You may need Sepolia ETH for deployment.");
    console.log("Get testnet ETH from: https://sepoliafaucet.com/");
  }

  // Deploy CommitRevealVoting
  console.log("\n📝 Deploying CommitRevealVoting...");
  const CommitRevealVoting = await ethers.getContractFactory("CommitRevealVoting");
  const votingContract = await CommitRevealVoting.deploy();
  await votingContract.waitForDeployment();
  const votingAddress = await votingContract.getAddress();
  console.log(`✅ CommitRevealVoting deployed to: ${votingAddress}`);

  // Deploy TreasuryVault with deployer as approver
  console.log("\n💰 Deploying TreasuryVault...");
  const approvers = [deployer.address]; // Use deployer as approver
  const requiredApprovals = 1; // Only need 1 approval for testing
  
  const TreasuryVault = await ethers.getContractFactory("TreasuryVault");
  const treasuryContract = await TreasuryVault.deploy(approvers, requiredApprovals);
  await treasuryContract.waitForDeployment();
  const treasuryAddress = await treasuryContract.getAddress();
  console.log(`✅ TreasuryVault deployed to: ${treasuryAddress}`);

  // Deposit some ETH to treasury
  console.log("\n💸 Depositing ETH to treasury...");
  const depositTx = await treasuryContract.deposit({ value: ethers.parseEther("0.01") });
  await depositTx.wait();
  console.log("✅ Deposited 0.01 ETH to treasury");

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log(`CommitRevealVoting: ${votingAddress}`);
  console.log(`TreasuryVault: ${treasuryAddress}`);
  
  console.log("\n📝 Update your .env file with:");
  console.log(`CONTRACT_ADDRESS=${votingAddress}`);
  console.log(`TREASURY_ADDRESS=${treasuryAddress}`);

  // Save to file
  const fs = require('fs');
  const deploymentInfo = {
    votingContract: votingAddress,
    treasuryContract: treasuryAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync('./deployment-addresses.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to: deployment-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
