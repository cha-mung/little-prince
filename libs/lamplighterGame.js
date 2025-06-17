// lampGame.js
let lampGameCallback = null;
let currentPhase = null; // 'day' or 'night'
let lampGameRunning = false;
let successCount = 0;
let timeoutHandle = null;

// 뒷 배경
const lampOverlay = document.createElement('div');
lampOverlay.id = 'lampOverlay';
lampOverlay.style.position = 'fixed';
lampOverlay.style.top = 0;
lampOverlay.style.left = 0;
lampOverlay.style.width = '100%';
lampOverlay.style.height = '100%';
lampOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
lampOverlay.style.zIndex = '9'; // UI 뒤쪽, 버튼보다 뒤
lampOverlay.style.display = 'none';
lampOverlay.style.pointerEvents = 'auto';
document.body.appendChild(lampOverlay);

// 게임 텍스트
const phaseText = document.createElement('div');
phaseText.id = 'lampPhase';
phaseText.style.position = 'absolute';
phaseText.style.top = '30%';
phaseText.style.left = '50%';
phaseText.style.transform = 'translate(-50%, -50%)';
phaseText.style.fontSize = '36px';
phaseText.style.color = '#ffffff';
phaseText.style.display = 'none';
phaseText.style.zIndex = '10';
phaseText.style.padding = '20px 40px';
phaseText.style.backgroundColor = 'rgba(255,255,255,0.1)';
phaseText.style.borderRadius = '12px';
phaseText.style.backdropFilter = 'blur(4px)';
phaseText.style.textAlign = 'center';
phaseText.style.pointerEvents = 'none';
document.body.appendChild(phaseText);

// 게임 버튼
const lampButton = document.createElement('button');
lampButton.id = 'lampBtn';
lampButton.style.position = 'absolute';
lampButton.style.top = '60%';
lampButton.style.left = '50%';
lampButton.style.transform = 'translate(-50%, -50%)';
lampButton.style.fontSize = '28px';
lampButton.style.padding = '20px 40px';
lampButton.style.zIndex = '10';
lampButton.style.display = 'none';
lampButton.style.border = 'none';
lampButton.style.borderRadius = '12px';
lampButton.style.backgroundColor = '#ffd966';
lampButton.style.color = '#000';
lampButton.style.cursor = 'pointer';
lampButton.style.boxShadow = '0 0 10px rgba(0,0,0,0.4)';
lampButton.style.pointerEvents = 'auto';
document.body.appendChild(lampButton);

lampButton.addEventListener('click', () => {
  if (!lampGameRunning) return;

  clearTimeout(timeoutHandle); // 타이머 정지
  lampGameRunning = false;

  const isCorrect = (currentPhase === 'night' && lampButton.textContent === '불 켜기') ||
                    (currentPhase === 'day' && lampButton.textContent === '불 끄기');

  if (isCorrect) {
    successCount++;
    showMessage('정답!');

    if (successCount >= 3) {
      showMessage('오늘 할 일 끝! 점등원과 대화하자', 1000, endLampGame);  // 정확히 4초 후에 종료
    } else {
      setTimeout(startLampPhase, 2000);
    }

  } else {
    successCount = 0;
    showMessage('실패! 처음부터 다시!');
    setTimeout(startLampPhase, 2000);
  }
});


// 콜백을 받아서 메시지 보여준 뒤 호출
function showMessage(text, duration = 1500, onDone = null) {
  phaseText.textContent = text;
  phaseText.style.display = 'block';

  setTimeout(() => {
    phaseText.style.display = 'none';
    if (onDone) onDone(); // 메시지 다 보인 후에 실행
  }, duration);
}

function startLampPhase() {
  lampGameRunning = true;
  currentPhase = Math.random() > 0.5 ? 'day' : 'night';
  phaseText.textContent = currentPhase === 'day' ? '해가 떴습니다!' : '해가 졌습니다!';
  lampButton.textContent = currentPhase === 'day' ? '불 끄기' : '불 켜기';
  phaseText.style.display = 'block';
  lampButton.style.display = 'block';

  timeoutHandle = setTimeout(() => {
    if (lampGameRunning) {
      lampGameRunning = false;
      successCount = 0;
      showMessage('너무 늦었어! 처음부터 다시!');
      setTimeout(startLampPhase, 2000);
    }
  }, 1000);
}


function endLampGame() {
  lampGameRunning = false;
  phaseText.style.display = 'none';
  lampButton.style.display = 'none';
  lampOverlay.style.display = 'none'; // 배경 비활성화
  if (lampGameCallback) lampGameCallback();
}

export function startLampMiniGame(onComplete) {
  successCount = 0;
  lampOverlay.style.display = 'block'; // 배경 활성화
  lampGameCallback = onComplete;
  startLampPhase();
}
