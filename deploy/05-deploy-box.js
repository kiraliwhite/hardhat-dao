const { network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("--------------------");
  const box = await deploy("Box", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log("Verifying");
    await verify(box.address, []);
  }
  //抓取box合約
  const boxContract = await ethers.getContractAt("Box", box.address);
  //抓取timelock合約
  const timeLock = await ethers.getContract("TimeLock");
  //呼叫box合約所繼承Ownable合約的function,將合約owner轉移給timeLock合約
  const transferTx = await boxContract.transferOwnership(timeLock.address);
  await transferTx.wait(1);
};

module.exports.tags = ["all", "timelock"];
