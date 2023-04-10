# marketplace

市场的主旨是提供一个平台，让供需双方能够有地方进行nft的交易。市场提供了两种拍卖模式，第一种是直买直卖，第二种是竞价拍卖。

直买直卖：卖方设定一个价格，买方支付完之后立刻获得货物。

竞价拍卖：卖方设定一个起始拍卖价格以及拍卖时间，在拍卖时间内任意用户可以出价，当出价高于之前用户出价时记为有效。拍卖时间结束后，价格最高的用户可以领取货物。

# 类型定义

## OrderType
枚举值，表示订单类型

0. **Sell**：直卖单
1. **Buy**：求购单
2. **Auction**：英式拍卖单
3. **DutchAuction**：荷式拍卖单
4. **Buy Collection**：集合求购单

## NFTType
枚举值，表示nft类型

0. **ERC721**：ERC721类型
1. **ERC1155**：ERC1155类型

## Order
订单详情

|  数据类型   | 变量名  | 描述 |
|  ----  | ----  |  ---- |
| uint256  | id | 订单编号，自增|
| OrderType  | orderType |  订单类型，0: 直卖单；1:求购单；2:英式竞拍单；3: 荷式竞拍单；4：集合求购单|
| address  | orderOwner | 订单创建者地址|
| address  | token| 用于支付的erc20的代币哈希，或用address(0)代表链原生币|
| uint256  | price | 支付的erc20代币数量，或链原生币数量|
| NftInfo  | nftInfo |  nft信息|
| uint256  | startTime | 订单的开始时间|
| uint256  | endTime| 订单的截止时间 |
| uint256  | changeRate  | 英式竞拍时加价的最低比例，荷式竞拍时每小时价格降低的比例|
| uint256  | minPrice| 荷式竞拍的最低价 |

## BidInfo
当前最高出价信息

|  数据类型   | 变量名  | 描述 |
|  ----  | ----  |  ---- |
| address  | bidder | 最高出价者地址|
| uint256  | price |  最高出价|

## NFTInfo
NFT详细信息

|  数据类型   | 变量名  | 描述 |
|  ----  | ----  |  ---- |
| NFTType  | nftType | nft类型，0：erc721，1：erc1155|
| address  | nftToken |  nft合约地址|
| uint256  | tokenId | nft的tokenId|
| uint256  | tokenAmount |  对于erc721型nft，该值为1|

# API

## 写方法

### **createOrder**
创建订单，包括创建直卖单、求购单、英式竞拍单，荷式竞拍单，集合求购单。


Parameters
-   `(uint256)`    订单类型，0: 直卖单；1:求购单；2:英式竞拍单；3: 荷式竞拍单；4：集合求购单
-   `(NFTType)`    nft类型，ERC721/ERC1155
-   `(address)`    交易的nft的合约哈希
-   `(uint256)`    nft的tokenId
-   `(uint256)`    token数量，对于ERC721型nft，该值为1
-   `(address)`    用于支付的erc20代币的合约哈希，或用address(0)代表链原生币
-   `(uint256)`    支付的erc20的数量，或链原生币数量
-   `(uint256)`    订单的有效期长度，单位：秒
-   `(uint256)`    英式竞拍单时，为最低加价比例；荷式竞拍单时，为每小时减价的比例
-   `(uint256)`    荷式竞拍的最低价

Returns
-   无

### **cancelOrder**
取消订单

注：当竞拍单有人出价时，订单不可取消

Parameters
-   `(uint256)`    订单编号Id

Returns
-   无

### **fulfillOrder**
完成订单

注：只能成交直卖单、求购单、荷式竞拍单、集合求购单

Parameters
-   `(uint256)`    订单编号Id
-   `(uint256)`    支付的erc20的金额，或链原生币数量
-   `(uint256)`    交易的nft tokenId

Returns
-   无

### **changeOrder**
修改订单信息

注：只能修改直卖单、求购单、集合求购单

Parameters
-   `(uint256)`    订单编号Id
-   `(uint256)`    支付的erc20的金额，或链原生币数量
-   `(uint256)`    订单的有效期，单位：秒

Returns
-   无

### **bid**
参与竞拍

注：只能用于英式竞拍

Parameters
-   `(uint256)`    订单编号Id
-   `(uint256)`    支付的erc20的金额，或链原生币数量

Returns
-   无

### **endOrder**
对于已过期订单，任意地址均可调用该方法彻底结束该订单

注：已有人出价的英式竞拍单，会将nft发给竞拍成功者

Parameters
-   `(uint256)`    订单编号Id

Returns
-   无

### **cancelAll**
取消所有订单，只有合约owner可调用

注：对于已过期且已有人出价的英式竞拍单，会将nft发给竞拍成功者

Parameters
-   无

Returns
-   无

## 读方法

### **name**

Parameters
-   无

Returns
-   `string` 合约名称

### **getTradeFeeRate**

Parameters
-   无

Returns
-   `uint256` 合约收取的手续费比例

### **getOrder**

Parameters
-   `uint256` 订单编号Id

Returns
-   `Order` 订单详情

### **getDutchPrice**

Parameters
-   `uint256` 订单编号Id

Returns
-   `uint256` 获取荷式竞拍单当前的竞拍价

### **getBidInfo**

Parameters
-   `uint256` 订单编号Id

Returns
-   `BidInfo` 当前最高出价信息

### **getOrdersByOwner**

Parameters
-   `address` 订单创建者地址

Returns
-   `Order[]` 创建的订单详情列表

### **getOrdersByNft**

Parameters
-   `address` nft合约哈希
-   `uint256` nft的tokenId

Returns
-   `Order[]` nft相关的订单详情列表


# 规则解释

## 手续费机制
市场会从买卖双方达成的交易中收取一定比例的手续费。

费率基数(rateBase)：10000，不可更改
费率系数(tradeFeeRate)：默认500，可设置范围0-2000，只有合约owner可更改
费率为tradeFeeRate/rateBase

## 加价/降价比例
创建英式和荷兰式拍卖时需指定加价/降价比例系数(changeRate)，其比例基数也是rateBase

## 版税机制
当支持ERC2981的nft合约达成交易时，会扣除相应的版税给该nft指定的版税接收者。

扣除条件：nft合约计算返回的版税金额不高于成交金额的一半。
若不满足条件，则直接不予扣除。

# 合约升级

## 首次部署
首先要在`hardhat.config.ts`中配置对应的网络，默认networks中有zksync测试网`zkSyncTestnet`和zksync的本地测试环境，配置到对应的网络的RPC参数和`accounts`里添加私钥后(使用第一个私钥)，`defaultNetwork`改为对应的网络名称。
```
yarn install # 安装依赖
yarn hardhat deploy-zksync # 部署到指定网络
```

## 合约升级
运行 `.\scripts\upgrade.ts` 首先修改里面的`Proxy`地址，运行后，脚本会自动重新部署Market合约并调用`Proxy`的`Upgrade`方法将实现合约更新为刚部署的Market合约地址。
```
yarn hardhat run scripts/upgrade.ts
```
