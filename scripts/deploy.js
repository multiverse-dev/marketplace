async function proxyDeploy(name, initParam) {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    // We get the contract to deploy
    const Contract = await hre.ethers.getContractFactory(name);
    const contract = await upgrades.deployProxy(Contract, initParam);
    await contract.deployed();
    console.log("Contract " + name + " proxy deployed to:", contract.address);
    const owner = await contract.owner();
    console.log("owner:", owner);
}

async function proxyUpgrade(name, proxyAddress) {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    // We get the contract to deploy
    const ContractV2 = await ethers.getContractFactory(name);
    const contract = await upgrades.upgradeProxy(proxyAddress, ContractV2);
    console.log("Contract " + name + "  upgraded to:", contract.address);
    const owner = await contract.owner();
    console.log("owner:", owner);
}

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const Token = await ethers.getContractFactory("MyMarket");
    const token = await Token.deploy();

    console.log("Token address:", token.address);
    console.log("Token name:", await token.name());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });