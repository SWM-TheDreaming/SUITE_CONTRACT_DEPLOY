// SPDX-License-Identifier: MIT
  pragma solidity ^0.8.18;
  
  
  /**
    * @title The suite despoit smart contract
    * @author lopahn2 / hwany9181@gmail.com
    * @notice Agent for deposit distributor
    */
  contract SuiteContract1 {
  
      //@notice 트랜젝션 요청자는 반드시 suite 관계자여야만 합니다.
      address _owner;
      string private SUITE = "SUITE";
      uint private CONTRACT_ID;
      
      //@notice 스위트룸 별 계약서 구조체
      struct GroupContract {
          string leader_id; 
          string group_title;  
          uint group_capacity; 
          uint group_deposit_per_person; 
          uint group_period;
          uint recruitment_period;
          uint minimum_attendance;
          uint minimum_mission_completion;
          bool isRunning;
          mapping(string => ParticipantDeposit) participantDeposits; //@key user-service의 member id 
          FinalGroupDeposit[] finalGroupDeposits;
      }
  
      //@notice 스위트룸 별 계약서 반환 구조체
      struct GroupContractDto {
          string leader_id; 
          string group_title;  
          uint group_capacity; 
          uint group_deposit_per_person; 
          uint group_period;
          uint recruitment_period;
          uint minimum_attendance;
          uint minimum_mission_completion;
          bool isRunning;
      }
  
      //@notice 스위트룸 참가자 별 보증금 구조체
      struct ParticipantDeposit {
          uint deposit_amount;
          uint payment_timestamp;
          bool kicked_flag;
      }
  
      //@notice 최종 정산 보증금 장부
      struct FinalGroupDeposit {
          string id;
          uint deposit_amount;
          uint payment_timestamp;
          bool kicked_flag;
      }
  
      constructor(uint contractId) {
          _owner = msg.sender;
          CONTRACT_ID = contractId;
      }
  
      //@notice suite 관계자 권한 확인
      modifier onlyOwner() {
          require(msg.sender == _owner, "Owner Authorization Required");
          _;
      }
  
      //@key suite-service pk id 와 suite-service-title 의 합 해시값
      mapping(string => GroupContract) public groupContracts;
      
      
      
      //@notice suite-service 의 스터디 시작 요청이 들어올 때 진입점
      function startSuiteRoom(
          string memory hashed_key,
          string memory leader_id,
          string memory group_title,  
          string[] memory participant_ids,
          uint group_capacity, 
          uint group_deposit_per_person,
          uint group_period,
          uint recruitment_period,
          uint minimum_attendance,
          uint minimum_mission_completion
      ) onlyOwner public {
          GroupContract storage groupContract = groupContracts[hashed_key];
          require(compareStrings(groupContract.leader_id, ""), "Existing Group Contract Hashed Key");
          
  
          for(uint i = 0; i < participant_ids.length; i++) {
              ParticipantDeposit storage participantDeposit = groupContract.participantDeposits[participant_ids[i]];
              initParticipantDeposit(participantDeposit, group_deposit_per_person);      
          }
          
  
          groupContract.leader_id = leader_id;
          groupContract.group_title = group_title;
          groupContract.group_capacity = group_capacity;
          groupContract.group_deposit_per_person = group_deposit_per_person;
          groupContract.group_period = block.timestamp + (group_period * 1 days);
          groupContract.recruitment_period = block.timestamp + (recruitment_period * 1 days);
          groupContract.minimum_attendance = minimum_attendance;
          groupContract.minimum_mission_completion = minimum_mission_completion;
          groupContract.isRunning = true;
  
      }
  
      
  
      function stopSuiteRoom(
          string memory hashed_key,
          string[] memory participant_ids,
          uint[] memory participant_mission,
          uint[] memory participant_attendance
      ) onlyOwner public returns(FinalGroupDeposit[] memory) {
          GroupContract storage groupContract = groupContracts[hashed_key];
          require(!compareStrings(groupContract.leader_id, ""), "Non-existent Group Contract Hashed Key");
          require(groupContract.isRunning, "Already Stopped Suite Room");
          require(groupContract.group_period <= block.timestamp, "Study End Date not Reached");
  
          uint totalRefundAmount = 0;
          uint payBackNum = groupContract.group_capacity;
  
          //@notice 보증금 반환 조건에 따른 참가자 평가
          for(uint i = 0; i < participant_ids.length; i++) {
              require(groupContract.participantDeposits[participant_ids[i]].payment_timestamp != 0, "Non-existent Participant Member Id");
              if(participant_mission[i] < groupContract.minimum_mission_completion || participant_attendance[i] < groupContract.minimum_attendance) {
                  totalRefundAmount += groupContract.participantDeposits[participant_ids[i]].deposit_amount;
                  
                  settleParticipantDeposit(groupContract, participant_ids, i);
                  
                  payBackNum -= 1;
              }
          }
  
          //@notice 평가 완료된 사용자들의 보증금 정산 결과 모든 사용자가 조건 미충족시
          if ( payBackNum == 0 ) {
              suiteTakesTheProfit(groupContract, totalRefundAmount);
          //@notice 평가 완료된 사용자들의 보증금 정산
          } else {
              uint devideAmount = totalRefundAmount /= (payBackNum + 1);
              for(uint i = 0; i < participant_ids.length; i++) {
                  if( groupContract.participantDeposits[participant_ids[i]].kicked_flag != true ) {
                      payBackParticipant(groupContract, participant_ids, devideAmount, i);
                  }
              }
  
              suiteTakesTheProfit(groupContract, devideAmount);
          }
  
          groupContract.isRunning = false;
  
          return(groupContract.finalGroupDeposits);
  
      }
  
      function getGroupContract(
          string memory hashed_key
      ) public view returns(GroupContractDto memory) {
          GroupContract storage groupContract = groupContracts[hashed_key];
          require(!compareStrings(groupContract.leader_id, ""), "Non-existent Group Contract Hashed Key");
  
          GroupContractDto memory gcd;
  
          gcd = GroupContractDto(
              {
                  leader_id: groupContract.leader_id,
                  group_title: groupContract.group_title,
                  group_capacity: groupContract.group_capacity,
                  group_deposit_per_person: groupContract.group_deposit_per_person,
                  group_period: groupContract.group_period,
                  recruitment_period: groupContract.recruitment_period,
                  minimum_attendance: groupContract.minimum_attendance,
                  minimum_mission_completion: groupContract.minimum_mission_completion,
                  isRunning: groupContract.isRunning
              }
          );
  
          return(gcd);
      }
  
      function getFinalGroupDeposit(
          string memory hashed_key
      ) public view returns(FinalGroupDeposit[] memory) {
          GroupContract storage groupContract = groupContracts[hashed_key];
          require(!compareStrings(groupContract.leader_id, ""), "Non-existent Group Contract Hashed Key");
  
          return(groupContract.finalGroupDeposits);
      }
  
  
  
  
  
      //@dev 내부 함수 선언 부분
      function compareStrings(
              string memory a, 
              string memory b
          ) private pure returns (bool) {
          return (keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b)));
      }
  
      function initParticipantDeposit(
          ParticipantDeposit storage pd,
          uint amount
      ) private {
          pd.deposit_amount = amount;
          pd.payment_timestamp = block.timestamp;
          pd.kicked_flag = false;
      }
  
      function settleParticipantDeposit(
              GroupContract storage groupContract,
              string[] memory participant_ids,
              uint idx
          ) private  {
          groupContract.participantDeposits[participant_ids[idx]].deposit_amount = 0;
          groupContract.participantDeposits[participant_ids[idx]].kicked_flag = true;
  
          FinalGroupDeposit memory fgd = FinalGroupDeposit(
              participant_ids[idx],
              0,
              block.timestamp,
              true
          );
  
          groupContract.finalGroupDeposits.push(fgd);
      }
  
      function payBackParticipant (
          GroupContract storage groupContract,
          string[] memory participant_ids,
          uint amount,
          uint idx
      ) private {
          FinalGroupDeposit memory fgd = FinalGroupDeposit(
              participant_ids[idx],
              groupContract.participantDeposits[participant_ids[idx]].deposit_amount + amount,
              block.timestamp,
              false
          );
  
          groupContract.finalGroupDeposits.push(fgd);
  
          groupContract.participantDeposits[participant_ids[idx]].deposit_amount = 0;
          groupContract.participantDeposits[participant_ids[idx]].payment_timestamp = block.timestamp;
      }
      
      function suiteTakesTheProfit(
          GroupContract storage groupContract,
          uint amount
      ) private  {
          FinalGroupDeposit memory fgd = FinalGroupDeposit(
              SUITE,
              amount,
              block.timestamp,
              false
          );
          groupContract.finalGroupDeposits.push(fgd);
      }
      
  
      
  }
  