// Helper to get selected text's bounding rectangle coordinates
export function getSelectionCoords() {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) {
    return null;
  }
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Consider scroll position
  return {
    x: rect.right + window.scrollX,
    y: rect.bottom + window.scrollY,
    width: rect.width,
    height: rect.height,
  };
}

// Adjust UI position to keep it within the viewport
export function adjustUIPosition(x, y, uiWidth, uiHeight) {
  let adjustedX = x;
  let adjustedY = y;

  // Check right boundary
  if (x + uiWidth > window.innerWidth + window.scrollX) {
    adjustedX = window.innerWidth + window.scrollX - uiWidth - 10; // 10px padding
  }
  // Check bottom boundary
  if (y + uiHeight > window.innerHeight + window.scrollY) {
    adjustedY = window.innerHeight + window.scrollY - uiHeight - 10; // 10px padding
  }
  // Check left boundary
  if (adjustedX < window.scrollX) {
    adjustedX = window.scrollX + 10; // 10px padding
  }
  // Check top boundary
  if (adjustedY < window.scrollY) {
    adjustedY = window.scrollY + 10; // 10px padding
  }

  // Ensure it's not off-screen completely if the UI is larger than the viewport
  if (uiWidth > window.innerWidth) {
    adjustedX = window.scrollX + 10;
  }
  if (uiHeight > window.innerHeight) {
    adjustedY = window.scrollY + 10;
  }

  return { x: adjustedX, y: adjustedY };
}
