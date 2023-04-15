import { expect } from "chai";
import * as ethers from "ethers";
import "../typechain-types";
import { ContractTransaction } from "@ethersproject/contracts";
import * as zk from "zksync-web3";
import { HttpNetworkConfig } from "hardhat/types";
import hre from "hardhat"
import SaiyaNFTJson from "./SaiyaNFT.json"
import { MyMarket, MyMarket__factory, IERC20__factory, ERC1967ProxyImp__factory, ERC1967ProxyImp } from "../typechain-types";

const SUCCESS = 1;

const SaiyaToken = "0x5B11c36bf87ED2EAc102C42E9528eC99D77f7aFd";
const SaiyaNFT = "0x29c6fF2E3D04a9f37e7af1fF9b38C9E2e9079FfA";
const Market = "0x7AddC93ED39C4c64dffB478999B45f5a40619C23";


describe("test proxy", async function () {
    const Proxy = "0xd19449266F443e67175e7669be788F94ca6e886e";

    const ethWeb3Provider = new ethers.providers.JsonRpcProvider((hre.network.config as HttpNetworkConfig).ethNetwork);
    const zkWeb3Provider = new zk.Provider((hre.network.config as HttpNetworkConfig).url);
    const owner = new zk.Wallet("7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110").connect(zkWeb3Provider).connectToL1(ethWeb3Provider);
    const other = new zk.Wallet("0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3").connect(zkWeb3Provider).connectToL1(ethWeb3Provider);
    it("implementation", async function () {
        const proxy = new zk.Contract(Proxy, ERC1967ProxyImp__factory.abi, other) as ERC1967ProxyImp;
        expect(await proxy.Implementation()).to.eq(Market);
    });

});

