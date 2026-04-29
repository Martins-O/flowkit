import React, { useState } from 'react';
import type { Task } from '@flowkit/types';

interface Props {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelect: (taskId: string | null) => void;
  onClose: () => void;
  onCreateTask: (title: string) => Promise<void>;
}

export function TaskSelector({ tasks, selectedTaskId, onSelect, onClose, onCreateTask }: Props) {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await onCreateTask(newTitle.trim());
      setNewTitle('');
      setShowCreate(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0f0f13]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-sm font-semibold text-gray-200">Select task</span>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-200 transition-colors text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {/* Search + New */}
      <div className="px-4 py-2 flex gap-2">
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-brand-400"
          autoFocus
        />
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm rounded-xl transition-colors"
        >
          + New
        </button>
      </div>

      {/* No task option */}
      <div className="px-4 py-1">
        <button
          onClick={() => { onSelect(null); onClose(); }}
          className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
            selectedTaskId === null
              ? 'bg-brand-600/30 text-brand-100'
              : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
          }`}
        >
          No task
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="px-4 py-2 border-b border-white/10">
          <input
            type="text"
            placeholder="Task title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-brand-400"
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleCreate}
              disabled={creating || !newTitle.trim()}
              className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm py-2 rounded-xl transition-colors"
            >
              {creating ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewTitle(''); }}
              className="px-3 py-2 text-gray-400 hover:text-gray-200 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-4 py-1 space-y-1">
        {filtered.length === 0 && (
          <p className="text-sm text-gray-600 text-center py-6">No tasks found</p>
        )}
        {filtered.map((task) => (
          <button
            key={task.id}
            onClick={() => { onSelect(task.id); onClose(); }}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
              selectedTaskId === task.id
                ? 'bg-brand-600/30 text-brand-100'
                : 'text-gray-300 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate">{task.title}</span>
              <span className="text-xs text-gray-600 shrink-0">
                {task.completedPomodoros}/{task.estimatedPomodoros}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
