// Topluluk kurallarına aykırı (küfür, hakaret, aşağılama ve zararlı) kelimeleri denetleyen yardımcı modül

const BANNED_WORDS = [
  'aptal',
  'salak',
  'gerizekalı',
  'gerizekali',
  'embesil',
  'ahmak',
  'beyinsiz',
  'şerefsiz',
  'serefsiz',
  'haysiyetsiz',
  'ahlaksız',
  'ahlaksiz',
  'pislik',
  'köpek',
  'kopek',
  'lanet',
  'defol',
  'sahtekar',
  'dolandırıcı',
  'dolandirici',
  'amk',
  'aq',
  'oç',
  'oc',
  'piç',
  'pic',
  'sikik',
  'siktir',
  'yavşak',
  'yavsak',
  'göt',
  'got',
  'orospu',
  'kahpe',
  'pezevenk',
  'puşt',
  'pust',
];

export function checkContentModeration(text: string): {
  isClean: boolean;
  reason?: string;
} {
  if (!text) return { isClean: true };

  // Zararlı script / XSS / SVG data URL denemesi kontrolü
  if (
    /<script\b[^>]*>([\s\S]*?)<\/script>/gim.test(text) ||
    /javascript:/i.test(text) ||
    /vbscript:/i.test(text) ||
    /data:text\/html/i.test(text) ||
    /data:image\/svg/i.test(text)
  ) {
    return {
      isClean: false,
      reason: 'İçeriğinizde güvenlik açısından izin verilmeyen kod veya bağlantı tespit edildi.',
    };
  }

  // Güvenli base64 görsel verilerini kelime filtrelemesinden önce çıkar (base64 dizilimlerinin yanlışlıkla yasaklı kelime eşleşmesi üretmesini önler)
  const textWithoutSafeImages = text.replace(
    /data:image\/(?:png|jpeg|jpg|webp|gif);base64,[a-zA-Z0-9+/=\s]+/gi,
    ' '
  );

  const normalized = textWithoutSafeImages
    .toLowerCase()
    .replace(/[\-.,!?;:()"'`~_*#\[\]{}/\\]/g, ' ');

  const words = normalized.split(/\s+/).filter(Boolean);

  for (const banned of BANNED_WORDS) {
    if (words.includes(banned)) {
      return {
        isClean: false,
        reason:
          'İçeriğiniz topluluk kurallarına aykırı (küfür, hakaret veya kırıcı) ifadeler içeriyor. Lütfen yapıcı ve saygılı bir dil kullanın.',
      };
    }
  }

  return { isClean: true };
}

