const { ethers } = require("hardhat");
const { ADDRESS_ZERO } = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { log } = deployments;
  const { deployer } = await getNamedAccounts();

  //抓取合約
  const governanceToken = await ethers.getContract("GovernanceToken", deployer);
  const timeLock = await ethers.getContract("TimeLock", deployer);
  const governor = await ethers.getContract("GovernorContract", deployer);

  log("--------------------");
  log("Setting up contracts for roles...");

  //以下三行是呼叫timeLock合約所繼承的TimelockController,的public變數,
  //例如     bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
  //這三者都是經過keccak256的一串bytes32,輸出為: 0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1
  const proposerRole = await timeLock.PROPOSER_ROLE();
  const executorRole = await timeLock.EXECUTOR_ROLE();
  const adminRole = await timeLock.TIMELOCK_ADMIN_ROLE();

  //呼叫timeLock合約所繼承的TimelockController的grantRole,function,傳入bytes32,和治理合約地址
  //輸出為,_roles[proposerRole].members[governor.address] = true
  //只有治理合約能夠提案(只能透過呼叫治理合約的function,才能提出proposal)
  const proposerTx = await timeLock.grantRole(proposerRole, governor.address);
  await proposerTx.wait(1);
  //輸出為,_roles[executorRole].members[0x0000000] = true,
  //空地址代表所有人都可以執行,即提案通過之後,任何人都可以執行
  const executorTx = await timeLock.grantRole(executorRole, ADDRESS_ZERO);
  await executorTx.wait(1);
  //將deployer註銷adminRole,這樣deployer,就不能透過上述的grantRole,來賦予權限
  // grantRole,有著modifier： onlyRole(getRoleAdmin(role)
  const revokeTx = await timeLock.revokeRole(adminRole, deployer);
  await revokeTx.wait(1);

  //現在，timelock要做的任何事情都必須經過治理流程！
};

module.exports.tags = ["all", "setup"];
