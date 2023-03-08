const { ethers, network } = require("hardhat");
const {
  NEW_STORE_VALUE,
  FUNC,
  PROPOSAL_DESCRIPTION,
  developmentChains,
  MIN_DELAY,
} = require("../helper-hardhat-config");
const { moveTime } = require("../utils/move-time");
const { moveBlocks, sleep } = require("../utils/move-block");

async function queueAndExecute() {
  const args = [NEW_STORE_VALUE];
  const functionToCall = FUNC;
  const box = await ethers.getContract("Box");
  //使用calldata的方式呼叫box的function,使用的是encode過後的bytes32
  const encodedFunctionCall = box.interface.encodeFunctionData(functionToCall, args);
  //先將PROPOSAL_DESCRIPTION這個字串,轉為utf8 bytes陣列,
  /** Uint8Array(33) [
     80, 114, 111, 112, 111, 115,  97, 108,
     32,  35,  49,  58,  32,  83, 116, 111,
    114, 101,  32,  55,  55,  32, 105, 110,
     32, 116, 104, 101,  32,  66, 111, 120,
     33 ]
     */
  //在將這個陣列做hash,輸出為 0x4c73e6fcd223563db9504a4ce460caa4721de103875c319bf6ae6078d87b14c7
  const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(PROPOSAL_DESCRIPTION));
  //也可以只使用 ethers.utils.id 直接將字串做Hash,結果是一樣的
  //const descriptionHash = ethers.utils.id(PROPOSAL_DESCRIPTION);
  const governor = await ethers.getContract("GovernorContract");
  console.log("Queueing...");
  //呼叫governor合約的queue function, 輸入target目標合約地址, value, calldata, description
  const queueTx = await governor.queue([box.address], [0], [encodedFunctionCall], descriptionHash);
  await queueTx.wait(1);

  //如果在hardhat區塊鏈,則手動增加時間,先把proposal放到queue內,在等待一段時間之後,才執行,這個放到queue內等待的動作
  //是我們自己定義的,也可以提案通過後就直接執行,不放到queue中,取決於每個DAO自行定義的規則
  if (developmentChains.includes(network.name)) {
    //因為部署TimeLock合約時,有輸入constructor,MIN_DELAY為1小時,即提案通過後要等待一個小時,才能執行
    //在hardhat鏈上手動調快一個小時
    await moveTime(MIN_DELAY + 1);
    //並mine一個區塊
    await moveBlocks(1, (sleepAmount = 1000));
  } else {
    //如果在測試網,或是主網,則等待1小時+1秒
    const waitMillionSec = MIN_DELAY * 1000 + 1;
    await sleep(waitMillionSec);
  }

  //如果在測試網執行,需等待一個小時,因為上方的sleep
  console.log("Executing...");
  //時間過後,執行execute提案的交易
  const executeTx = await governor.execute(
    [box.address],
    [0],
    [encodedFunctionCall],
    descriptionHash
  );
  await executeTx.wait(1);
  //此時,因為提案的內容是,修改box合約內的值為77,因而輸出為77,代表提案通過後成功執行,並修改了box合約
  console.log(`Box value: ${await box.retrieve()}`);
}

queueAndExecute()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
