const USERNAME_REGEX = /^[a-z0-9._]{1,30}$/;
const RESERVED = ["admin", "api", "auth", "settings", "messages", "feed", "post", "profile", "explore"];

export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username) return { valid: false, error: "Kullanıcı adı gerekli." };
  
  const lower = username.toLowerCase();
  
  if (lower.length < 1 || lower.length > 30) {
    return { valid: false, error: "Kullanıcı adı 1-30 karakter olmalı." };
  }
  
  if (!USERNAME_REGEX.test(lower)) {
    return { valid: false, error: "Sadece küçük harf, rakam, nokta ve alt çizgi kullanılabilir." };
  }
  
  if (lower.startsWith(".") || lower.endsWith(".")) {
    return { valid: false, error: "Kullanıcı adı nokta ile başlayamaz veya bitemez." };
  }
  
  if (lower.includes("..")) {
    return { valid: false, error: "Arka arkaya nokta kullanılamaz." };
  }
  
  if (RESERVED.includes(lower)) {
    return { valid: false, error: "Bu kullanıcı adı kullanılamaz." };
  }
  
  return { valid: true };
}
