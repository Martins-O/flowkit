import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getApiClient } from '@/lib/apiClient.js';
import { useTimerStore } from '@/store/timerStore.js';
import type { Task } from '@flowkit/types';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const accessToken = useTimerStore((s) => s.accessToken);
  const selectedTaskId = useTimerStore((s) => s.selectedTaskId);
  const setSelectedTask = useTimerStore((s) => s.setSelectedTask);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEstimate, setNewEstimate] = useState('1');
  const [creating, setCreating] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!accessToken) return;
    try {
      const api = getApiClient();
      const all = await Promise.all([
        api.tasks.list({ completed: false }),
        showCompleted ? api.tasks.list({ completed: true }) : Promise.resolve([]),
      ]);
      setTasks([...all[0], ...all[1]]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, showCompleted]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const api = getApiClient();
      const task = await api.tasks.create({
        title: newTitle.trim(),
        estimatedPomodoros: parseInt(newEstimate, 10) || 1,
      });
      setTasks((prev) => [task, ...prev]);
      setNewTitle('');
      setNewEstimate('1');
      setCreateModalVisible(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  async function handleComplete(task: Task) {
    try {
      const api = getApiClient();
      await api.tasks.complete(task.id);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: true } : t)),
      );
      if (selectedTaskId === task.id) setSelectedTask(null);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(task: Task) {
    Alert.alert('Delete task', `Delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const api = getApiClient();
            await api.tasks.delete(task.id);
            setTasks((prev) => prev.filter((t) => t.id !== task.id));
            if (selectedTaskId === task.id) setSelectedTask(null);
          } catch (err) {
            console.error(err);
          }
        },
      },
    ]);
  }

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#7F77DD" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tasks</Text>
        <TouchableOpacity
          onPress={() => setCreateModalVisible(true)}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 24 },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>Tap + New to add one</Text>
          </View>
        }
        ListFooterComponent={
          completedTasks.length > 0 ? (
            <View>
              <TouchableOpacity
                onPress={() => setShowCompleted((v) => !v)}
                style={styles.completedToggle}
              >
                <Text style={styles.completedToggleText}>
                  {showCompleted ? 'Hide' : 'Show'} {completedTasks.length} completed
                </Text>
              </TouchableOpacity>
              {showCompleted &&
                completedTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    isSelected={selectedTaskId === task.id}
                    onSelect={() => setSelectedTask(task.id)}
                    onComplete={() => handleComplete(task)}
                    onDelete={() => handleDelete(task)}
                  />
                ))}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            isSelected={selectedTaskId === item.id}
            onSelect={() => setSelectedTask(item.id)}
            onComplete={() => handleComplete(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
      />

      {/* Create task modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New task</Text>
            <TouchableOpacity onPress={handleCreate} disabled={creating}>
              <Text style={[styles.modalSave, creating && styles.modalSaveDisabled]}>
                {creating ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <TextInput
              style={styles.modalInput}
              placeholder="Task title"
              placeholderTextColor="#555"
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
              maxLength={255}
            />

            <View style={styles.estimateRow}>
              <Text style={styles.estimateLabel}>Estimated Pomodoros</Text>
              <View style={styles.estimateStepper}>
                <TouchableOpacity
                  onPress={() =>
                    setNewEstimate((v) => String(Math.max(1, parseInt(v, 10) - 1)))
                  }
                  style={styles.stepperButton}
                >
                  <Text style={styles.stepperButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{newEstimate}</Text>
                <TouchableOpacity
                  onPress={() =>
                    setNewEstimate((v) => String(Math.min(20, parseInt(v, 10) + 1)))
                  }
                  style={styles.stepperButton}
                >
                  <Text style={styles.stepperButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function TaskRow({
  task,
  isSelected,
  onSelect,
  onComplete,
  onDelete,
}: {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  onComplete: () => void;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onSelect}
      onLongPress={onDelete}
      activeOpacity={0.7}
      style={[styles.taskRow, isSelected && styles.taskRowSelected]}
    >
      <TouchableOpacity
        onPress={task.completed ? undefined : onComplete}
        style={[styles.checkbox, task.completed && styles.checkboxDone]}
      >
        {task.completed && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>

      <View style={styles.taskInfo}>
        <Text
          style={[styles.taskTitle, task.completed && styles.taskTitleDone]}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        <Text style={styles.taskMeta}>
          {task.completedPomodoros}/{task.estimatedPomodoros} pomodoros
        </Text>
      </View>

      {isSelected && (
        <View style={styles.selectedDot} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f13' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f13' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1d2e',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#f0eff8' },
  addButton: {
    backgroundColor: '#2a2854',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addButtonText: { fontSize: 14, color: '#a09ae8', fontWeight: '500' },
  list: { padding: 16, gap: 8 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, color: '#555', fontWeight: '500' },
  emptySubtext: { fontSize: 13, color: '#333' },
  completedToggle: { paddingVertical: 12, paddingHorizontal: 4 },
  completedToggleText: { fontSize: 13, color: '#555' },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a24',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2a2a38',
  },
  taskRowSelected: { borderColor: '#534AB7', backgroundColor: '#1e1c2e' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#3a3a4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: '#1D9E75', borderColor: '#1D9E75' },
  checkmark: { fontSize: 12, color: '#fff', fontWeight: '700' },
  taskInfo: { flex: 1, gap: 3 },
  taskTitle: { fontSize: 14, color: '#d0cfdf', fontWeight: '500' },
  taskTitleDone: { color: '#555', textDecorationLine: 'line-through' },
  taskMeta: { fontSize: 12, color: '#555' },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7F77DD',
  },
  modal: { flex: 1, backgroundColor: '#0f0f13' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1d2e',
  },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#f0eff8' },
  modalCancel: { fontSize: 15, color: '#888' },
  modalSave: { fontSize: 15, color: '#7F77DD', fontWeight: '600' },
  modalSaveDisabled: { opacity: 0.5 },
  modalBody: { padding: 20, gap: 20 },
  modalInput: {
    backgroundColor: '#1a1a24',
    borderWidth: 1,
    borderColor: '#2a2a38',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#f0eff8',
  },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  estimateLabel: { fontSize: 14, color: '#888' },
  estimateStepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a24',
    borderWidth: 1,
    borderColor: '#2a2a38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: { fontSize: 20, color: '#f0eff8', lineHeight: 24 },
  stepperValue: { fontSize: 18, fontWeight: '600', color: '#f0eff8', minWidth: 24, textAlign: 'center' },
});
