export const certificatedHtmlProvider = (
  suiteRoomId,
  startTxCode,
  endTxCode,
  minMissionRate,
  minAttendanceRate,
  memberEmailId
) => {
  return `
  <div style="width: 842px; height: 595px; position: relative; background: rgba(5, 9, 83); overflow:hidden">
  <image style="left: 621px; top: 13px; position: absolute;" src="../public/images/main-logo.png"></image>  
  <image style="left: 58px; top: 13px; position: absolute; z-index: 10;" src="../public/images/string-logo.png"></image>  
  <img style="left: 492px; top: 407px; position: absolute;" src="../public/images/calendar.png" />
  <div style="width: 873px; height: 873px; left: -215px; top: -139px; position: absolute; background: white; border-radius: 9999px"></div>
  <div style="width: 873px; height: 873px; left: -212px; top: -124px; position: absolute; border-radius: 9999px; border: 4px #FFC763 solid"></div>
  <div style="width: 873px; height: 873px; left: -212px; top: -153px; position: absolute; border-radius: 9999px; border: 4px #FFC763 solid"></div>
  <img style="width: 126px; height: 127px; left: 702.91px; top: 283px; position: absolute; transform: rotate(5.38deg); transform-origin: 0 0; opacity: 0.80" src="../public/images/clap.png" />
  <div style="width: 374px; height: 17px; left: 58px; top: 70px; position: absolute; color: black; font-size: 24px; font-family: Inter; font-weight: 700; word-wrap: break-word">Study With Trust & Endeavor</div>
  <div style="width: 257px; height: 17px; left: 58px; top: 148px; position: absolute; color: black; font-size: 18px; font-family: Inter; font-weight: 700; word-wrap: break-word"><suite-room-id>${suiteRoomId} 호실 </div>
  <div style="width: 489px; height: 24px; left: 58px; top: 171px; position: absolute; color: black; font-size: 18px; font-family: Inter; font-weight: 700; word-wrap: break-word">토익 스터디 모집합니다~! 열정을 다해서 하실 분 우대!!</div>
  <div style="width: 468px; height: 19px; left: 58px; top: 536px; position: absolute"><span style="color: black; font-size: 12px; font-family: Inter; font-weight: 700; word-wrap: break-word">고유 계약서 코드: </span><span style="color: black; font-size: 10px; font-family: Inter; font-weight: 400; word-wrap: break-word">${startTxCode}</span></div>
  <div style="width: 468px; height: 19px; left: 58px; top: 555px; position: absolute"><span style="color: black; font-size: 12px; font-family: Inter; font-weight: 700; word-wrap: break-word">계약서 종료 코드: </span><span style="color: black; font-size: 10px; font-family: Inter; font-weight: 400; word-wrap: break-word">${endTxCode}</span></div>
  
  <image style="left: 131px; top: 217px; position: absolute;" src="../public/images/trophy.png"></image>
  
  <div style="width: 176px; height: 63px; left: 275px; top: 309px; position: absolute; background: #6BD9C0; border-radius: 10px"></div>
  <div style="width: 175px; height: 63px; left: 58px; top: 309px; position: absolute; background: #A38AE7; border-radius: 10px"></div>
  <div style="width: 163px; height: 44px; left: 78px; top: 320px; position: absolute"><span style="color: white; font-size: 24px; font-family: Inter; font-weight: 700; word-wrap: break-word">미션 : 100%<br/></span><span style="color: white; font-size: 12px; font-family: Inter; font-weight: 700; word-wrap: break-word">계약서상 미션 달성률 - ${minMissionRate}%</span></div>
  <div style="width: 163px; height: 44px; left: 296px; top: 320px; position: absolute"><span style="color: white; font-size: 24px; font-family: Inter; font-weight: 700; word-wrap: break-word">출석 : 100%<br/></span><span style="color: white; font-size: 12px; font-family: Inter; font-weight: 700; word-wrap: break-word">계약서상 출석률 - ${minAttendanceRate}%</span></div>
  <div style="width: 421px; height: 23px; left: 58px; top: 230px; position: absolute; color: black; font-size: 16px; font-family: Inter; font-weight: 700; word-wrap: break-word">${memberEmailId} 님, 성공적으로 체크아웃 하신 것을 축하드립니다.</div>
  <div style="width: 587px; height: 58px; left: 58px; top: 428px; position: absolute; color: black; font-size: 12px; font-family: Inter; font-weight: 700; word-wrap: break-word">스위트룸은 마음에 드셨나요? 고객님의 머무르시는 동안 편안함을 느끼셨기를 바랍니다. <br/><br/>진심을 보증합니다. 당신의 학습 파트너를 찾는 그 곳. <br/>Suite 올림.</div>
</div>`;
};
