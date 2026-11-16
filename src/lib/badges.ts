export interface UserLevelInfo {
  level: number;
  title: string;
  color: string;
  nextLevelPoints: number;
  progressPercent: number;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export function getUserLevelInfo(reputation: number): UserLevelInfo {
  if (reputation >= 500) {
    return {
      level: 5,
      title: 'Topluluk Efsanesi',
      color: '#f59e0b',
      nextLevelPoints: 1000,
      progressPercent: 100,
    };
  }
  if (reputation >= 200) {
    return {
      level: 4,
      title: 'Uzman Geliştirici',
      color: '#8b5cf6',
      nextLevelPoints: 500,
      progressPercent: Math.min(100, Math.round(((reputation - 200) / 300) * 100)),
    };
  }
  if (reputation >= 75) {
    return {
      level: 3,
      title: 'Deneyimli Katkıcı',
      color: '#10b981',
      nextLevelPoints: 200,
      progressPercent: Math.min(100, Math.round(((reputation - 75) / 125) * 100)),
    };
  }
  if (reputation >= 25) {
    return {
      level: 2,
      title: 'Aktif Üye',
      color: '#3b82f6',
      nextLevelPoints: 75,
      progressPercent: Math.min(100, Math.round(((reputation - 25) / 50) * 100)),
    };
  }
  return {
    level: 1,
    title: 'Yeni Üye',
    color: '#6366f1',
    nextLevelPoints: 25,
    progressPercent: Math.max(5, Math.min(100, Math.round((reputation / 25) * 100))),
  };
}

export function getUserBadges(stats: {
  reputation: number;
  threadCount: number;
  commentCount: number;
  acceptedSolutionsCount: number;
  role: string;
}): UserBadge[] {
  const badges: UserBadge[] = [];

  if (stats.role === 'ADMIN') {
    badges.push({
      id: 'admin',
      name: 'Sistem Yöneticisi',
      description: 'Topluluk platformu resmi yöneticisi.',
      icon: 'Shield',
      color: '#6366f1',
    });
  } else if (stats.role === 'MODERATOR') {
    badges.push({
      id: 'mod',
      name: 'Topluluk Moderatörü',
      description: 'Topluluk düzenini ve kalitesini koruyan moderatör.',
      icon: 'ShieldCheck',
      color: '#ec4899',
    });
  }

  if (stats.threadCount >= 1) {
    badges.push({
      id: 'first_thread',
      name: 'İlk Kıvılcım',
      description: 'Toplulukta ilk tartışma konusunu başlattı.',
      icon: 'Sparkles',
      color: '#3b82f6',
    });
  }

  if (stats.threadCount >= 5) {
    badges.push({
      id: 'topic_leader',
      name: 'Gündem Belirleyici',
      description: '5 veya daha fazla nitelikli tartışma konusu açtı.',
      icon: 'Flame',
      color: '#f97316',
    });
  }

  if (stats.acceptedSolutionsCount >= 1) {
    badges.push({
      id: 'problem_solver',
      name: 'Çözüm Üstadı',
      description: 'Yanıtı bir konuda kabul edilen çözüm olarak seçildi.',
      icon: 'CheckCircle2',
      color: '#10b981',
    });
  }

  if (stats.commentCount >= 5) {
    badges.push({
      id: 'active_commenter',
      name: 'Yardımsever Geliştirici',
      description: 'Tartışmalara 5+ yorumla aktif katkı sağladı.',
      icon: 'MessageSquare',
      color: '#8b5cf6',
    });
  }

  if (stats.reputation >= 100) {
    badges.push({
      id: 'reputation_star',
      name: 'İtibar Yıldızı',
      description: '100+ topluluk itibar puanına ulaştı.',
      icon: 'Award',
      color: '#f59e0b',
    });
  }

  return badges;
}

