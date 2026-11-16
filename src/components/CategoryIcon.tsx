'use client';

import React from 'react';
import {
  Megaphone,
  Code2,
  Sparkles,
  Palette,
  Rocket,
  HelpCircle,
  MessageSquare,
  Layers,
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
}

export function CategoryIcon({ name, className = 'w-4 h-4', color }: CategoryIconProps) {
  const style = color ? { color } : undefined;
  switch (name) {
    case 'Megaphone':
      return <Megaphone className={className} style={style} />;
    case 'Code2':
      return <Code2 className={className} style={style} />;
    case 'Sparkles':
      return <Sparkles className={className} style={style} />;
    case 'Palette':
      return <Palette className={className} style={style} />;
    case 'Rocket':
      return <Rocket className={className} style={style} />;
    case 'HelpCircle':
      return <HelpCircle className={className} style={style} />;
    case 'Layers':
      return <Layers className={className} style={style} />;
    default:
      return <MessageSquare className={className} style={style} />;
  }
}