describe("test zksync", function () {

    var market: MyMarket;
    var owner: zk.Wallet, other: zk.Wallet;
    var nft: zk.Contract, ft: zk.Contract;
    var tokenId: string;

    async function expectTxSuccess(tx: ContractTransaction) {
        let r = await tx.wait();
        expect(r.status).to.equal(SUCCESS);
        console.log(`txid: ${r.transactionHash}`);
        return r;
    }

    async function createOrder(
        signer: ethers.Signer,
        orderType: ethers.BigNumberish,
        nftType: ethers.BigNumberish,
        nftToken: string,
        tokenId: ethers.BigNumberish,
        tokenAmount: ethers.BigNumberish,
        token: string,
        price: ethers.BigNumberish,
        timeLimit: ethers.BigNumberish,
        changeRate: ethers.BigNumberish,
        minPrice: ethers.BigNumberish
    ) {
        let r = await expectTxSuccess(await market.connect(signer).createOrder(orderType, nftType, nftToken, tokenId, tokenAmount, token, price, timeLimit, changeRate, minPrice));
        if (r.events == null) throw "no events";
        let event = r.events.find(e => e.event === "CreateOrder");
        if (event == null || event.args == null) throw "no create order event";
        const [orderId] = event.args;
        return orderId;
    }

    async function mintNFT() {
        let tokenId = ethers.utils.randomBytes(32);
        await expectTxSuccess(await nft.connect(owner).mint(other.address, tokenId));
        return tokenId;
    }

    before(async function () {
        tokenId = ethers.utils.keccak256("0x00");
        const ethWeb3Provider = new ethers.providers.JsonRpcProvider((hre.network.config as any).ethNetwork);
        const zkWeb3Provider = new zk.Provider((hre.network.config as any).url);
        owner = new zk.Wallet("7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110").connect(zkWeb3Provider).connectToL1(ethWeb3Provider);
        other = new zk.Wallet("0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3").connect(zkWeb3Provider).connectToL1(ethWeb3Provider);
        market = new zk.Contract(Market, MyMarket__factory.abi, owner) as MyMarket;
        nft = new zk.Contract(SaiyaNFT, SaiyaNFTJson.abi, owner);
        ft = new zk.Contract(SaiyaToken, IERC20__factory.abi, owner);
    });

    it("setTradeFeeRate", async function () {
        const defaultTradeFeeRate = 500;
        expect((await market.getTradeFeeRate()).eq(defaultTradeFeeRate)).to.be.true;
        const rate1 = 1000;
        await expectTxSuccess(await market.setTradeFeeRate(rate1));
        expect((await market.getTradeFeeRate()).eq(rate1)).to.true;
        await expectTxSuccess(await market.setTradeFeeRate(500));
    });

    describe("CreateOrder", function () {

        it("CreateSellOrder", async function () {
            let tokenId = await mintNFT();
            expect(await nft.ownerOf(tokenId)).to.equal(other.address);
            await expectTxSuccess(await nft.connect(other).approve(market.address, tokenId));
            market = market.connect(other);
            let orderId = await createOrder(other, 0, 0, nft.address, tokenId, 1, ft.address, 1, 3600, 0, 0);
            let order = await market.getOrder(orderId);
            expect(order.id.eq(orderId)).to.be.true;
        });

        it("CreateBuyOrder", async function () {
            const amount = 100
            let tokenId = ethers.utils.randomBytes(32);
            await expectTxSuccess(await ft.transfer(other.address, amount));
            await expectTxSuccess(await ft.connect(other).approve(market.address, amount));
            let orderId = await createOrder(other, 1, 0, nft.address, tokenId, 1, ft.address, amount, 3600, 0, 0);
            let order = await market.getOrder(orderId);
            expect(order.id.eq(orderId)).to.be.true;
        });

        it("CreateAutionOrder", async function () {
            const amount = 100
            let tokenId = await mintNFT();
            expect(await nft.ownerOf(tokenId)).to.equal(other.address);
            await expectTxSuccess(await nft.connect(other).approve(market.address, tokenId));
            let orderId = await createOrder(other, 2, 0, nft.address, tokenId, 1, ft.address, amount, 3600, 5, amount);
            let order = await market.getOrder(orderId);
            expect(order.id.eq(orderId)).to.be.true;
        });

        it("CreateDutchAutionOrder", async function () {
            const amount = 100
            let tokenId = await mintNFT();
            expect(await nft.ownerOf(tokenId)).to.equal(other.address);
            await expectTxSuccess(await nft.connect(other).approve(market.address, tokenId));
            let orderId = await createOrder(other, 3, 0, nft.address, tokenId, 1, ft.address, amount, 3600, 5, amount - 10);
            let order = await market.getOrder(orderId);
            expect(order.id.eq(orderId)).to.be.true;
        });

        it("CreateBuyCollectionOrder", async function () {
            const amount = 100
            let tokenId = ethers.utils.randomBytes(32);
            await expectTxSuccess(await ft.transfer(other.address, amount));
            await expectTxSuccess(await ft.connect(other).approve(market.address, amount));
            let orderId = await createOrder(other, 4, 0, nft.address, tokenId, 1, ft.address, amount, 3600, 5, amount);
            let order = await market.getOrder(orderId);
            expect(order.id.eq(orderId)).to.be.true;
        });

        it("ChangeOrder", async function () {
            const price1 = 100;
            let tokenId = await mintNFT();
            expect(await nft.ownerOf(tokenId)).to.equal(other.address);
            await expectTxSuccess(await nft.connect(other).approve(market.address, tokenId));
            market = market.connect(other);
            let orderId = await createOrder(other, 0, 0, nft.address, tokenId, 1, ft.address, price1, 3600, 0, 0);
            let order = await market.getOrder(orderId);
            expect(order.id.eq(orderId)).to.be.true;
            expect(order.price.eq(price1)).to.be.true;
            const price2 = 150;
            await expectTxSuccess(await market.changeOrder(orderId, price2, 7200));
            order = await market.getOrder(orderId);
            expect(order.id.eq(orderId)).to.be.true;
            expect(order.price.eq(price2)).to.be.true;
        });

        it("CancelOrder", async function () {
            let tokenId = await mintNFT();
            expect(await nft.ownerOf(tokenId)).to.equal(other.address);
            await expectTxSuccess(await nft.connect(other).approve(market.address, tokenId));
            let orderId = await createOrder(other, 0, 0, nft.address, tokenId, 1, ft.address, 1, 3600, 0, 0);
            let order = await market.getOrder(orderId);
            expect(order.id.eq(orderId)).to.be.true;
            expect(await nft.ownerOf(tokenId)).to.equal(market.address);
            await expectTxSuccess(await market.connect(other).cancelOrder(orderId));
            expect(await nft.ownerOf(tokenId)).to.equal(other.address);
        });

        it("FullfillOrder", async function () {
            const price = 100;
            let tokenId = await mintNFT();
            expect(await nft.ownerOf(tokenId)).to.equal(other.address);
            await expectTxSuccess(await nft.connect(other).approve(market.address, tokenId));
            let orderId = await createOrder(other, 0, 0, nft.address, tokenId, 1, ft.address, price, 3600, 0, 0);
            let order = await market.getOrder(orderId);
            expect(order.id.eq(orderId)).to.be.true;
            expect(order.price.eq(price)).to.be.true;
            await expectTxSuccess(await ft.approve(market.address, price));
            await expectTxSuccess(await market.connect(owner).fulfillOrder(orderId, price, tokenId));
            expect(await nft.ownerOf(tokenId)).to.equal(owner.address);
        });

        it("AuctionBid", async function () {
            const Price = 100;
            const changeRate = 50;
            let tokenId = await mintNFT();
            expect(await nft.ownerOf(tokenId)).to.equal(other.address);
            await expectTxSuccess(await nft.connect(other).approve(market.address, tokenId));
            let orderId = await createOrder(other, 2, 0, nft.address, tokenId, 1, ft.address, Price, 3600, changeRate, 0);
            let order = await market.getOrder(orderId);
            expect(order.id.eq(orderId)).to.be.true;
            const NewPrice = Price * (50 + 1000) / 1000;
            await expectTxSuccess(await ft.approve(market.address, NewPrice));
            await expectTxSuccess(await market.connect(owner).bid(orderId, NewPrice));
            let { bidder, price } = await market.getBidInfo(orderId);
            expect(bidder).to.equal(owner.address);
            expect(price.eq(NewPrice)).to.be.true;
        });
    });
});
