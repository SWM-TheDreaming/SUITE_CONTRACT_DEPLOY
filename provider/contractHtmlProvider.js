import { encodeImageToBase64 } from "../lib/funcs.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/**
 * memberEmailIdList's 0 Index must come host name/id
 */
export const contractHtmlProvider = (
  suiteRoomId,
  memberName,
  startDate,
  memberNameList,
  depositAmount,
  recruitStartDate,
  checkOutDate,
  minAttendanceRate,
  minMissionRate,
  txCode
) => {
  const backgroundLogoBase64 = encodeImageToBase64(
    path.join(__dirname, "../public/images/background-logo.png")
  );
  const sideLogoBase64 = encodeImageToBase64(
    path.join(__dirname, "../public/images/side-logo.png")
  );
  const copyImageBase64 = encodeImageToBase64(
    path.join(__dirname, "../public/images/copy.png")
  );
  const signImageBase64 = encodeImageToBase64(
    path.join(__dirname, "../public/images/sign.png")
  );

  return `<div style="width: 595px; height: 842px; position: relative; background: white;">
  <img style="left: 130px; top: 252px; position: absolute;" src="${backgroundLogoBase64}" />
  <div style="width: 252px; height: 17px; left: 58px; top: 35px; position: absolute; color: black; font-size: 24px; font-family: Inter; font-weight: 700; word-wrap: break-word">${suiteRoomId} 호실 </div>
  <div style="width: 484px; height: 24px; left: 58px; top: 73px; position: absolute; color: black; font-size: 18px; font-family: Inter; font-weight: 700; word-wrap: break-word">토익 스터디 모집합니다~! 열정을 다해서 하실 분 우대!!</div>
  <div style="width: 290px; height: 24px; left: 58px; top: 108px; position: absolute"><span style="color: black; font-size: 12px; font-family: Inter; font-weight: 400; word-wrap: break-word">란 곳에서 입주하신 </span><span style="color: black; font-size: 16px; font-family: Inter; font-weight: 700; word-wrap: break-word">${memberName}</span><span style="color: black; font-size: 12px; font-family: Inter; font-weight: 400; word-wrap: break-word"> 님.</span></div>
  <div style="width: 114px; height: 24px; left: 196px; top: 791px; position: absolute; color: black; font-size: 16px; font-family: Inter; font-weight: 700; word-wrap: break-word">The Dreaming: </div>
  <div style="width: 129px; height: 24px; left: 44px; top: 789px; position: absolute; color: black; font-size: 16px; font-family: Inter; font-weight: 700; word-wrap: break-word">${startDate}</div>
  <div style="width: 311px; height: 24px; left: 145px; top: 171px; position: absolute; color: black; font-size: 12px; font-family: Inter; font-weight: 400; word-wrap: break-word">스위트룸 체크인 서약서 및 보증금 계약서 내용 고지드립니다.</div>
  <div style="width: 336px; height: 158px; left: 58px; top: 416px; position: absolute">
    <span style="color: black; font-size: 12px; font-family: Inter; font-weight: bold; word-wrap: break-word">가. 호스트 ${
      memberNameList[0]
    } 의 스위트룸 개설 정보</span>
      <span style="color: black; font-size: 12px; font-family: Inter; font-weight: 400; word-wrap: break-word">
        <ul>
          <li>참여자: ${memberNameList.map((m) => m).join(", ")}${
    memberNameList[0]
  }</li>
          <li>스위트룸 규모: ${memberNameList.length}인실</li>
          <li>보증금액: ${depositAmount}원</li>
          <li>모집기간: ${recruitStartDate} - ${startDate}</li>
        </ul>
        <span style="color: black; font-size: 12px; font-family: Inter; font-weight: bold; word-wrap: break-word">
          나. 호스트 ${memberNameList[0]}의 스위트룸 보증금 환급 조건</span>
          <ul>
            <li>스위트룸 체크아웃: ${checkOutDate}</li>
            <li>최소 출석률: ${minAttendanceRate}%</li>
            <li>최소 미션 달성률: ${minMissionRate}%</li>
          </ul>  
        </div>
  <div style="width: 463px; height: 34px; left: 58px; top: 233px; position: absolute"><span style="color: black; font-size: 16px; font-family: Inter; font-weight: 700; word-wrap: break-word">고유 계약서 코드: </span><span style="color: black; font-size: 12px; font-family: Inter; font-weight: 400; word-wrap: break-word">${txCode}</span></div>
  <div style="width: 463px; height: 19px; left: 70px; top: 661.76px; position: absolute; transform: rotate(-10.19deg); transform-origin: 0 0; color: rgba(0, 0, 0, 0.20); font-size: 12px; font-family: Inter; font-weight: 400; word-wrap: break-word">${txCode}</div>
  <div style="width: 185px; height: 23px; left: 57px; top: 387px; position: absolute; color: black; font-size: 16px; font-family: Inter; font-weight: 700; word-wrap: break-word">스위트룸 보증금 환급 조건</div>
  <div style="width: 484px; left: 46px; top: 685px; position: absolute; color: black; font-size: 12px; font-family: Inter; font-weight: 700; word-wrap: break-word">본 사, The Dreaming, Suite는 보증금 미환급액에 대한 수익을 환급 조건을 달성한 입주자들과 <br/>동일한 위치에서 균등하게 분배하고, 환급 조건을 달성한 입주자들에게 보증금을 전액 환급함을 <br/>계약서에 약속합니다.</div>
  <div style="width: 484px; left: 47px; top: 609px; position: absolute; color: black; font-size: 12px; font-family: Inter; font-weight: 700; word-wrap: break-word">입주자 ${memberName}는 계약서의 명시된 보증금 반환 조건을 이해하였으며 <br/>사전 고지된 개설 정보를 확인했고 성실히 스위트룸에 참여할 것이며, <br/>조건 불충족시 미환급에 따른 보증금 상환액 반환 권리를 포기함을 계약서에 약속합니다.</div>
  <div style="width: 462px; height: 24px; left: 58px; top: 339px; position: absolute; color: black; font-size: 10px; font-family: Inter; font-weight: 400; word-wrap: break-word">*해당 코드를 통해 계약서의 원본 확인을 진행하실 수 있습니다. <br/><span style="font-weight: bold;">${txCode.slice(
    0,
    12
  )}</span> 를 복사해 앱 > 마이페이지 > 계약서 검색하기에 붙여넣어 계약서 변조 여부를 확인하세요!</div>
  <div style="width: 248px; height: 50px; left: 166px; top: 278px; position: absolute">
    <div style="width: 248px; height: 50px; left: 0px; top: 0px; position: absolute; background: white; border: 3px black solid"></div>
    <div style="width: 186px; height: 25px; left: 36px; top: 12px; position: absolute; color: black; font-size: 24px; font-family: Inter; font-weight: 400; word-wrap: break-word">${txCode.slice(
      0,
      12
    )}</div>
    <img style="left: 212px; top: 12px; position: absolute" src="${copyImageBase64}" />
  </div>
  <img style="left: 479px; top: 730px; position: absolute" src="${sideLogoBase64}" />
  <img style="left: 319px; top: 783px; position: absolute" src="${signImageBase64}" />
</div>

 `;
};
