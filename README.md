# Orbit - Search & AI-Powered Translate Extension

**Orbit**은 웹 서핑 중 텍스트를 선택하면 즉각적인 검색과 번역 기능을 제공하는 크롬 확장 프로그램입니다. 웹 페이지의 흐름을 끊지 않고 마우스 커서 근처에 나타나는 직관적인 UI를 통해 생산성을 극대화합니다.

## ✨ Key Features (주요 기능)

- **Instant Access (즉각적인 접근):** 텍스트를 드래그하면 마우스 커서 바로 옆에 Orbit 아이콘이 나타납니다.
- **Smart Search (스마트 검색):** 선택한 텍스트를 새 탭에서 바로 구글 검색할 수 있습니다.
- **AI Translation (AI 번역):** Google Gemini 및 OpenAI Compatible 모델을 활용하여 자연스럽고 정확한 번역을 제공합니다.
- **Multi-Provider Support (멀티 모델 지원):**
  - **Google Gemini API:** `gemini-2.5-flash` 등 최신 모델 지원.
  - **OpenAI Compatible:** Local LLM (LM Studio, Ollama 등) 및 기타 OpenAI 호환 API 지원.
- **Non-intrusive UI (비침해적 UI):** Shadow DOM을 사용하여 웹 페이지의 스타일과 충돌하지 않으며, 입력 필드(Input/Textarea)에서는 자동으로 비활성화됩니다.
- **Enhanced UX (향상된 사용자 경험):**
  - 번역 중 로딩 애니메이션 제공.
  - 깔끔한 JSON 파싱을 통한 순수 번역 결과 출력.
  - 원클릭 복사 기능.
  - 툴팁 내부 클릭 시 닫힘 방지 등 디테일한 인터랙션 처리.

## 🛠️ Installation (설치 방법)

1.  이 저장소를 클론하거나 다운로드합니다.
2.  Chrome 브라우저 주소창에 `chrome://extensions`를 입력하여 이동합니다.
3.  우측 상단의 **'개발자 모드(Developer mode)'** 스위치를 켭니다.
4.  좌측 상단의 **'압축 해제된 확장 프로그램을 로드합니다(Load unpacked)'** 버튼을 클릭합니다.
5.  다운로드한 프로젝트 폴더(`orbit`)를 선택합니다.

## ⚙️ Configuration (설정)

1.  설치 후, Chrome 툴바의 **Orbit 아이콘**을 클릭하고 **'설정 열기 (Settings)'** 버튼을 누릅니다.
2.  **API Provider**를 선택합니다 (Google Gemini API 또는 OpenAI Compatible).
3.  **Base URL (기본 주소)**을 입력합니다.
    - Gemini Proxy (Local): `http://localhost:8800` (자동으로 경로 완성)
    - OpenAI / Local LLM: `http://localhost:1234` (자동으로 `/v1/chat/completions` 추가)
    - Google Official: `https://generativelanguage.googleapis.com`
4.  **API Key**를 입력합니다. (로컬 서버 사용 시 비워둘 수 있음)
5.  **Model Name**을 입력합니다. (예: `gemini-2.5-flash`, `gpt-4o`, `llama-3`)
6.  '설정 저장' 버튼을 누릅니다.

## 🚀 Usage (사용 방법)

1.  웹 페이지에서 번역하거나 검색하고 싶은 텍스트를 마우스로 드래그하여 선택합니다.
2.  마우스 커서 근처에 나타나는 **Orbit (파란색 원형)** 아이콘을 클릭합니다.
3.  하단에 펼쳐지는 메뉴에서 원하는 기능을 선택합니다:
    - **🔍 돋보기 아이콘:** 구글 검색 (새 탭)
    - **✨ 반짝이 아이콘:** AI 번역 (툴팁 표시)
4.  번역 결과 툴팁에서 '복사' 버튼을 눌러 내용을 클립보드에 저장하거나, '닫기' 버튼으로 창을 닫을 수 있습니다.

## 🏗️ Technical Stack (기술 스택)

- **Manifest V3:** 최신 Chrome Extension 표준 준수.
- **Vanilla JavaScript:** 가볍고 빠른 성능을 위해 프레임워크 없이 구현.
- **Shadow DOM:** 완벽한 스타일 격리(Style Isolation) 구현.
- **Dynamic API Integration:** 사용자 설정에 따른 유연한 API 엔드포인트 및 페이로드 구성.

## 📂 File Structure (파일 구조)

```
orbit/
├── manifest.json            # 확장 프로그램 설정
├── src/
│   ├── background.js        # 백그라운드 로직 (API 통신, 동적 엔드포인트 처리)
│   ├── content.js           # UI 렌더링, 이벤트 처리 (Shadow DOM)
│   ├── content.style.css    # UI 스타일
│   ├── popup.html           # 팝업 UI
│   ├── popup.js             # 팝업 로직
│   └── popup.css            # 팝업 스타일
├── options/                 # 설정 페이지 관련 파일들
│   ├── options.html
│   ├── options.js
│   └── options.css
├── icons/                   # 아이콘 이미지
└── README.md                # 프로젝트 문서
```

---

**Orbit** - Expand your exploration orbit.
