export interface UserLevelInfo {
  level: number;
  title: string;
  color: string;
  minPoints: number;
  nextLevelPoints: number;
  remainingPoints: number;
  progressPercent: number;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  condition: string;
  icon: string;
  color: string;
}

/**
 * Standart ve Anlaşılır İtibar Puanı Kuralları (5 ve 10'un Katları)
 */
export const REPUTATION_POINTS = {
  INITIAL: 0,
  NEW_THREAD: 10,
  NEW_COMMENT: 5,
  UPVOTE_RECEIVED: 5,
  ACCEPTED_SOLUTION: 25,
} as const;

export const LEVEL_TIERS = [
  {
    level: 1,
    title: 'Yeni Üye',
    minPoints: 0,
    nextLevelPoints: 50,
    color: '#6366f1',
    description: 'Topluluğa yeni katılan ve ilk adımlarını atan üye.',
  },
  {
    level: 2,
    title: 'Aktif Katılımcı',
    minPoints: 50,
    nextLevelPoints: 150,
    color: '#3b82f6',
    description: 'Konu ve yorumlarıyla tartışmalara düzenli katılan üye.',
  },
  {
    level: 3,
    title: 'Deneyimli Geliştirici',
    minPoints: 150,
    nextLevelPoints: 300,
    color: '#10b981',
    description: 'Paylaşımları topluluk tarafından beğenilen deneyimli üye.',
  },
  {
    level: 4,
    title: 'Çözüm Uzmanı',
    minPoints: 300,
    nextLevelPoints: 600,
    color: '#8b5cf6',
    description: 'Teknik soruları çözen ve topluluğa rehberlik eden uzman.',
  },
  {
    level: 5,
    title: 'Topluluk Lideri',
    minPoints: 600,
    nextLevelPoints: 600,
    color: '#f59e0b',
    description: 'En yüksek itibar kademesine ulaşmış usta topluluk lideri.',
  },
] as const;

export function getUserLevelInfo(rawReputation: number): UserLevelInfo {
  const reputation = Math.max(0, Number(rawReputation) || 0);

  if (reputation >= 600) {
    return {
      level: 5,
      title: 'Topluluk Lideri',
      color: '#f59e0b',
      minPoints: 600,
      nextLevelPoints: 600,
      remainingPoints: 0,
      progressPercent: 100,
    };
  }
  if (reputation >= 300) {
    return {
      level: 4,
      title: 'Çözüm Uzmanı',
      color: '#8b5cf6',
      minPoints: 300,
      nextLevelPoints: 600,
      remainingPoints: 600 - reputation,
      progressPercent: Math.min(100, Math.round(((reputation - 300) / 300) * 100)),
    };
  }
  if (reputation >= 150) {
    return {
      level: 3,
      title: 'Deneyimli Geliştirici',
      color: '#10b981',
      minPoints: 150,
      nextLevelPoints: 300,
      remainingPoints: 300 - reputation,
      progressPercent: Math.min(100, Math.round(((reputation - 150) / 150) * 100)),
    };
  }
  if (reputation >= 50) {
    return {
      level: 2,
      title: 'Aktif Katılımcı',
      color: '#3b82f6',
      minPoints: 50,
      nextLevelPoints: 150,
      remainingPoints: 150 - reputation,
      progressPercent: Math.min(100, Math.round(((reputation - 50) / 100) * 100)),
    };
  }
  return {
    level: 1,
    title: 'Yeni Üye',
    color: '#6366f1',
    minPoints: 0,
    nextLevelPoints: 50,
    remainingPoints: 50 - reputation,
    progressPercent: Math.max(4, Math.min(100, Math.round((reputation / 50) * 100))),
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
      condition: 'Yönetici (ADMIN) Yetkisi',
      icon: 'Shield',
      color: '#6366f1',
    });
  } else if (stats.role === 'MODERATOR') {
    badges.push({
      id: 'mod',
      name: 'Topluluk Moderatörü',
      description: 'Topluluk düzenini ve kalitesini koruyan moderatör.',
      condition: 'Moderatör Yetkisi',
      icon: 'ShieldCheck',
      color: '#ec4899',
    });
  }

  if (stats.threadCount >= 1) {
    badges.push({
      id: 'first_thread',
      name: 'İlk Kıvılcım',
      description: 'Toplulukta ilk tartışma konusunu başlattı.',
      condition: 'En az 1 konu açmak',
      icon: 'Sparkles',
      color: '#3b82f6',
    });
  }

  if (stats.threadCount >= 5) {
    badges.push({
      id: 'topic_leader',
      name: 'Gündem Belirleyici',
      description: '5 veya daha fazla nitelikli tartışma konusu açtı.',
      condition: '5+ konu açmak',
      icon: 'Flame',
      color: '#f97316',
    });
  }

  if (stats.acceptedSolutionsCount >= 1) {
    badges.push({
      id: 'problem_solver',
      name: 'Çözüm Üstadı',
      description: 'Yanıtı bir konuda kabul edilen çözüm olarak seçildi.',
      condition: 'En az 1 doğru çözüm üretmek',
      icon: 'CheckCircle2',
      color: '#10b981',
    });
  }

  if (stats.commentCount >= 5) {
    badges.push({
      id: 'active_commenter',
      name: 'Yardımsever Geliştirici',
      description: 'Tartışmalara 5+ yorumla aktif katkı sağladı.',
      condition: '5+ yorum yazmak',
      icon: 'MessageSquare',
      color: '#8b5cf6',
    });
  }

  if (stats.reputation >= 150) {
    badges.push({
      id: 'reputation_star',
      name: 'İtibar Yıldızı',
      description: '150+ topluluk itibar puanına ulaştı.',
      condition: '150+ İtibar Puanı',
      icon: 'Award',
      color: '#f59e0b',
    });
  }

  return badges;
}
