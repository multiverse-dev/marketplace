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
  defaultNetwork: "arbitrumLocal",

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
    arbitrumTestnet: {
      chainId: 421613,
      url: "https://goerli-rollup.arbitrum.io/rpc",
      accounts: [],
    },
    arbitrumLocal: {
      url: "http://localhost:8547",
      accounts: ["0xe887f7d17d07cc7b8004053fb8826f6657084e88904bb61590e498ca04704cf2", "0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659"],
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
};
