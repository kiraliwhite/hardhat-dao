// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

//因為是投票用的治理代幣 因此繼承ERC20Vote
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract GovernanceToken is ERC20Votes {
  uint256 public s_maxSupply = 1000000000000000000000000;

  //ERC20Vote合約繼承自ERC20Permit合約,ERC20Permit合約繼承自ERC20, 這兩個都需要constructor
  constructor() ERC20("GovernanceToken", "GT") ERC20Permit("GovernanceToken") {
    _mint(msg.sender, s_maxSupply);
  }

  //這個function用意是 呼叫是ERC20Votes的function,使用super呼叫繼承合約的function
  //目的在於,當token轉移之後,也給予對應的投票權
  function _afterTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal override(ERC20Votes) {
    super._afterTokenTransfer(from, to, amount);
  }

  //使用super呼叫ERC20Vote的mint function
  function _mint(address to, uint256 amount) internal override(ERC20Votes) {
    super._mint(to, amount);
  }

  function _burn(address account, uint256 amount) internal override(ERC20Votes) {
    super._burn(account, amount);
  }

  //需要知道在不同的區塊時,每個用戶擁有多少個治理代幣
}
