const extractBtn = document.getElementById('extractBtn');
const statusEl = document.getElementById('status');
const previewEl = document.getElementById('preview');
const pageBadge = document.getElementById('pageBadge');
const pageBadgeText = document.getElementById('pageBadgeText');
const guideToggle = document.getElementById('guideToggle');
const guideSteps = document.getElementById('guideSteps');

// 가이드 토글
guideToggle.addEventListener('click', () => {
  const isOpen = guideSteps.classList.toggle('show');
  guideToggle.classList.toggle('open', isOpen);
});

// 페이지 상태 감지
(async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab?.url || '';

    if (url.includes('millie.co.kr') && url.includes('highlights')) {
      pageBadge.className = 'page-badge on-millie';
      pageBadgeText.textContent = '하이라이트 페이지 감지됨';
    } else if (url.includes('millie.co.kr')) {
      pageBadge.className = 'page-badge on-millie';
      pageBadgeText.textContent = '밀리의 서재 — 하이라이트 탭으로 이동하세요';
      // 밀리 페이지이지만 하이라이트가 아닌 경우 가이드를 자동 펼침
      guideSteps.classList.add('show');
      guideToggle.classList.add('open');
    } else {
      pageBadge.className = 'page-badge off-millie';
      pageBadgeText.textContent = '밀리의 서재 페이지가 아닙니다';
      extractBtn.disabled = true;
      // 밀리 페이지가 아닌 경우 가이드를 자동 펼침
      guideSteps.classList.add('show');
      guideToggle.classList.add('open');
    }
  } catch {
    pageBadge.className = 'page-badge off-millie';
    pageBadgeText.textContent = '페이지를 확인할 수 없습니다';
  }
})();

// 추출 버튼
extractBtn.addEventListener('click', async () => {
  extractBtn.disabled = true;
  extractBtn.textContent = '추출 중...';
  statusEl.className = 'status';
  previewEl.style.display = 'none';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url || !tab.url.includes('millie.co.kr')) {
      showStatus('error', '밀리의 서재 페이지에서 실행해주세요.');
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractHighlightsFromPage
    });

    const result = results[0]?.result;

    if (!result || !result.success) {
      showStatus('error', '하이라이트를 찾을 수 없습니다. 하이라이트 페이지인지 확인해주세요.');
      return;
    }

    // 클립보드에 복사
    await navigator.clipboard.writeText(result.text);

    showStatus('success', `✓ ${result.count}개의 하이라이트를 클립보드에 복사했습니다!`);
    previewEl.textContent = result.text;
    previewEl.style.display = 'block';

    // 가이드가 열려있으면 닫기
    guideSteps.classList.remove('show');
    guideToggle.classList.remove('open');

  } catch (err) {
    console.error(err);
    showStatus('error', `오류 발생: ${err.message}`);
  } finally {
    extractBtn.disabled = false;
    extractBtn.textContent = '하이라이트 추출 & 복사';
  }
});

function showStatus(type, message) {
  statusEl.className = `status ${type}`;
  statusEl.textContent = message;
}

// 페이지에서 실행될 함수 (chrome.scripting.executeScript로 주입)
function extractHighlightsFromPage() {
  const highlightElements = document.querySelectorAll(
    'div[data-section-type="highlight_detail"] p[class^="styled__HighlightContent"]'
  );

  const highlightTexts = [];

  highlightElements.forEach(element => {
    const text = element.textContent.trim();
    if (text) {
      highlightTexts.push(text);
    }
  });

  if (highlightTexts.length === 0) {
    return { success: false, count: 0, text: '' };
  }

  const formattedText = highlightTexts.join('\n\n');
  return { success: true, count: highlightTexts.length, text: formattedText };
}
