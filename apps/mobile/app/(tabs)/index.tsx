import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { TimerRing } from '@/components/TimerRing.js';
import { timerService } from '@/lib/timerService.js';
import { useTimerStore } from '@/store/timerStore.js';
import { getApiClient } from '@/lib/apiClient.js';
import type { TimerState, Task } from '@flowkit/types';
import { DEFAULT_SETTINGS } from '@flowkit/types';

export default function TimerScreen() {
  const insets = useSafeAreaInsets();
  const storeState = useTimerStore((s) => s.timerState);
  const settings = useTimerStore((s) => s.settings);
  const storeSelectedTaskId = useTimerStore((s) => s.selectedTaskId);
  const setSelectedTask = useTimerStore((s) => s.setSelectedTask);
  const accessToken = useTimerStore((s) => s.accessToken);

  const [localState, setLocalState] = useState<TimerState | null>(storeState);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [taskSearch, setTaskSearch] = useState('');

  // Subscribe to timer service
  useEffect(() => {
    const unsub = timerService.subscribe(setLocalState);
    setLocalState(timerService.getState());
    return unsub;
  }, []);

  // Load tasks
  useEffect(() => {
    if (!accessToken) return;
    getApiClient()
      .tasks.list({ completed: false })
      .then(setTasks)
      .catch(console.error);
  }, [accessToken]);

  const state = localState ?? {
    status: 'idle' as const,
    type: 'focus' as const,
    elapsed: 0,
    remaining: settings.focusDuration,
    sessionCount: 0,
    currentTaskId: null,
  };

  const total =
    state.type === 'focus'
      ? settings.focusDuration
      : state.type === 'short_break'
      ? settings.shortBreakDuration
      : settings.longBreakDuration;

  const selectedTask = tasks.find((t) => t.id === storeSelectedTaskId);
  const isBreak = state.type === 'short_break' || state.type === 'long_break';

  async function handleStart() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await timerService.start(storeSelectedTaskId ?? undefined, settings);
  }

  async function handlePause() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await timerService.pause();
  }

  async function handleResume() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await timerService.resume();
  }

  async function handleStop() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await timerService.stop();
  }

  function handleOverflow() {
    timerService.overflow();
  }

  function handleSkipBreak() {
    timerService.skipBreak();
  }

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(taskSearch.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Session count */}
        {state.sessionCount > 0 && (
          <View style={styles.sessionCountRow}>
            <Text style={styles.sessionCountText}>
              {state.sessionCount} session{state.sessionCount !== 1 ? 's' : ''} today
            </Text>
          </View>
        )}

        {/* Timer ring */}
        <View style={styles.ringContainer}>
          <TimerRing
            remaining={state.remaining}
            total={total}
            type={state.type}
            status={state.status}
          />
        </View>

        {/* Task selector (focus only) */}
        {!isBreak && (
          <TouchableOpacity
            style={styles.taskSelector}
            onPress={() => setTaskModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text
              style={selectedTask ? styles.taskSelectorText : styles.taskSelectorPlaceholder}
              numberOfLines={1}
            >
              {selectedTask ? selectedTask.title : 'Select a task...'}
            </Text>
            <Text style={styles.taskSelectorChevron}>›</Text>
          </TouchableOpacity>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {state.status === 'idle' && (
            <PrimaryButton onPress={handleStart} color="#7F77DD" label="Start" />
          )}

          {state.status === 'running' && (
            <View style={styles.buttonRow}>
              <PrimaryButton onPress={handlePause} color="#534AB7" label="Pause" />
              <SecondaryButton onPress={handleStop} label="Stop" />
            </View>
          )}

          {state.status === 'paused' && (
            <View style={styles.buttonRow}>
              <PrimaryButton onPress={handleResume} color="#7F77DD" label="Resume" />
              <SecondaryButton onPress={handleStop} label="Stop" />
            </View>
          )}

          {state.status === 'completed' && !isBreak && (
            <PrimaryButton onPress={handleOverflow} color="#534AB7" label="Keep going" />
          )}

          {state.status === 'completed' && isBreak && (
            <PrimaryButton onPress={handleSkipBreak} color="#1D9E75" label="Start focus" />
          )}

          {state.status === 'overflow' && (
            <PrimaryButton onPress={handleStop} color="#E24B4A" label="End session" />
          )}

          {(state.status === 'running' || state.status === 'paused') && isBreak && (
            <TouchableOpacity onPress={handleSkipBreak} style={styles.skipBreak}>
              <Text style={styles.skipBreakText}>Skip break</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Task selector modal */}
      <Modal
        visible={taskModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTaskModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select task</Text>
            <TouchableOpacity onPress={() => setTaskModalVisible(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor="#555"
            value={taskSearch}
            onChangeText={setTaskSearch}
            autoFocus
          />

          <FlatList
            data={[{ id: null, title: 'No task' } as unknown as Task, ...filteredTasks]}
            keyExtractor={(item) => item.id ?? 'none'}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.taskItem,
                  storeSelectedTaskId === item.id && styles.taskItemSelected,
                ]}
                onPress={() => {
                  setSelectedTask(item.id);
                  setTaskModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.taskItemText,
                    storeSelectedTaskId === item.id && styles.taskItemTextSelected,
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {item.id && (
                  <Text style={styles.taskPomodoroCount}>
                    {(item as Task).completedPomodoros}/{(item as Task).estimatedPomodoros}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function PrimaryButton({
  onPress,
  color,
  label,
}: {
  onPress: () => void;
  color: string;
  label: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.primaryButton, { backgroundColor: color }]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function SecondaryButton({
  onPress,
  label,
}: {
  onPress: () => void;
  label: string;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.secondaryButton}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f13' },
  scroll: { alignItems: 'center', paddingTop: 24, gap: 24 },
  sessionCountRow: { alignItems: 'center' },
  sessionCountText: { fontSize: 13, color: '#555' },
  ringContainer: { alignItems: 'center' },
  taskSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a24',
    borderWidth: 1,
    borderColor: '#2a2a38',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '85%',
    gap: 8,
  },
  taskSelectorText: { flex: 1, fontSize: 14, color: '#d0cfdf' },
  taskSelectorPlaceholder: { flex: 1, fontSize: 14, color: '#555' },
  taskSelectorChevron: { fontSize: 20, color: '#555' },
  controls: { alignItems: 'center', gap: 12, width: '85%' },
  buttonRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  primaryButton: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 140,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a38',
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#888', fontSize: 15 },
  skipBreak: { paddingVertical: 8 },
  skipBreakText: { fontSize: 13, color: '#555' },
  modal: { flex: 1, backgroundColor: '#0f0f13', paddingTop: 16 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1d2e',
  },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#f0eff8' },
  modalClose: { fontSize: 15, color: '#7F77DD', fontWeight: '500' },
  searchInput: {
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#f0eff8',
    margin: 16,
    marginTop: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a24',
  },
  taskItemSelected: { backgroundColor: '#2a2854' },
  taskItemText: { flex: 1, fontSize: 14, color: '#d0cfdf' },
  taskItemTextSelected: { color: '#a09ae8', fontWeight: '500' },
  taskPomodoroCount: { fontSize: 12, color: '#555', marginLeft: 8 },
});
