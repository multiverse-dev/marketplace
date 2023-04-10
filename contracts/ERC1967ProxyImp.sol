// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./util/Ownable.sol";

contract ERC1967ProxyImp is ERC1967Proxy, Ownable {
    constructor(
        address _logic,
        bytes memory _data
    ) ERC1967Proxy(_logic, _data) Ownable() {}

    function Upgrade(address newImplementation) external onlyOwner {
        _upgradeTo(newImplementation);
    }

    function Implementation() external view returns (address) {
        return ERC1967Proxy._implementation();
    }
}
