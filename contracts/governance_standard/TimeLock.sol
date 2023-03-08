// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/governance/TimelockController.sol";

contract TimeLock is TimelockController {
  // minDelay: 當提案通過時,需等待多久才能執行
  // proposers: 這是一個陣列,指的是哪些地址可以建立Proposal
  // executors: 這是一個陣列,指的是哪些地指可以執行Proposal
  // admin: 被授予管理員角色的可選帳戶；禁用零地址,這個帳戶用作初始化,隨後會被棄用,改為由TimeLock合約管理
  /** admin 可以在部署後協助角色的初始配置而不會受到延遲，
   * 但隨後應放棄此角色以透過 timelocke proposals進行管理。
   * 該合約的先前版本會自動將此admin分配給部署者，並且也應該放棄。 */

  constructor(
    uint256 minDelay,
    address[] memory proposers,
    address[] memory executors,
    address admin
  ) TimelockController(minDelay, proposers, executors, admin) {}
}
