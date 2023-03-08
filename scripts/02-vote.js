const fs = require("fs");
const { proposalsFile, developmentChains, VOTING_PERIOD } = require("../helper-hardhat-config");
const { getNamedAccounts, network, ethers } = require("hardhat");
const { moveBlocks, sleep } = require("../utils/move-block");

async function main() {
  const proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));
  //若有多個提案,則會有多個proposalId,儲存在JSON內的格式會是 { 31337 : "proposalId1", "proposalId2", "proposalId3..." }
  //所以用proposalIndex,的方式抓取對應的proposalId
  const proposalId = proposals[network.config.chainId].at(-1);
  //我們要定義,投票的類別, 0 = 反對, 1 = 同意, 2 = 棄權
  const voteWay = 1; // 同意票,所以是1
  const reason = "I like it hahahaha!"; //因為我們使用的是castVoteWithReason,所以投票者要寫原因

  await vote(proposalId, voteWay, reason);
}

async function vote(proposalId, voteWay, reason) {
  console.log("Voting...");
  //抓取治理合約
  const governor = await ethers.getContract("GovernorContract");

  //呼叫治理合約的castVoteWithReason,投票,輸入proposalId,同意票,投票原因
  const voteTxResponse = await governor.castVoteWithReason(proposalId, voteWay, reason);
  const voteTxReceipt = await voteTxResponse.wait(1);
  //顯示投票原因
  console.log(`Vote Reason: \n ${voteTxReceipt.events[0].args.reason}`);
  //抓取提案狀態
  const proposalState = await governor.state(proposalId);
  console.log(`Current Proposal State: ${proposalState}`);
  //顯示proposalDeadline的區塊
  const proposalDeadline = await governor.proposalDeadline(proposalId);
  console.log(`Proposal Deadline: ${proposalDeadline}`);

  //抓取deployer帳戶,因為所有票都已經delegate給deployer
  const { deployer } = await getNamedAccounts();
  //抓取區塊高度(此區塊是尚未mine的區塊高度)
  const blockNumber1 = await ethers.provider.getBlockNumber();
  //呼叫governor合約的getVotes,抓取票數,輸入帳戶,區塊高度
  const votes = await governor.getVotes(deployer, blockNumber1 - 1);
  //抓取deployer所投的票數,是1000000000000000000000000票
  console.log(`deployer Account votes: ${votes}`);

  //由於投完票了,如果在本地的hardhat區塊鏈,則手動mine區塊
  if (developmentChains.includes(network.name)) {
    await moveBlocks(VOTING_PERIOD + 1, (sleepAmount = 1000));
    //顯示mine完區塊之後的區塊高度
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`Now blockNumber: ${blockNumber}`);

    //顯示proposalState
    const proposalState2 = await governor.state(proposalId);
    console.log(`Current Proposal State: ${proposalState2}`);
  }

  console.log("Voted! Ready to go!");

  //** 額外說明 */
  //castVoteBySig: 依照簽名投票,適用於鏈下投票,(目前沒用到,我們使用的是castVoteWithReason)
  //該方法實現了一個meta-transaction，允許項目方補貼投票費用，選民可以免費生成一個簽名，然後項目方可以提交這些並支付 gas。
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
