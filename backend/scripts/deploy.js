const hre = require("hardhat");

async function main() {
  console.log("Deploying FileRegistry contract...");

  const FileRegistry = await hre.ethers.getContractFactory("FileRegistry");
  const fileRegistry = await FileRegistry.deploy();

  await fileRegistry.waitForDeployment();

  const address = await fileRegistry.getAddress();
  console.log("FileRegistry deployed to:", address);
  
  // Save the contract address and ABI for frontend
  const fs = require("fs");
  const contractsDir = "../frontend/src/abis";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  fs.writeFileSync(
    contractsDir + "/FileRegistry.json",
    JSON.stringify({
      address: address,
      abi: JSON.parse(fileRegistry.interface.formatJson())
    }, null, 2)
  );

  console.log("Contract ABI and address saved to frontend/src/abis/FileRegistry.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
