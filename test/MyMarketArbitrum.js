const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
require("@nomicfoundation/hardhat-chai-matchers");
const SaiyaNFTAbi = require("./SaiyaNFT.json").abi;

const SUCCESS = 1;

const SaiyaToken = "0x7F85fB7f42A0c0D40431cc0f7DFDf88be6495e67";
const SaiyaNFT = "0x8c366Cfd28bC93729e14Da4fcf94d20862A7f266";
const Market = "0x78a6dC8D17027992230c112432E42EC3d6838d74";

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
        expect((await market.getTradeFeeRate()).eq(BigNumber.from(defaultTradeFeeRate))).be.true;
        const rate1 = 1000;
        await expectTxSuccess(await market.setTradeFeeRate(rate1));
        expect((await market.getTradeFeeRate()).eq(rate1)).be.true;
        const [_, other] = await ethers.getSigners();
        const rate2 = 1500;
        await expect(market.connect(other).setTradeFeeRate(rate2)).to.be.revertedWith("Ownable: caller is not the owner");
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
            expect(order.id.eq(orderId)).be.true;
        });

        it("CreateBuyOrder", async function () {
            const amount = 100
            let tokenId = ethers.utils.randomBytes(32);
            await expectTxSuccess(await ft.transfer(other.address, amount));
            await ft.connect(other).approve(market.address, amount);
            let orderId = await createOrder(other, 1, 0, nft.address, tokenId, 1, ft.address, amount, 3600, 0, 0);
            let order = await market.getOrder(orderId);
            expect(order.id.eq(orderId)).be.true;
        });

        it("CreateAutionOrder", async function () {
            const amount = 100
            let tokenId = await mintNFT();
            expect(await nft.ownerOf(tokenId)).to.equal(other.address);
            await nft.connect(other).approve(market.address, tokenId);
            let orderId = await createOrder(other, 2, 0, nft.address, tokenId, 1, ft.address, amount, 3600, 5, amount);
            let order = await market.getOrder(orderId);
            expect(order.id.eq(orderId)).be.true;
        });

        it("CreateDutchAutionOrder", async function () {
            const amount = 100
            let tokenId = await mintNFT();
            expect(await nft.ownerOf(tokenId)).to.equal(other.address);
            await nft.connect(other).approve(market.address, tokenId);
            let orderId = await createOrder(other, 3, 0, nft.address, tokenId, 1, ft.address, amount, 3600, 5, amount - 10);
            let order = await market.getOrder(orderId);
            expect(order.id.eq(orderId)).be.true;
        });

        it("CreateBuyCollectionOrder", async function () {
            const amount = 100
            let tokenId = ethers.utils.randomBytes(32);
            await expectTxSuccess(await ft.transfer(other.address, amount));
            await expectTxSuccess(await ft.connect(other).approve(market.address, amount));
            let orderId = await createOrder(other, 4, 0, nft.address, tokenId, 1, ft.address, amount, 3600, 5, amount);
            let order = await market.getOrder(orderId);
            expect(order.id.eq(orderId)).be.true;
        });

        it("ChangeOrder", async function () {
            const price1 = 100;
            let tokenId = await mintNFT();
            expect(await nft.ownerOf(tokenId)).to.equal(other.address);
            await expectTxSuccess(await nft.connect(other).approve(market.address, tokenId));
            market = market.connect(other);
            let orderId = await createOrder(other, 0, 0, nft.address, tokenId, 1, ft.address, price1, 3600, 0, 0);
            let order = await market.getOrder(orderId);
            expect(order.id.eq(orderId)).be.true;
            expect(order.price.eq(price1)).be.true;
            const price2 = 150;
            await expectTxSuccess(await market.changeOrder(orderId, price2, 7200));
            order = await market.getOrder(orderId);
            expect(order.id.eq(orderId)).be.true;
            expect(order.price.eq(price2)).be.true;
        });

        it("CancelOrder", async function () {
            let tokenId = await mintNFT();
            expect(await nft.ownerOf(tokenId)).to.equal(other.address);
            await expectTxSuccess(await nft.connect(other).approve(market.address, tokenId));
            let orderId = await createOrder(other, 0, 0, nft.address, tokenId, 1, ft.address, 1, 3600, 0, 0);
            let order = await market.getOrder(orderId);
            expect(order.id.eq(orderId)).be.true;
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
            expect(order.id.eq(orderId)).be.true;
            expect(order.price.eq(price)).be.true;
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
            expect(order.id.eq(orderId)).be.true;
            const NewPrice = Price * (50 + 1000) / 1000;
            await expectTxSuccess(await ft.approve(market.address, NewPrice));
            await expectTxSuccess(await market.connect(owner).bid(orderId, NewPrice));
            let { bidder, price } = await market.getBidInfo(orderId);
            expect(bidder).to.equal(owner.address);
            expect(price.eq(NewPrice)).be.true;
        });

        it("fix fullfill collection tokenId", async function () {
            const amount = 100
            let tokenId = "0";
            await expectTxSuccess(await ft.transfer(other.address, amount));
            await expectTxSuccess(await ft.connect(other).approve(market.address, amount));
            let orderId = await createOrder(other, 4, 0, nft.address, tokenId, 1, ft.address, amount, 3600, 5, amount);
            let order = await market.getOrder(orderId);
            expect(order.id.eq(orderId)).be.true;
            tokenId = await mintNFT();
            console.log("tokenId: " + BigNumber.from(tokenId)._hex);
            expect(await nft.ownerOf(tokenId)).to.equal(other.address);
            await expectTxSuccess(await nft.connect(other).transferFrom(other.address, owner.address, tokenId))
            expect(await nft.ownerOf(tokenId)).to.equal(owner.address);
            await expectTxSuccess(await nft.connect(owner).approve(market.address, tokenId));
            let tx = await market.connect(owner).fulfillOrder(orderId, amount, tokenId);
            let r = await tx.wait();
            console.log("tokenId in event: " + r.events[3].args.order.nftInfo.tokenId._hex);
            expect(r.events[3].args.order.nftInfo.tokenId).eq(BigNumber.from(tokenId));
        });
    });
});
