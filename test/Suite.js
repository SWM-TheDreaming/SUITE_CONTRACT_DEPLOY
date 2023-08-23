const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Suite", () => {
  let normalSuite;
  let weirdSuite;
  let owner;
  let hashedKey;

  const normalTransaction = async () => {
    await normalSuite.connect(owner).startSuiteRoom(
      hashedKey,
      "leader_id",
      "group_title",
      ["leader_id", "1", "2"],
      3,
      10000,
      5, // group_period in days
      30, // recruitment_period in days
      80,
      90
    );
  };

  const weirdTransaction = async () => {
    await weirdSuite.connect(owner).startSuiteRoom(
      hashedKey,
      "leader_id",
      "group_title",
      ["leader_id", "1", "2"],
      3,
      10000,
      0, // group_period in days
      0, // recruitment_period in days
      80,
      90
    );
  };

  before(async () => {
    [owner] = await ethers.getSigners();

    const Suite = await ethers.getContractFactory("SuiteContract1");
    normalSuite = await Suite.deploy("1");
    weirdSuite = await Suite.deploy("2");

    hashedKey =
      "suite-room-service의 pk와 title 의 합으로 해시값을 만들어 키로 사용합니다.";
  });

  it("스위트룸 시작하기 - startSuiteRoom: 스위트룸 시작에 따른 계약서 작성을 진행합니다.", async () => {
    await normalSuite.connect(owner).startSuiteRoom(
      hashedKey,
      "leader_id",
      "group_title",
      ["leader_id", "1", "2"],
      3,
      10000,
      5, // group_period in days
      30, // recruitment_period in days
      80,
      90
    );

    const groupContract = await normalSuite.getGroupContract(hashedKey);
    expect(groupContract.leader_id).to.equal("leader_id");
    expect(groupContract.group_title).to.equal("group_title");
  });

  it("스위트룸 시작하기 - startSuiteRoom: Existing Group Contract Hashed Key", async () => {
    try {
      await normalTransaction();
    } catch (e) {
      expect(e.message.split("'")[1]).to.equal(
        "Existing Group Contract Hashed Key"
      );
    }
  });

  it("스위트룸 종료하기 - stopSuiteRoom: 스위트룸 종료에 따른 평가/정산/shutdown/장부제공 을 실시합니다.", async () => {
    try {
      await weirdTransaction();
    } catch (e) {}

    await weirdSuite
      .connect(owner)
      .stopSuiteRoom(
        hashedKey,
        ["leader_id", "1", "2"],
        [100, 100, 30],
        [100, 100, 30]
      );
    const finalGroupDeposits = await weirdSuite.getFinalGroupDeposit(hashedKey);
    const expectedResult = finalGroupDeposits.some(
      (obj) => obj.deposit_amount == 13333
    );
    expect(finalGroupDeposits.length).to.equal(4);
    expect(expectedResult).to.be.true;
  });

  it("스위트룸 종료하기 - stopSuiteRoom: Non-existent Group Contract Hashed Key", async () => {
    try {
      await weirdSuite
        .connect(owner)
        .stopSuiteRoom(
          "weired_hashed_key",
          ["leader_id", "1", "2"],
          [100, 100, 30],
          [100, 100, 30]
        );
    } catch (e) {
      expect(e.message.split("'")[1]).to.equal(
        "Non-existent Group Contract Hashed Key"
      );
    }
  });

  it("스위트룸 종료하기 - stopSuiteRoom: Already Stopped Suite Room", async () => {
    try {
      await weirdSuite
        .connect(owner)
        .stopSuiteRoom(
          hashedKey,
          ["leader_id", "1", "2"],
          [100, 100, 30],
          [100, 100, 30]
        );
      await weirdSuite
        .connect(owner)
        .stopSuiteRoom(
          hashedKey,
          ["leader_id", "1", "2"],
          [100, 100, 30],
          [100, 100, 30]
        );
    } catch (e) {
      expect(e.message.split("'")[1]).to.equal("Already Stopped Suite Room");
    }
  });

  it("스위트룸 종료하기 - stopSuiteRoom: Study End Date not Reached", async () => {
    try {
      await normalSuite
        .connect(owner)
        .stopSuiteRoom(
          "weired_hashed_key",
          ["leader_id", "1", "2"],
          [100, 100, 30],
          [100, 100, 30]
        );
    } catch (e) {
      expect(e.message.split("'")[1]).to.equal(
        "Non-existent Group Contract Hashed Key"
      );
    }
  });
});
