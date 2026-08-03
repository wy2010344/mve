export async function clipboardGetText(): Promise<string | null> {
  try {
    if (navigator.clipboard?.readText) {
      return await navigator.clipboard.readText();
    }
  } catch (err) {
    console.error('读取剪贴板失败', err);
  }
  return null;
}

export async function clipboardSetText(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch (err) {
    console.error('写入剪贴板失败，回退到 execCommand', err);
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
}
