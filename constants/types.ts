export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  due: string | null;
  priority: 'low' | 'medium' | 'high';
  checklist: ChecklistItem[];
}