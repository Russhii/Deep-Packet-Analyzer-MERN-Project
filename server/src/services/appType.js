const APP_TYPES = {
  UNKNOWN: 'Unknown',
  HTTP: 'HTTP',
  HTTPS: 'HTTPS',
  DNS: 'DNS',
  TLS: 'TLS',
  GOOGLE: 'Google',
  FACEBOOK: 'Facebook',
  YOUTUBE: 'YouTube',
  TWITTER: 'Twitter/X',
  INSTAGRAM: 'Instagram',
  NETFLIX: 'Netflix',
  AMAZON: 'Amazon',
  MICROSOFT: 'Microsoft',
  APPLE: 'Apple',
  WHATSAPP: 'WhatsApp',
  TELEGRAM: 'Telegram',
  TIKTOK: 'TikTok',
  SPOTIFY: 'Spotify',
  ZOOM: 'Zoom',
  DISCORD: 'Discord',
  GITHUB: 'GitHub',
  CLOUDFLARE: 'Cloudflare',
};

export function appTypeToString(type) {
  return APP_TYPES[type] || 'Unknown';
}

export function sniToAppType(sni) {
  if (!sni || typeof sni !== 'string') return 'UNKNOWN';
  const lower = sni.toLowerCase();
  if (lower.includes('google') || lower.includes('gstatic') || lower.includes('googleapis') || lower.includes('ggpht') || lower.includes('gvt1')) return 'GOOGLE';
  if (lower.includes('youtube') || lower.includes('ytimg') || lower.includes('youtu.be') || lower.includes('yt3.ggpht')) return 'YOUTUBE';
  if (lower.includes('facebook') || lower.includes('fbcdn') || lower.includes('fb.com') || lower.includes('fbsbx') || lower.includes('meta.com')) return 'FACEBOOK';
  if (lower.includes('instagram') || lower.includes('cdninstagram')) return 'INSTAGRAM';
  if (lower.includes('whatsapp') || lower.includes('wa.me')) return 'WHATSAPP';
  if (lower.includes('twitter') || lower.includes('twimg') || lower.includes('x.com') || lower.includes('t.co')) return 'TWITTER';
  if (lower.includes('netflix') || lower.includes('nflxvideo') || lower.includes('nflximg')) return 'NETFLIX';
  if (lower.includes('amazon') || lower.includes('amazonaws') || lower.includes('cloudfront') || lower.includes('aws')) return 'AMAZON';
  if (lower.includes('microsoft') || lower.includes('msn.com') || lower.includes('office') || lower.includes('azure') || lower.includes('live.com') || lower.includes('outlook') || lower.includes('bing')) return 'MICROSOFT';
  if (lower.includes('apple') || lower.includes('icloud') || lower.includes('mzstatic') || lower.includes('itunes')) return 'APPLE';
  if (lower.includes('telegram') || lower.includes('t.me')) return 'TELEGRAM';
  if (lower.includes('tiktok') || lower.includes('tiktokcdn') || lower.includes('musical.ly') || lower.includes('bytedance')) return 'TIKTOK';
  if (lower.includes('spotify') || lower.includes('scdn.co')) return 'SPOTIFY';
  if (lower.includes('zoom')) return 'ZOOM';
  if (lower.includes('discord') || lower.includes('discordapp')) return 'DISCORD';
  if (lower.includes('github') || lower.includes('githubusercontent')) return 'GITHUB';
  if (lower.includes('cloudflare') || lower.includes('cf-')) return 'CLOUDFLARE';
  return 'HTTPS';
}
