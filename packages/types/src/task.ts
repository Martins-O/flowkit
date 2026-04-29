export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  userId: string;
  projectId: string | null;
  title: string;
  description: string | null;
  estimatedPomodoros: number;
  completedPomodoros: number;
  priority: Priority;
  completed: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  color: string;
  archivedAt: Date | null;
  createdAt: Date;
}
