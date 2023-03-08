const { network, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("--------------------");
  const governanceToken = await deploy("GovernanceToken", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log("Verifying");
    await verify(governanceToken.address, []);
  }
  log(`Delegating to ${deployer}`);
  //上述只是部署完成治理代幣,且鑄造所有代幣,但這些代幣並沒有投票權,所以需要呼叫delegate function,賦予投票權
  //呼叫delegate function,傳入治理代幣地址,deployer地址
  await delegate(governanceToken.address, deployer);
  log("Delegated!");
};

//此function用意為將特定地址作為delegate委託對象,由於治理代幣合約GovernanceToken的constructor只寫了_mint所有的治理代幣
//但該代幣並沒有投票權,因此呼叫delegate function賦予代幣投票權(代幣並未轉移,因為是自己委託給自己)
const delegate = async (governanceTokenAddress, delegatedAccount) => {
  //使用getContractAt(abi,地址)獲取合約
  const governanceToken = await ethers.getContractAt("GovernanceToken", governanceTokenAddress);
  //呼叫治理代幣合約的delegate function
  const transactionResponse = await governanceToken.delegate(delegatedAccount);
  await transactionResponse.wait(1);
  //這裡的numCheckpoints,指的是在特定區塊時,該帳戶所擁有的voting power,假設在區塊高度9973時,該帳戶被delegate了,
  //則該帳戶擁有與治理代幣相同數量的投票權,使用checkpoint,而不是檢查每一個區塊時的每一個帳戶的投票權,更會節省Gas
  //只有當帳戶被delegate,或是委託給別人投票權時,checkpoint才會更新
  //另一方面,如果checkpoint = 0 代表投票權尚未轉移,也就是根本沒有delegate過
  console.log(`Checkpoints: ${await governanceToken.numCheckpoints(delegatedAccount)}`);
};

module.exports.tags = ["all", "governor"];
