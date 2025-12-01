chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "search") {
    const query = encodeURIComponent(request.text);
    const searchUrl = `https://www.google.com/search?q=${query}`;
    chrome.tabs.create({ url: searchUrl });
  } else if (request.action === "translate") {
    chrome.storage.sync.get(
      [
        "geminiApiKey",
        "targetLanguage",
        "apiProvider",
        "apiEndpoint",
        "modelName",
      ],
      async (result) => {
        const geminiApiKey = result.geminiApiKey; // No default key
        const targetLanguage = result.targetLanguage || "ko";
        const apiProvider = result.apiProvider || "gemini";
        const modelName = result.modelName || "gemini-2.5-flash";

        let apiEndpoint = "";
        let requestBody = {};

        // Construct API Endpoint from Base URL
        let baseUrl = result.apiEndpoint;

        // Require Base URL
        if (!baseUrl) {
          sendResponse({
            error: "CONFIG_ERROR",
            message:
              "API Base URL이 설정되지 않았습니다. 확장 프로그램 옵션에서 설정해주세요.",
          });
          return;
        }

        // Remove trailing slash
        if (baseUrl.endsWith("/")) {
          baseUrl = baseUrl.slice(0, -1);
        }

        if (apiProvider === "openai") {
          // OpenAI Compatible logic
          if (baseUrl.includes("/chat/completions")) {
            apiEndpoint = baseUrl; // User provided full path
          } else {
            apiEndpoint = `${baseUrl}/v1/chat/completions`; // Auto-append path
          }

          requestBody = {
            model: modelName,
            messages: [
              {
                role: "system",
                content: `You are a professional translator. Translate the following text into natural ${targetLanguage}. Return ONLY the translated text.`,
              },
              { role: "user", content: request.text },
            ],
            temperature: 0.3,
          };
        } else {
          // Gemini API logic
          if (baseUrl.includes("generateContent")) {
            apiEndpoint = baseUrl; // User provided full path
          } else {
            apiEndpoint = `${baseUrl}/v1beta/models/${modelName}:generateContent`; // Auto-append path
          }

          // Add API Key to URL
          if (geminiApiKey) {
            if (apiEndpoint.includes("?")) {
              apiEndpoint += `&key=${geminiApiKey}`;
            } else {
              apiEndpoint += `?key=${geminiApiKey}`;
            }
          } else {
            // If no key, maybe it works without one (local proxy)?
            // But usually key is needed. Let's warn if missing but proceed to try.
            // Actually better to return error if key is missing for official API,
            // but for localhost it might be fine.
            // Let's just proceed, fetch will fail if key is needed.
          }

          requestBody = {
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Translate the following text into natural ${targetLanguage}. Return ONLY the translated text in JSON format with key "translated_text".\n\nText to translate:\n${request.text}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  translated_text: { type: "STRING" },
                },
              },
            },
          };
        }

        try {
          console.log(
            `Translating to ${targetLanguage} via ${apiEndpoint} (${apiProvider})`
          );

          const headers = {
            "Content-Type": "application/json",
          };

          if (apiProvider === "openai" && geminiApiKey) {
            headers["Authorization"] = `Bearer ${geminiApiKey}`;
          }

          const response = await fetch(apiEndpoint, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(requestBody),
          });

          const data = await response.json();
          console.log("API Response:", JSON.stringify(data, null, 2));

          if (response.ok) {
            let translatedText = "";

            if (apiProvider === "openai") {
              if (data.choices && data.choices.length > 0) {
                translatedText = data.choices[0].message.content;
              }
            } else {
              // Gemini parsing
              if (data.candidates && data.candidates.length > 0) {
                const candidate = data.candidates[0];
                let rawText = "";
                if (candidate.content && candidate.content.parts) {
                  rawText = candidate.content.parts.map((p) => p.text).join("");
                }
                try {
                  const parsedJson = JSON.parse(rawText);
                  translatedText = parsedJson.translated_text;
                } catch (e) {
                  translatedText = rawText;
                }
              }
            }

            if (translatedText) {
              sendResponse({ success: true, translatedText });
            } else {
              throw new Error("번역 결과가 비어있습니다.");
            }
          } else {
            const errorMsg =
              data.error?.message ||
              JSON.stringify(data.error) ||
              `API 오류 (Status: ${response.status})`;
            sendResponse({ error: "API_ERROR", message: errorMsg });
          }
        } catch (error) {
          console.error("Network or API call error:", error);
          sendResponse({
            error: "NETWORK_ERROR",
            message: `네트워크/API 오류: ${error.message}`,
          });
        }
      }
    );
    return true;
  }
});
