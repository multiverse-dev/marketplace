
import { fullDeploy } from "../utils";
import hre from "hardhat";
import * as zk from "zksync-web3";
import * as ethers from "ethers";
import { ERC1967ProxyImp, ERC1967ProxyImp__factory } from "../typechain-types";
import { HttpNetworkConfig } from "hardhat/types";

const Proxy = "0x36b736fD03fe1CB1b5aCB39990797f2C237a13cC";

async function upgrade(proxyAddress: string) {
    const PrivateKey = ((hre.network.config as HttpNetworkConfig).accounts as string[])[0];
    const NewMarket = await fullDeploy(hre, {
        name: "MyMarket",
        privateKey: PrivateKey,
        constructorArgs: [],
        verify: false,
    });

    const ethWeb3Provider = new ethers.providers.JsonRpcProvider((hre.network.config as HttpNetworkConfig).ethNetwork);
    const zkWeb3Provider = new zk.Provider((hre.network.config as HttpNetworkConfig).url);
    const owner = new zk.Wallet(PrivateKey).connect(zkWeb3Provider).connectToL1(ethWeb3Provider);

    const proxy = new zk.Contract(proxyAddress, ERC1967ProxyImp__factory.abi, owner) as ERC1967ProxyImp;
    console.log(`old imp: ${await proxy.Implementation()}`);
    let tx = await proxy.Upgrade(NewMarket.address);
    let r = await tx.wait();
    if (r.events == null) throw "no events";
    let event = r.events.find(e => e.event === "Upgraded");
    if (event == null || event.args == null) throw "no create order event";
    const [newImpl] = event.args;
    console.log(`new impl: ${newImpl}`);
};

upgrade(Proxy)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
