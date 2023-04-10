import { utils, Wallet } from "zksync-web3";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { ZkSyncArtifact } from "@matterlabs/hardhat-zksync-deploy/dist/types";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as ethers from "ethers";

interface SetupParams {
    name: string;
    privateKey: string;
}

interface DeployParams {
    artifact: ZkSyncArtifact;
    deployer: Deployer;
    constructorArgs: any[];
}

interface EstimateDeployFeeParams extends DeployParams {
    fund?: boolean;
}

interface FullDeployParams {
    name: string;
    privateKey: string;
    constructorArgs: any[];
    fund?: boolean;
    verify?: boolean;
}

interface VerifyParams {
    address: string;
    constructorArgs: any[];
}

export async function setup(
    hre: HardhatRuntimeEnvironment,
    { name, privateKey }: SetupParams
) {
    console.log(`Running deploy script for the ${name} contract`);

    console.log("🔵 Initialize wallet");
    const wallet = new Wallet(privateKey);
    console.log("🔵 Wallet initializated");

    console.log("🔵 Creating deployer");
    const deployer = new Deployer(hre, wallet);

    console.log("🔵 Load artifact");
    const artifact = await deployer.loadArtifact(`${name}`);

    return {
        wallet,
        deployer,
        artifact,
    };
}

export async function deploy({
    artifact,
    deployer,
    constructorArgs,
}: DeployParams) {
    console.log(`🔵 Deploying ${artifact.contractName}`);
    const contract = await deployer.deploy(artifact, constructorArgs);

    // Obtain the Constructor Arguments
    console.log(
        `🔵 Constructor Args: ${contract.interface.encodeDeploy(constructorArgs)}`
    );

    // Show the contract info.
    const address = contract.address;
    console.log(`🔵 ${artifact.contractName} was deployed to ${address}`);

    return {
        contract,
        address,
    };
}

export async function estimateDeployFee({
    artifact,
    deployer,
    constructorArgs,
    fund,
}: EstimateDeployFeeParams) {
    console.log("🔵 Estimate contract deployment fee");
    const deploymentFee = await deployer.estimateDeployFee(
        artifact,
        constructorArgs
    );
    console.log(`🔵 Estimated gas cost ${deploymentFee}`);

    const parsedFee = ethers.utils.formatEther(deploymentFee.toString());
    console.log(`🔵 The deployment is estimated to cost ${parsedFee} ETH`);

    if (fund) {
        console.log("🔵 Sending ETH from L1 (goerli)");
        const depositHandle = await deployer.zkWallet.deposit({
            to: deployer.zkWallet.address,
            token: utils.ETH_ADDRESS,
            amount: deploymentFee.mul(2), // Double so it's enough in case of miss-estimation
        });
        // Wait until the deposit is processed on zkSync
        await depositHandle.wait();
    }

    return {
        deploymentFee,
        parsedFee,
    };
}

export async function fullDeploy(
    hre: HardhatRuntimeEnvironment,
    { name, constructorArgs, fund, privateKey, verify: _verify }: FullDeployParams
) {
    const { deployer, artifact } = await setup(hre, {
        name,
        privateKey,
    });

    await estimateDeployFee({
        deployer,
        artifact,
        constructorArgs,
        fund,
    });

    const { contract, address } = await deploy({
        deployer,
        artifact,
        constructorArgs,
    });

    if (_verify)
        await verify(hre, {
            constructorArgs,
            address,
        });

    return { contract, address };
}

export async function verify(hre: HardhatRuntimeEnvironment, params: VerifyParams) {
    await hre.run("verify:verify", {
        ...params,
        constructorArguments: params.constructorArgs,
    });
    console.log(`🔵 Contract ${params.address} verified`);
}
