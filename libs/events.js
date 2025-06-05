// 키보드 입력 처리
export function setupKeyboardInput(keyState) {
  window.addEventListener('keydown', (e) => keyState[e.key.toLowerCase()] = true);
  window.addEventListener('keyup', (e) => keyState[e.key.toLowerCase()] = false);
}

// 마우스 입력(좌표 변환) 처리
export function getNormalizedMouse(event, mouse) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}