// 텍스트 복사. 성공 여부 반환
// Clipboard API 는 https·localhost 전용 — http(폰에서 http://<맥 IP> 로 테스트 등)는 구식 execCommand 로 대체
export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard) return navigator.clipboard.writeText(text).then(() => true, () => false)

  // 하단 창(모달)이 열려 있으면 포커스가 창 밖으로 못 나가므로 창 안에 붙여서 선택
  const host = document.activeElement?.closest('[role="dialog"]') ?? document.body
  const el = document.createElement('textarea')
  el.value = text
  el.readOnly = true // 폰 키보드 안 뜨게
  el.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none'
  host.appendChild(el)
  el.select()
  el.setSelectionRange(0, text.length) // iOS 는 select() 만으로 선택 안 됨
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    el.remove()
  }
}
