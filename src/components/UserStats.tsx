import { useState, useEffect } from 'react';
import { X, Clock, Film, Tv, Radio, TrendingUp, Calendar } from 'lucide-react';

interface WatchStats {
  totalWatchTime: number; // en minutos
  contentWatched: number;
  byType: { live: number; movie: number; series: number; radio: number };
  byDay: { [key: string]: number }; // minutos por día
  topCategories: { name: string; count: number }[];
}

export function useWatchStats() {
  const [stats, setStats] = useState<WatchStats>(() => {
    const saved = localStorage.getItem('sirnet_watch_stats');
    return saved ? JSON.parse(saved) : {
      totalWatchTime: 0,
      contentWatched: 0,
      byType: { live: 0, movie: 0, series: 0, radio: 0 },
      byDay: {},
      topCategories: []
    };
  });

  useEffect(() => {
    localStorage.setItem('sirnet_watch_stats', JSON.stringify(stats));
  }, [stats]);

  const trackWatch = (type: string, group: string, minutes: number) => {
    const today = new Date().toISOString().split('T')[0];
    setStats(prev => {
      const newByDay = { ...prev.byDay, [today]: (prev.byDay[today] || 0) + minutes };
      const typeKey = type as keyof typeof prev.byType;
      const newByType = { ...prev.byType, [typeKey]: (prev.byType[typeKey] || 0) + minutes };
      
      // Update top categories
      const catIndex = prev.topCategories.findIndex(c => c.name === group);
      let newTopCats = [...prev.topCategories];
      if (catIndex >= 0) {
        newTopCats[catIndex].count++;
      } else {
        newTopCats.push({ name: group, count: 1 });
      }
      newTopCats.sort((a, b) => b.count - a.count);
      newTopCats = newTopCats.slice(0, 5);

      return {
        totalWatchTime: prev.totalWatchTime + minutes,
        contentWatched: prev.contentWatched + 1,
        byType: newByType,
        byDay: newByDay,
        topCategories: newTopCats
      };
    });
  };

  const resetStats = () => {
    setStats({ totalWatchTime: 0, contentWatched: 0, byType: { live: 0, movie: 0, series: 0, radio: 0 }, byDay: {}, topCategories: [] });
  };

  return { stats, trackWatch, resetStats };
}
