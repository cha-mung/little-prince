// hover planet에 마우스가 올라갔을 때 툴팁을 보여주는 기능
export function setupTooltipHandler(raycaster, mouse, camera, tooltip, getTargetsFunc) {
  window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const allTargets = getTargetsFunc();
    const visibleTargets = allTargets.filter(t => t.object.visible);
    const intersected = raycaster.intersectObjects(visibleTargets.map(t => t.object), true);

    if (intersected.length > 0) {
      const intersectedObject = intersected[0].object;

      let matched = null;
      for (const { object, label } of visibleTargets) {
        let obj = intersectedObject;
        while (obj && obj !== object) {
          obj = obj.parent;
        }
        if (obj === object) {
          matched = label;
          break;
        }
      }

      if (matched) {
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY + 10}px`;
        tooltip.style.display = 'block';
        tooltip.textContent = matched;
        document.body.style.cursor = 'pointer';
        return;
      }
    }

    tooltip.style.display = 'none';
    document.body.style.cursor = 'default';
  });
}

