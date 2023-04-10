import { HardhatRuntimeEnvironment, HttpNetworkConfig } from "hardhat/types";
import { fullDeploy } from "../utils";

export default async (hre: HardhatRuntimeEnvironment) => {
    const PrivateKey = ((hre.network.config as HttpNetworkConfig).accounts as string[])[0];
    const Market = await fullDeploy(hre, {
        name: "MyMarket",
        privateKey: PrivateKey,
        constructorArgs: [],
        verify: false,
    });

    const Proxy = await fullDeploy(hre, {
        name: "ERC1967ProxyImp",
        privateKey: PrivateKey,
        constructorArgs: [
            Market.address,
            Market.contract.interface.encodeFunctionData(
                Market.contract.interface.functions[
                "initialize()"
                ],
                []
            ),
        ],
        verify: false,
    });

    console.log(`Deployed Market at ${Market.address}`);
    console.log(`Deployed Proxy at ${Proxy.address}`);
};
