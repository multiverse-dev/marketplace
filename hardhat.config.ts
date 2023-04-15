import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'
import '@openzeppelin/hardhat-upgrades';
import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";

module.exports = {
  zksolc: {
    version: "1.3.5",
    compilerSource: "binary",
    settings: {},
  },
  defaultNetwork: "arbitrum",

  networks: {
    zkSyncTestnet: {
      url: "https://zksync2-testnet.zksync.dev",
      ethNetwork: "goerli", // Can also be the RPC URL of the network (e.g. `https://goerli.infura.io/v3/<API_KEY>`)
      zksync: true,
      accounts: [],
    },
    zkSyncLocal: {
      url: "http://localhost:3050",
      ethNetwork: "http://localhost:8545",
      zksync: true,
      accounts: ["7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110"],
    },
    arbitrum: {
      chainId: 421613,
      url: "https://goerli-rollup.arbitrum.io/rpc",
      accounts: ["0ad222633c62106143aab084654c94f78913e764f302fa75a4d7d440f8f2dba3", "d4c3fcdcdf3652b275e269419fde173d0d8d3633aaa927671583c4aa3404d336"],
    }
  },
  solidity: {
    version: "0.8.17",
  },
};
