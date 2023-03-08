// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

//基本治理合約
import "@openzeppelin/contracts/governance/Governor.sol";
//治理設定
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
//計算票數
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
//與ERC20互動的合約
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
//設定投票法定人數
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
//設定等待間隔時間
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

contract GovernorContract is
  Governor,
  GovernorSettings,
  GovernorCountingSimple,
  GovernorVotes,
  GovernorVotesQuorumFraction,
  GovernorTimelockControl
{
  constructor(
    IVotes _token,
    TimelockController _timelock,
    uint256 _votingDelay,
    uint256 _votingPeriod,
    uint256 _quorumPercentage
  )
    Governor("GovernorContract")
    GovernorSettings(
      _votingDelay /* 1 block */,
      _votingPeriod /* 50400 blocks ~= 1 week */,
      0 /* 擁有多少個治理代幣才能建立proposal */
    )
    GovernorVotes(_token)
    GovernorVotesQuorumFraction(_quorumPercentage) /* 提案需通過多少%,才算通過 */
    GovernorTimelockControl(_timelock)
  {}

  // The following functions are overrides required by Solidity.

  //從GovernorSetting合約來的function,查看等待多少個區塊,該提案才能夠開始投票,目前在constructor中設定1 block
  function votingDelay() public view override(IGovernor, GovernorSettings) returns (uint256) {
    return super.votingDelay();
  }

  //從GovernorSetting合約來的function,查看一個提案的投票週期,目前在constructor中設定為50400個區塊,即1週(1區塊12秒)
  function votingPeriod() public view override(IGovernor, GovernorSettings) returns (uint256) {
    return super.votingPeriod();
  }

  //從GovernorVotesQuorumFraction來的function,查看需超過多少法定人數,此function回傳的是,
  //特定的區塊時間token的總供應量 * (已投票分子 / 法定人數分母,預設為100) = 提案得票%數
  function quorum(
    uint256 blockNumber
  ) public view override(IGovernor, GovernorVotesQuorumFraction) returns (uint256) {
    return super.quorum(blockNumber);
  }

  //查詢特定Proposal的狀態,是投票中,通過,還是等待執行,或是failed
  function state(
    uint256 proposalId
  ) public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
    return super.state(proposalId);
  }

  //此function在建立Proposal時被呼叫
  function propose(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description
  ) public override(Governor, IGovernor) returns (uint256) {
    return super.propose(targets, values, calldatas, description);
  }

  //查詢擁有多少個治理代幣才能建立Proposal
  function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
    return super.proposalThreshold();
  }

  //此function,在Proposal要執行時,被呼叫
  function _execute(
    uint256 proposalId,
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) internal override(Governor, GovernorTimelockControl) {
    super._execute(proposalId, targets, values, calldatas, descriptionHash);
  }

  //當Proposal被關閉時,會呼叫此function
  function _cancel(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
    return super._cancel(targets, values, calldatas, descriptionHash);
  }

  //查詢誰可以執行Proposal
  function _executor()
    internal
    view
    override(Governor, GovernorTimelockControl)
    returns (address)
  {
    return super._executor();
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view override(Governor, GovernorTimelockControl) returns (bool) {
    return super.supportsInterface(interfaceId);
  }
}
