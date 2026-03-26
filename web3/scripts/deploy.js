const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with:", deployer.address);

  // 1️⃣ Deploy MedicalReports FIRST
  console.log("\nDeploying MedicalReports...");
  const MedicalReports = await hre.ethers.getContractFactory("MedicalReports");
  const medicalReports = await MedicalReports.deploy();
  await medicalReports.deployed();

  console.log("MedicalReports deployed at:", medicalReports.address);

  // 2️⃣ Deploy Healthcare
  console.log("\nDeploying Healthcare...");
  const Healthcare = await hre.ethers.getContractFactory("Healthcare");
  const healthcare = await Healthcare.deploy();
  await healthcare.deployed();

  console.log("Healthcare deployed at:", healthcare.address);

  // 3️⃣ CONNECT BOTH CONTRACTS
  console.log("\nLinking contracts...");
  const tx = await healthcare.setReportsContract(medicalReports.address);
  await tx.wait();

  console.log("Contracts linked successfully!");

  console.log("\nFINAL OUTPUT");
  console.log("------------------------");
  console.log("Healthcare:", healthcare.address);
  console.log("MedicalReports:", medicalReports.address);
  console.log("Owner:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });