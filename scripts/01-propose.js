const { ethers, network } = require("hardhat");
const {
  NEW_STORE_VALUE,
  FUNC,
  PROPOSAL_DESCRIPTION,
  developmentChains,
  VOTING_DELAY,
  proposalsFile,
} = require("../helper-hardhat-config");
const { moveBlocks, sleep } = require("../utils/move-block");
const fs = require("fs");

async function propose(args, functionToCall, proposalDescription) {
  const governor = await ethers.getContract("GovernorContract");
  const box = await ethers.getContract("Box");
  //https://docs.ethers.org/v5/api/utils/abi/interface/
  // contract.interface.encodeFunctionData,會回傳一串 encoded data(bytes32格式),用於交易
  // 傳入參數functionToCall 因為要呼叫box合約的store function,因此functionToCall是字串"store",
  // args,則是要呼叫box.store function傳入的值,為數字77,這兩者會被encode成為bytes32
  // 輸出為0x6057361d000000000000000000000000000000000000000000000000000000000000004d
  const encodedFunctionCall = box.interface.encodeFunctionData(functionToCall, args);
  //console.log(encodedFunctionCall);
  console.log(`Proposing ${functionToCall} on ${box.address} with ${args}`);
  console.log(`Proposal Description: \n ${PROPOSAL_DESCRIPTION}`);

  //呼叫governor合約的propose提案,建立提案,這會產生一個建立proposal的transaction
  const proposeTx = await governor.propose(
    [box.address], //target
    [0], //value
    [encodedFunctionCall], //calldata
    proposalDescription //description
  );

  //由於我們有設定voting delay,為1 block,意味著建立proposal之後,要經過一個區塊,該提案才可以被投票
  //在hardhat區塊鏈中,我們可以mine一個區塊,使其大於voting_delay,意味著,經過此區塊後,提案就可以被投票
  if (developmentChains.includes(network.name)) {
    await moveBlocks(VOTING_DELAY + 1, (sleepAmount = 1000));
  }

  //當此proposal的transaction成功之後,此交易會觸發event,內含proposalId
  const proposeReceipt = await proposeTx.wait(1);

  //從transaction的event抓取proposalId
  const proposalId = proposeReceipt.events[0].args.proposalId.toString();
  console.log(`Proposed with proposal ID: \n ${proposalId}`);

  //抓取提案狀態
  const proposalState = await governor.state(proposalId);
  //抓取提案snapshot
  const proposalSnapShot = await governor.proposalSnapshot(proposalId);
  //抓取提案的截止日期
  const proposalDeadline = await governor.proposalDeadline(proposalId);
  storeProposalId(proposalId);

  // Proposal的狀態,定義在IGovernor合約內,
  // 0:Pending, 1:Active, 2:Canceled, 3:Defeated, 4:Succeeded, 5:Queued, 6:Expired, 7:Executed
  console.log(`Current Proposal State: ${proposalState}`);
  // 這個Proposal照快照時的區塊, 例如:14,則代表,此提案是在第14個區塊高度,拍下快照(內含投票數等資訊)
  console.log(`Current Proposal Snapshot: ${proposalSnapShot}`);
  // 該提案的截止日期(區塊高度)
  console.log(`Current Proposal Deadline: ${proposalDeadline}`);
}

//此function用意為,將取得的proposalId,存到json檔內
function storeProposalId(proposalId) {
  const chainId = network.config.chainId.toString();
  //讀取json檔
  let proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));
  // 如果檔案內有對應的chainId
  if (chainId in proposals) {
    //但是對應的chainId,不包含proposalId
    if (!proposals[chainId].includes(proposalId)) {
      //則將proposalId,寫在對應的chainId內
      proposals[chainId].push(proposalId);
    }
    //如果檔案沒有對應的chainId,則else
  } else {
    // 檔案準備寫入以下內容
    // {"31337":["20410873684195684007502903743313035195888380351590997192411449750453432545334"]}
    proposals[chainId] = [proposalId];
  }
  //抓取檔案,將上述拼湊好的proposals物件轉為JSON字串寫入
  fs.writeFileSync(proposalsFile, JSON.stringify(proposals));
  //此時proposalId已寫在proposals.json檔內
}

propose([NEW_STORE_VALUE], FUNC, PROPOSAL_DESCRIPTION)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
