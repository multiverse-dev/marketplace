const { expect } = require("chai");
const { ethers } = require("hardhat");
const SaiyaNFTAbi = require("./SaiyaNFT.json").abi;

const SUCCESS = 1;

const SaiyaToken = "0x52ef56ff33F2CCBa571243C67df534d5F94e5e3C";
const SaiyaNFT = "0xe240caaE765E48804cbf8a16de61b02fBBfCb4Fc";
const Market = "0x0C0C35F5AAbb453901441702fc051dc500D29B52";

describe("test arbitrum", function () {

    var market;
    var owner, other;
    var nft, ft;

    async function expectTxSuccess(tx) {
        let r = await tx.wait();
        expect(r.status).to.equal(SUCCESS);
        return r;
    }

    async function createOrder(
        signer,
        orderType,
        nftType,
        nftToken,
        tokenId,
        tokenAmount,
        token,
        price,
        timeLimit,
        changeRate,
        minPrice
    ) {
        let r = await expectTxSuccess(await market.connect(signer).createOrder(orderType, nftType, nftToken, tokenId, tokenAmount, token, price, timeLimit, changeRate, minPrice));
        let event = r.events.find(e => e.event === "CreateOrder");
        const [orderId] = event.args;
        return orderId;
    }

    async function mintNFT() {
        let tokenId = ethers.utils.randomBytes(32);
        await expectTxSuccess(await nft.connect(owner).mint(other.address, tokenId));
        return tokenId;
    }

    before(async function () {
        [owner, other] = await ethers.getSigners();
        market = await ethers.getContractAt("MyMarket", Market);
        nft = await ethers.getContractAt(SaiyaNFTAbi, SaiyaNFT);
        ft = await ethers.getContractAt("IERC20", SaiyaToken);
    });

    it("setTradeFeeRate", async function () {
        const defaultTradeFeeRate = 500;
        expect(await market.getTradeFeeRate()).to.equal(defaultTradeFeeRate);
        const rate1 = 1000;
        await expectTxSuccess(await market.setTradeFeeRate(rate1));
        expect(await market.getTradeFeeRate()).to.equal(rate1);
        const [_, other] = await ethers.getSigners();
        const rate2 = 1500;
        await expect(market.connect(other).setTradeFeeRate(rate2)).to.be.revertedWith("caller is not the owner");
        await market.setTradeFeeRate(defaultTradeFeeRate);// recover
    });

    describe("CreateOrder", function () {

        it("CreateSellOrder", async function () {
            let tokenId = await mintNFT();
            expect(await nft.ownerOf(tokenId)).to.equal(other.address);
            await nft.connect(other).approve(market.address, tokenId);
            market = market.connect(other);
            let orderId = await createOrder(other, 0, 0, nft.address, tokenId, 1, ft.address, 1, 3600, 0, 0);
            let order = await market.getOrder(orderId);
            expect(order.id).to.equal(orderId);
        });

        it("CreateBuyOrder", async function () {
            const amount = 100
            let tokenId = ethers.utils.randomBytes(32);
            await expectTxSuccess(await ft.transfer(other.address, amount));
            await ft.connect(other).approve(market.address, amount);
            let orderId = await createOrder(other, 1, 0, nft.address, tokenId, 1, ft.address, amount, 3600, 0, 0);
            let order = await market.getOrder(orderId);
            expect(order.id).to.equal(orderId);
        });

        it("CreateAutionOrder", async function () {
            const amount = 100
            let tokenId = await mintNFT();
            expect(await nft.ownerOf(tokenId)).to.equal(other.address);
            await nft.connect(other).approve(market.address, tokenId);
            let orderId = await createOrder(other, 2, 0, nft.address, tokenId, 1, ft.address, amount, 3600, 5, amount);
            let order = await market.getOrder(orderId);
            expect(order.id).to.equal(orderId);
        });

        it("CreateDutchAutionOrder", async function () {
            const amount = 100
            let tokenId = await mintNFT();
            expect(await nft.ownerOf(tokenId)).to.equal(other.address);
            await nft.connect(other).approve(market.address, tokenId);
            let orderId = await createOrder(other, 3, 0, nft.address, tokenId, 1, ft.address, amount, 3600, 5, amount - 10);
            let order = await market.getOrder(orderId);
            expect(order.id).to.equal(orderId);
        });

        it("CreateBuyCollectionOrder", async function () {
            const amount = 100
            let tokenId = ethers.utils.randomBytes(32);
            await expectTxSuccess(await ft.transfer(other.address, amount));
            await expectTxSuccess(await ft.connect(other).approve(market.address, amount));
            let orderId = await createOrder(other, 4, 0, nft.address, tokenId, 1, ft.address, amount, 3600, 5, amount);
            let order = await market.getOrder(orderId);
            expect(order.id).to.equal(orderId);
        });

        it("ChangeOrder", async function () {
            const price1 = 100;
            let tokenId = await mintNFT();
            expect(await nft.ownerOf(tokenId)).to.equal(other.address);
            await expectTxSuccess(await nft.connect(other).approve(market.address, tokenId));
            market = market.connect(other);
            let orderId = await createOrder(other, 0, 0, nft.address, tokenId, 1, ft.address, price1, 3600, 0, 0);
            let order = await market.getOrder(orderId);
            expect(order.id).to.equal(orderId);
            expect(order.price).to.equal(price1);
            const price2 = 150;
            await expectTxSuccess(await market.changeOrder(orderId, price2, 7200));
            order = await market.getOrder(orderId);
            expect(order.id).to.equal(orderId);
            expect(order.price).to.equal(price2);
        });

        it("CancelOrder", async function () {
            let tokenId = await mintNFT();
            expect(await nft.ownerOf(tokenId)).to.equal(other.address);
            await expectTxSuccess(await nft.connect(other).approve(market.address, tokenId));
            let orderId = await createOrder(other, 0, 0, nft.address, tokenId, 1, ft.address, 1, 3600, 0, 0);
            let order = await market.getOrder(orderId);
            expect(order.id).to.equal(orderId);
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
            expect(order.id).to.equal(orderId);
            expect(order.price).to.equal(price);
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
            expect(order.id).to.equal(orderId);
            const NewPrice = Price * (50 + 1000) / 1000;
            await expectTxSuccess(await ft.approve(market.address, NewPrice));
            await expectTxSuccess(await market.connect(owner).bid(orderId, NewPrice));
            let { bidder, price } = await market.getBidInfo(orderId);
            expect(bidder).to.equal(owner.address);
            expect(price).to.equal(NewPrice);
        });
    });
});
