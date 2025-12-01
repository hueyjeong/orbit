document.addEventListener("DOMContentLoaded", () => {
  const geminiApiKeyInput = document.getElementById("geminiApiKey");
  const targetLanguageSelect = document.getElementById("targetLanguage");
  const saveButton = document.getElementById("saveButton");
  const statusDiv = document.getElementById("status");

  const apiProviderRadios = document.getElementsByName("apiProvider");
  const apiEndpointInput = document.getElementById("apiEndpoint");
  const modelNameInput = document.getElementById("modelName");
  const endpointGroup = document.getElementById("endpointGroup");

  function toggleEndpointVisibility() {
    let selectedProvider = "gemini";
    for (const radio of apiProviderRadios) {
      if (radio.checked) {
        selectedProvider = radio.value;
        break;
      }
    }

    endpointGroup.style.display = "block";

    if (selectedProvider === "openai") {
      apiEndpointInput.placeholder = "https://api.openai.com"; // Official OpenAI Base URL
    } else {
      apiEndpointInput.placeholder =
        "https://generativelanguage.googleapis.com"; // Official Gemini Base URL
    }
  }

  apiProviderRadios.forEach((radio) => {
    radio.addEventListener("change", toggleEndpointVisibility);
  });

  chrome.storage.sync.get(
    [
      "geminiApiKey",
      "targetLanguage",
      "apiProvider",
      "apiEndpoint",
      "modelName",
    ],
    (result) => {
      if (result.geminiApiKey) {
        geminiApiKeyInput.value = result.geminiApiKey;
      }
      if (result.targetLanguage) {
        targetLanguageSelect.value = result.targetLanguage;
      }

      if (result.apiProvider) {
        for (const radio of apiProviderRadios) {
          if (radio.value === result.apiProvider) {
            radio.checked = true;
            break;
          }
        }
      }

      if (result.apiEndpoint) {
        apiEndpointInput.value = result.apiEndpoint;
      }

      if (result.modelName) {
        modelNameInput.value = result.modelName;
      } else {
        modelNameInput.value = "gemini-2.5-flash";
      }

      toggleEndpointVisibility();
    }
  );

  saveButton.addEventListener("click", () => {
    const geminiApiKey = geminiApiKeyInput.value;
    const targetLanguage = targetLanguageSelect.value;

    let apiProvider = "gemini";
    for (const radio of apiProviderRadios) {
      if (radio.checked) {
        apiProvider = radio.value;
        break;
      }
    }

    let apiEndpoint = apiEndpointInput.value.trim();
    if (apiEndpoint.endsWith("/")) {
      apiEndpoint = apiEndpoint.slice(0, -1);
    }

    const modelName = modelNameInput.value;

    chrome.storage.sync.set(
      {
        geminiApiKey,
        targetLanguage,
        apiProvider,
        apiEndpoint,
        modelName,
      },
      () => {
        statusDiv.textContent = "설정이 저장되었습니다!";
        statusDiv.style.color = "green";
        setTimeout(() => {
          statusDiv.textContent = "";
        }, 2000);
      }
    );
  });
});
