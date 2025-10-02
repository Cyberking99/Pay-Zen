// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {Script, console} from "forge-std/Script.sol";
import "../lib/forge-std/src/console.sol";
import "../src/PaymentProcessor.sol";

contract DeployScript is Script {
    PaymentProcessor public paymentProcessor;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address usdcTokenAddress = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
        
        paymentProcessor = new PaymentProcessor(usdcTokenAddress);

        console.log("Contract Address: ", address(paymentProcessor));

        vm.stopBroadcast();
    }
}
