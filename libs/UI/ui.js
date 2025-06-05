// hover planet에 마우스가 올라갔을 때 툴팁을 보여주는 기능
export function setupPlanetTooltip(raycaster, mouse, planetMeshes, tooltip, camera) {
  window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera); // camera는 main.js에서 import해서 넘겨줘야 함
    const intersects = raycaster.intersectObjects(planetMeshes.filter(p => p.visible));

    if (intersects.length > 0) {
      const planet = intersects[0].object;
      tooltip.style.left = `${event.clientX + 10}px`;
      tooltip.style.top = `${event.clientY + 10}px`;
      tooltip.style.display = 'block';
      tooltip.textContent = planet.userData.name;
    } else {
      tooltip.style.display = 'none';
    }
  });
}

