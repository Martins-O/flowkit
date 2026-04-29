import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart } from '@/components/BarChart.js';
import { StatCard } from '@/components/StatCard.js';
import { getApiClient } from '@/lib/apiClient.js';
import { useTimerStore } from '@/store/timerStore.js';

interface DailyCount {
  date: string;
  count: number;
}

interface TaskStat {
  taskId: string;
  title: string;
  totalSeconds: number;
}

interface StreakData {
  current: number;
  longest: number;
}

function formatMinutes(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getLast14Days(): string[] {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function shortDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()] ?? '';
}

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const accessToken = useTimerStore((s) => s.accessToken);

  const [daily, setDaily] = useState<DailyCount[]>([]);
  const [tasks, setTasks] = useState<TaskStat[]>([]);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(
    async (silent = false) => {
      if (!accessToken) return;
      if (!silent) setLoading(true);

      try {
        const api = getApiClient();
        const [dailyData, taskData, streakData] = await Promise.all([
          api.analytics.daily(),
          api.analytics.tasks(),
          api.analytics.streak(),
        ]);
        setDaily(dailyData);
        setTasks(taskData.sort((a, b) => b.totalSeconds - a.totalSeconds).slice(0, 5));
        setStreak(streakData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function onRefresh() {
    setRefreshing(true);
    fetchData(true);
  }

  // Build 14-day chart data
  const last14 = getLast14Days();
  const dailyMap = new Map(daily.map((d) => [d.date, d.count]));
  const chartData = last14.map((date) => ({
    label: shortDay(date),
    value: dailyMap.get(date) ?? 0,
  }));

  // Total this week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekTotal = daily
    .filter((d) => new Date(d.date) >= weekStart)
    .reduce((sum, d) => sum + d.count, 0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = dailyMap.get(todayStr) ?? 0;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#7F77DD" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7F77DD"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
        </View>

        {/* Today + streak cards */}
        <View style={styles.statRow}>
          <StatCard
            label="Today"
            value={todayCount}
            subtitle="sessions"
            color="#7F77DD"
          />
          <StatCard
            label="This week"
            value={weekTotal}
            subtitle="sessions"
            color="#7F77DD"
          />
          <StatCard
            label="Streak"
            value={streak?.current ?? 0}
            subtitle="days"
            color="#1D9E75"
          />
        </View>

        {/* Longest streak */}
        {(streak?.longest ?? 0) > 0 && (
          <View style={styles.longestStreak}>
            <Text style={styles.longestStreakText}>
              Longest streak: {streak?.longest} day{streak?.longest !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Daily chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last 14 days</Text>
          <View style={styles.chartCard}>
            <BarChart data={chartData} color="#7F77DD" height={100} />
          </View>
        </View>

        {/* Top tasks */}
        {tasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top tasks</Text>
            <View style={styles.taskList}>
              {tasks.map((task, i) => {
                const maxSeconds = tasks[0]?.totalSeconds ?? 1;
                const barWidth = (task.totalSeconds / maxSeconds) * 100;
                return (
                  <View key={task.taskId} style={styles.taskStatRow}>
                    <View style={styles.taskStatMeta}>
                      <Text style={styles.taskStatRank}>#{i + 1}</Text>
                      <Text style={styles.taskStatTitle} numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Text style={styles.taskStatTime}>
                        {formatMinutes(task.totalSeconds)}
                      </Text>
                    </View>
                    <View style={styles.taskStatBarBg}>
                      <View
                        style={[
                          styles.taskStatBar,
                          { width: `${barWidth}%` },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Empty state */}
        {daily.length === 0 && tasks.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No data yet</Text>
            <Text style={styles.emptySubtext}>
              Complete your first focus session to see analytics
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f13' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f0f13',
  },
  scroll: { gap: 20 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#f0eff8' },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
  },
  longestStreak: { paddingHorizontal: 20 },
  longestStreakText: { fontSize: 12, color: '#555' },
  section: { gap: 12, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#888' },
  chartCard: {
    backgroundColor: '#1a1a24',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a38',
  },
  taskList: {
    backgroundColor: '#1a1a24',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a38',
    gap: 14,
  },
  taskStatRow: { gap: 6 },
  taskStatMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskStatRank: { fontSize: 12, color: '#555', width: 20 },
  taskStatTitle: { flex: 1, fontSize: 13, color: '#d0cfdf' },
  taskStatTime: { fontSize: 12, color: '#7F77DD', fontWeight: '500' },
  taskStatBarBg: {
    height: 4,
    backgroundColor: '#2a2a38',
    borderRadius: 2,
    overflow: 'hidden',
  },
  taskStatBar: {
    height: '100%',
    backgroundColor: '#534AB7',
    borderRadius: 2,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
    paddingHorizontal: 20,
  },
  emptyText: { fontSize: 16, color: '#555', fontWeight: '500' },
  emptySubtext: { fontSize: 13, color: '#333', textAlign: 'center' },
});
