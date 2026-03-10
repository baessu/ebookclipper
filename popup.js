const extractBtn = document.getElementById('extractBtn');
const statusEl = document.getElementById('status');
const previewEl = document.getElementById('preview');

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
