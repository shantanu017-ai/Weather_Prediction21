import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAQIColor(aqi: number | null | undefined): {
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  category: string;
} {
  if (aqi === null || aqi === undefined) {
    return {
      color: '#64748b',
      bgClass: 'bg-slate-700/30',
      textClass: 'text-slate-400',
      borderClass: 'border-slate-700',
      category: 'Unknown'
    };
  }

  if (aqi <= 50) {
    return {
      color: '#10b981',
      bgClass: 'bg-emerald-500/10',
      textClass: 'text-emerald-400',
      borderClass: 'border-emerald-500/30',
      category: 'Good'
    };
  } else if (aqi <= 100) {
    return {
      color: '#22c55e',
      bgClass: 'bg-green-500/10',
      textClass: 'text-green-400',
      borderClass: 'border-green-500/30',
      category: 'Satisfactory'
    };
  } else if (aqi <= 200) {
    return {
      color: '#eab308',
      bgClass: 'bg-yellow-500/10',
      textClass: 'text-yellow-400',
      borderClass: 'border-yellow-500/30',
      category: 'Moderate'
    };
  } else if (aqi <= 300) {
    return {
      color: '#f97316',
      bgClass: 'bg-orange-500/10',
      textClass: 'text-orange-400',
      borderClass: 'border-orange-500/30',
      category: 'Poor'
    };
  } else if (aqi <= 400) {
    return {
      color: '#ef4444',
      bgClass: 'bg-red-500/10',
      textClass: 'text-red-400',
      borderClass: 'border-red-500/30',
      category: 'Very Poor'
    };
  } else {
    return {
      color: '#881337',
      bgClass: 'bg-rose-950/20',
      textClass: 'text-rose-400',
      borderClass: 'border-rose-900/40',
      category: 'Severe'
    };
  }
}

export function getHealthAdvisory(category: string): string {
  switch (category) {
    case 'Good':
      return 'Air quality is satisfactory and poses little or no risk to health.';
    case 'Satisfactory':
      return 'Minor breathing discomfort may be experienced by unusually sensitive people.';
    case 'Moderate':
      return 'Breathing discomfort to people with lungs, asthma, and heart diseases.';
    case 'Poor':
      return 'Breathing discomfort to most people on prolonged exposure. Avoid strenuous outdoor activities.';
    case 'Very Poor':
      return 'Respiratory illness on prolonged exposure. Vulnerable groups should remain indoors.';
    case 'Severe':
      return 'Health emergency: affects healthy people and seriously impacts those with existing diseases.';
    default:
      return 'Monitoring data is actively updating.';
  }
}
