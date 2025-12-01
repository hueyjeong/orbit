(function () {
  console.log("Orbit Content Script Loaded"); // Debug Log

  // --- Utility Functions ---
  function getSelectionCoords() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) {
      return null;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    return {
      x: rect.right,
      y: rect.bottom,
      width: rect.width,
      height: rect.height,
    };
  }

  function adjustUIPosition(x, y, uiWidth, uiHeight) {
    let adjustedX = x;
    let adjustedY = y;

    // Shift position relative to cursor to avoid overlap
    // Move slightly down and right
    adjustedX += 15;
    adjustedY += 20;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Simple boundary checks
    if (adjustedX + uiWidth > viewportWidth) {
      // If overflow right, show on left of cursor
      adjustedX = x - uiWidth - 10;
    }
    if (adjustedY + uiHeight > viewportHeight) {
      // If overflow bottom, show above cursor
      adjustedY = y - uiHeight - 10;
    }

    // Ensure positive
    adjustedX = Math.max(0, adjustedX);
    adjustedY = Math.max(0, adjustedY);

    return { x: adjustedX, y: adjustedY };
  }
  // --- End Utility Functions ---

  let shadowRoot = null;
  let orbitHost = null;
  let orbitMainContainer = null;
  let orbitMainMenu = null;
  let orbitSubMenu = null;
  let orbitTooltip = null;
  let currentSelectionText = "";
  let isSubMenuOpen = false;
  let tooltipTimeout = null;

  // 1. Setup Shadow DOM (Singleton Pattern)
  async function setupShadowRoot() {
    if (shadowRoot) return;

    console.log("Setting up Orbit Shadow DOM...");

    orbitHost = document.createElement("div");
    orbitHost.id = "orbit-extension-host";
    orbitHost.style.position = "fixed";
    orbitHost.style.zIndex = "2147483647";
    orbitHost.style.display = "none";
    // Reset box model
    orbitHost.style.width = "0";
    orbitHost.style.height = "0";
    orbitHost.style.overflow = "visible";

    document.body.appendChild(orbitHost);

    shadowRoot = orbitHost.attachShadow({ mode: "open" });

    try {
      const styleUrl = chrome.runtime.getURL("src/content.style.css");
      const response = await fetch(styleUrl);
      const cssText = await response.text();
      const styleElement = document.createElement("style");
      styleElement.textContent = cssText;
      shadowRoot.appendChild(styleElement);
    } catch (error) {
      console.error("Failed to load Orbit styles:", error);
      // Fallback
      const styleElement = document.createElement("style");
      styleElement.textContent = `
                #orbit-main-container { position: absolute; top:0; left:0; z-index: 2147483647; display: flex; flex-direction: column; align-items: center; }
                .orbit-main-icon { width: 44px; height: 44px; background: #007bff; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
                .orbit-sub-menu { display: none; gap: 10px; margin-top: 10px; }
                .orbit-sub-menu.open { display: flex; }
                .orbit-sub-icon { width: 40px; height: 40px; background: #6c757d; border-radius: 50%; cursor: pointer; }
            `;
      shadowRoot.appendChild(styleElement);
    }

    orbitMainContainer = document.createElement("div");
    orbitMainContainer.id = "orbit-main-container";
    shadowRoot.appendChild(orbitMainContainer);

    renderOrbitUI();
  }

  function renderOrbitUI() {
    orbitMainContainer.innerHTML = `
            <div class="orbit-main-icon" id="orbit-main-menu">Orbit</div>
            <div class="orbit-sub-menu" id="orbit-sub-menu">
                <div class="orbit-sub-icon search" id="orbit-search-icon" title="Google AI 검색"></div>
                <div class="orbit-sub-icon translate" id="orbit-translate-icon" title="Gemini 번역"></div>
            </div>
            <div class="orbit-tooltip" id="orbit-tooltip" style="display: none;">
                <div id="orbit-tooltip-content"></div>
                <div class="orbit-tooltip-buttons">
                    <button class="orbit-tooltip-button" id="orbit-copy-button">복사</button>
                    <button class="orbit-tooltip-button" id="orbit-close-button">닫기</button>
                </div>
            </div>
        `;

    orbitMainMenu = shadowRoot.getElementById("orbit-main-menu");
    orbitSubMenu = shadowRoot.getElementById("orbit-sub-menu");
    orbitTooltip = shadowRoot.getElementById("orbit-tooltip");
    const tooltipContent = shadowRoot.getElementById("orbit-tooltip-content");
    const searchIcon = shadowRoot.getElementById("orbit-search-icon");
    const translateIcon = shadowRoot.getElementById("orbit-translate-icon");
    const copyButton = shadowRoot.getElementById("orbit-copy-button");
    const closeButton = shadowRoot.getElementById("orbit-close-button");

    // Use mousedown for main interaction to prevent conflict with document mousedown
    orbitMainMenu.addEventListener("mousedown", (e) => {
      console.log("Main Menu MouseDown");
      e.stopPropagation();
      e.preventDefault(); // Prevent selection clear
      toggleSubMenu();
    });

    searchIcon.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      e.preventDefault();
      handleSearch();
    });
    translateIcon.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      e.preventDefault();
      handleTranslate();
    });

    // Tooltip buttons can use click
    copyButton.addEventListener("click", (e) => {
      e.stopPropagation();
      copyTranslatedText();
    });
    closeButton.addEventListener("click", (e) => {
      e.stopPropagation();
      hideTooltip();
    });

    // Stop propagation on container to prevent document mousedown from hiding it
    orbitMainContainer.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });
    orbitMainContainer.addEventListener("mouseup", (e) => {
      e.stopPropagation();
    });

    // SUPER IMPORTANT: Prevent ALL events on tooltip to stop closing
    const stopPropagation = (e) => e.stopPropagation();

    orbitTooltip.addEventListener("mousedown", stopPropagation);
    orbitTooltip.addEventListener("mouseup", stopPropagation);
    orbitTooltip.addEventListener("click", stopPropagation);

    tooltipContent.addEventListener("mousedown", stopPropagation);
    tooltipContent.addEventListener("mouseup", stopPropagation);
    tooltipContent.addEventListener("click", stopPropagation);
  }

  function toggleSubMenu() {
    console.log("Toggling sub menu");
    isSubMenuOpen = !isSubMenuOpen;
    if (isSubMenuOpen) {
      orbitSubMenu.classList.add("open");
    } else {
      orbitSubMenu.classList.remove("open");
    }
  }

  function hideOrbitUI() {
    if (orbitHost) {
      orbitHost.style.display = "none";
      isSubMenuOpen = false;
      if (orbitSubMenu) {
        orbitSubMenu.classList.remove("open");
      }
      hideTooltip();
    }
  }

  function updateOrbitUIPosition(x, y) {
    if (!orbitHost) return;

    const mainIconSize = 44; // Updated size
    const subMenuHeight = isSubMenuOpen ? 60 : 0; // Approximate height of sub menu
    const uiWidth = mainIconSize + 20;
    const uiHeight = mainIconSize + subMenuHeight + 20;

    const adjustedPos = adjustUIPosition(x, y, uiWidth, uiHeight);
    console.log(`Positioning UI at: x=${adjustedPos.x}, y=${adjustedPos.y}`);

    // Set position directly
    orbitHost.style.left = `${adjustedPos.x}px`;
    orbitHost.style.top = `${adjustedPos.y}px`;
  }

  function showTooltip(content, x, y) {
    clearTimeout(tooltipTimeout);
    const tooltipContent = shadowRoot.getElementById("orbit-tooltip-content");
    tooltipContent.innerHTML = content;

    orbitTooltip.style.display = "block"; // Ensure it's rendered
    orbitTooltip.style.position = "absolute";
    // Tooltip relative to the main container
    orbitTooltip.style.top = "60px";
    orbitTooltip.style.left = "0px";

    // Use requestAnimationFrame to allow display:block to take effect before transition
    requestAnimationFrame(() => {
      orbitTooltip.classList.add("show");
    });

    // Add listener to dismiss when clicking outside
    document.addEventListener("mousedown", dismissTooltipOutside, {
      once: true,
    });
  }

  function hideTooltip() {
    clearTimeout(tooltipTimeout);
    if (orbitTooltip) {
      orbitTooltip.classList.remove("show");
      // Delay setting display:none to allow transition to finish
      setTimeout(() => {
        if (!orbitTooltip.classList.contains("show")) {
          orbitTooltip.style.display = "none";
        }
      }, 300); // Match CSS transition duration
    }
    document.removeEventListener("mousedown", dismissTooltipOutside);
  }

  function dismissTooltipOutside(event) {
    if (!orbitTooltip || !shadowRoot) return;

    const path = event.composedPath();

    // Improved check: Check if the click target is inside the tooltip
    const isClickInside = path.some((el) => {
      return (
        el === orbitTooltip || (el instanceof Node && orbitTooltip.contains(el))
      );
    });

    if (!isClickInside) {
      hideTooltip();
    } else {
      // Re-add listener if click was inside tooltip
      document.addEventListener("mousedown", dismissTooltipOutside, {
        once: true,
      });
    }
  }

  // Listen for text selection
  document.addEventListener("mouseup", async (event) => {
    // 1. Check if the mouseup happened inside our UI
    if (orbitHost && shadowRoot) {
      const path = event.composedPath();
      const isInsideUI = path.some((el) => {
        return (
          el === orbitHost || (el instanceof Node && shadowRoot.contains(el))
        );
      });
      if (isInsideUI) return; // Do nothing if clicked inside UI
    }

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    const activeElement = document.activeElement;
    const isInsideInputOrTextarea =
      activeElement &&
      (activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA") &&
      activeElement === event.target;

    if (isInsideInputOrTextarea) {
      hideOrbitUI();
      currentSelectionText = "";
      return;
    }

    if (selectedText.length > 0 && selectedText.length < 2000) {
      currentSelectionText = selectedText;

      // Use mouse coordinates instead of selection bounding rect
      // This puts the UI right next to the cursor
      const mouseX = event.clientX;
      const mouseY = event.clientY;

      if (mouseX && mouseY) {
        await setupShadowRoot();
        updateOrbitUIPosition(mouseX, mouseY);

        orbitHost.style.display = "block";
        console.log("Orbit UI shown at cursor", mouseX, mouseY);
      }
    } else {
      hideOrbitUI();
    }
  });

  // Global mousedown to hide UI when clicking outside
  document.addEventListener("mousedown", (event) => {
    // If we click inside the Orbit UI, e.stopPropagation() in the UI elements
    // should prevent this listener from triggering for UI clicks.

    if (event.target === orbitHost) {
      return;
    }

    if (orbitHost && orbitHost.style.display !== "none") {
      // This will be triggered if stopPropagation didn't work
      // or if the click was truly outside
      // We rely on dismissTooltipOutside for the tooltip specifically,
      // but for the main icon/menu, we handle it here.

      // Check path again just to be safe
      const path = event.composedPath();
      const isInsideUI = path.some((el) => {
        return (
          el === orbitHost ||
          (shadowRoot && el instanceof Node && shadowRoot.contains(el))
        );
      });

      if (!isInsideUI) {
        hideOrbitUI();
      }
    }
  });

  document.addEventListener("selectionchange", () => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) {
      // Only hide if we are NOT interacting with the tooltip
      // But detecting "interaction" is hard.
      // If tooltip is open, maybe we shouldn't hide on selection clear?
      // Because copying text inside tooltip clears main selection.

      // Let's check if tooltip is open
      if (orbitTooltip && orbitTooltip.classList.contains("show")) {
        return; // Don't hide if tooltip is showing
      }

      hideOrbitUI();
      currentSelectionText = "";
    }
  });

  function handleSearch() {
    if (currentSelectionText) {
      chrome.runtime.sendMessage({
        action: "search",
        text: currentSelectionText,
      });
    }
    hideOrbitUI();
  }

  async function handleTranslate() {
    toggleSubMenu();

    // Show loading tooltip immediately with spinner
    showTooltip(
      '<div style="display:flex; align-items:center; gap:10px;"><span>번역 중...</span><div class="orbit-spinner" style="width:16px; height:16px; border:2px solid #f3f3f3; border-top:2px solid #3498db; border-radius:50%; animation:orbit-spin 1s linear infinite;"></div></div>',
      0,
      0
    );

    // Inject keyframes if needed
    if (shadowRoot && !shadowRoot.getElementById("orbit-spinner-style")) {
      const style = document.createElement("style");
      style.id = "orbit-spinner-style";
      style.textContent =
        "@keyframes orbit-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }";
      shadowRoot.appendChild(style);
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: "translate",
        text: currentSelectionText,
      });

      if (response.success) {
        showTooltip(response.translatedText, 0, 0);
      } else {
        let errorMessage = "번역 중 알 수 없는 오류 발생.";
        if (response.error === "API_KEY_MISSING") {
          errorMessage = `${response.message} <a href="${chrome.runtime.getURL(
            "options/options.html"
          )}" target="_blank">설정 페이지</a>`;
        } else if (response.message) {
          errorMessage = response.message;
        }
        showTooltip(`<span style="color: red;">${errorMessage}</span>`, 0, 0);
      }
    } catch (error) {
      console.error("Translate message failed:", error);

      let userMsg = "네트워크 오류 또는 서비스 워커 응답 실패.";
      if (error.message.includes("Extension context invalidated")) {
        userMsg =
          "확장 프로그램이 업데이트되었습니다. <b>페이지를 새로고침</b>해주세요.";
      }

      showTooltip(`<span style="color: red;">${userMsg}</span>`, 0, 0);
    } finally {
      // orbitMainMenu.textContent = 'Orbit';
    }
  }

  function copyTranslatedText() {
    const tooltipContent = shadowRoot.getElementById(
      "orbit-tooltip-content"
    ).textContent;
    const copyButton = shadowRoot.getElementById("orbit-copy-button");

    navigator.clipboard
      .writeText(tooltipContent)
      .then(() => {
        const originalText = copyButton.textContent;
        copyButton.textContent = "복사됨!";
        copyButton.style.backgroundColor = "#28a745";
        setTimeout(() => {
          copyButton.textContent = originalText;
          copyButton.style.backgroundColor = "";
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text:", err);
      });
  }
})();
