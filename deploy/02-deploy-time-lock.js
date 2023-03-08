const { network } = require("hardhat");
const { developmentChains, MIN_DELAY } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("--------------------");
  log(`DELAY: ${MIN_DELAY}`);
  const timeLock = await deploy("TimeLock", {
    from: deployer,
    /** * 在這裡我們可以在管理員角色中設置任何地址，也可以設置零地址。
     * 之前在教程中，部署者已授予管理員角色，然後也放棄了。
     * 在後面的部分中，我們通過將管理員角色授予部署者來做同樣的事情，
     * 然後放棄以保持教程不變。 */
    //    minDelay, proposers, executors, admin
    args: [MIN_DELAY, [], [], deployer],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log("Verifying");
    await verify(timeLock.address, []);
  }
};

module.exports.tags = ["all", "timelock"];
