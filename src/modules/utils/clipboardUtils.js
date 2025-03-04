/**
 * 텍스트를 클립보드에 복사하는 유틸리티 함수
 * @param {string} text - 복사할 텍스트
 * @returns {Promise<boolean>} - 복사 성공 여부
 */
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      // 보안 컨텍스트에서 Clipboard API 사용
      await navigator.clipboard.writeText(text);
    } else {
      // 대체 방법 (레거시 방식)
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // 화면 밖으로 위치시키기
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      
      // 복사 명령 실행
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (!success) {
        throw new Error('복사에 실패했습니다');
      }
    }
    
    return true;
  } catch (err) {
    console.error('클립보드 복사 중 오류 발생:', err);
    return false;
  }
};

/**
 * 텍스트 복사 후 사용자에게 알림 표시
 * @param {string} text - 복사할 텍스트
 * @param {string} message - 표시할 메시지 (기본값: '복사되었습니다')
 */
export const copyWithNotification = async (text, message = '복사되었습니다') => {
  const success = await copyToClipboard(text);
  
  if (success) {
    // 알림 표시 (토스트 메시지 등으로 대체 가능)
    alert(message);
  } else {
    alert('복사에 실패했습니다');
  }
  
  return success;
};
