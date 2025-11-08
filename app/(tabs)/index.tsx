import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Modal, Platform, Switch, Animated } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  due: string | null;
  priority: 'low' | 'medium' | 'high';
  checklist: ChecklistItem[];
}

export default function TaskManagerMainScreen() {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks());
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDue, setNewTaskDue] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newChecklist, setNewChecklist] = useState<ChecklistItem[]>([]);
  const [checkItemText, setCheckItemText] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const inputRef = useRef<TextInput | null>(null);

  const showWarningPopup = () => {
    setShowPopup(true);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => setShowPopup(false));
    }, 3000);
  };

  const openAddModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setNewTaskTitle(task.title);
      setNewTaskDescription(task.description);
      setNewTaskDue(task.due ? new Date(task.due) : new Date());
      setNewTaskPriority(task.priority);
      setNewChecklist(task.checklist);
    } else {
      setEditingTask(null);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskDue(new Date());
      setNewTaskPriority('medium');
      setNewChecklist([]);
    }
    setShowAdd(true);
  };

  const saveTask = () => {
    if (!newTaskTitle.trim()) return;

    if (editingTask) {
      setTasks((s) => s.map((t) => t.id === editingTask.id ? {
        ...t,
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        due: newTaskDue.toISOString().split('T')[0],
        priority: newTaskPriority,
        checklist: newChecklist,
      } : t));
    } else {
      const t: Task = {
        id: Date.now().toString(),
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        completed: false,
        due: newTaskDue.toISOString().split('T')[0],
        priority: newTaskPriority,
        checklist: newChecklist,
      };
      setTasks((s) => [t, ...s]);
    }

    setShowAdd(false);
  };

  const toggleComplete = (id: string) => {
    setTasks((s) =>
      s.map((t) => {
        if (t.id === id) {
          if (t.checklist.length > 0 && t.checklist.some(c => !c.completed)) {
            showWarningPopup();
            return t;
          }
          return { ...t, completed: !t.completed };
        }
        return t;
      })
    );
  };

  const removeTask = (id: string) => {
    setTasks((s) => s.filter((t) => t.id !== id));
  };

  const addChecklistItem = () => {
    if (!checkItemText.trim()) return;
    const item: ChecklistItem = { id: Date.now().toString(), title: checkItemText.trim(), completed: false };
    setNewChecklist((s) => [...s, item]);
    setCheckItemText('');
  };

  const toggleChecklistItem = (taskId: string, itemId: string) => {
    setTasks((s) => s.map((t) => t.id === taskId ? {
      ...t,
      checklist: t.checklist.map(c => c.id === itemId ? { ...c, completed: !c.completed } : c)
    } : t));
  };

  const filtered = tasks.filter(t => {
    const matchesQuery = t.title.toLowerCase().includes(query.toLowerCase());
    if (!showCompleted && t.completed) return false;
    return matchesQuery;
  });

  const getTaskStage = (task: Task) => {
    if (task.completed) return 'Выполнено';
    if (!task.due) return 'Без срока';
    const today = new Date();
    const dueDate = new Date(task.due);
    if (dueDate.toDateString() === today.toDateString()) return 'Сегодня';
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Просрочено';
    if (diffDays <= 7) return '1 неделя';
    if (diffDays <= 14) return '2 недели';
    if (diffDays <= 21) return '3 недели';
    return '3 недели';
  };

  let stages: string[] = ['Сегодня', 'Просрочено', '1 неделя', '2 недели', '3 недели', 'Без срока'];
  if (showCompleted) stages.push('Выполнено');

  const tasksByStage: Record<string, Task[]> = {};
  stages.forEach(stage => tasksByStage[stage] = []);
  filtered.forEach(task => {
    const stage = getTaskStage(task);
    if (!stages.includes(stage)) return;
    tasksByStage[stage].push(task);
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Task Manager</Text>
      <TextInput
        ref={inputRef}
        value={query}
        onChangeText={setQuery}
        placeholder="Поиск задач"
        style={styles.searchInput}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text>Показать выполненные:</Text>
        <Switch value={showCompleted} onValueChange={setShowCompleted} />
      </View>

      <TouchableOpacity style={styles.addTaskButton} onPress={() => openAddModal()}>
        <Text style={styles.addButtonText}>Новая задача</Text>
      </TouchableOpacity>

      <ScrollView horizontal style={{ flex: 1 }}>
        {stages.map((stage, index) => (
          <View key={stage} style={{ width: 250, marginRight: index < stages.length - 1 ? 16 : 0, borderRightWidth: index < stages.length - 1 ? 1 : 0, borderRightColor: '#9ca3af', paddingRight: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>{stage}</Text>
            <ScrollView>
              {tasksByStage[stage].map(task => {
                const borderColor = task.completed ? '#10b981' : task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#10b981';
                return (
                  <View key={task.id} style={[styles.taskItem, { borderLeftWidth: 4, borderLeftColor: borderColor }]}>
                    <TouchableOpacity onPress={() => toggleComplete(task.id)}>
                      <Text style={[styles.taskTitle, task.completed && styles.completed]}>{task.title}</Text>
                    </TouchableOpacity>
                    <Text>{task.description}</Text>
                    {task.due && <Text>Срок: {task.due}</Text>}

                    {task.checklist.length > 0 && (
                      <View style={{ marginTop: 8 }}>
                        {task.checklist.map(item => (
                          <TouchableOpacity
                            key={item.id}
                            onPress={() => toggleChecklistItem(task.id, item.id)}
                            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}
                          >
                            <Text style={{ marginRight: 4 }}>{item.completed ? '✅' : '⬜'}</Text>
                            <Text style={{ textDecorationLine: item.completed ? 'line-through' : 'none' }}>{item.title}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    <View style={{ flexDirection: 'row', marginTop: 4 }}>
                      <TouchableOpacity onPress={() => openAddModal(task)} style={{ marginRight: 8 }}>
                        <Text style={{ color: '#3b82f6', fontWeight: 'bold' }}>Изменить</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeTask(task.id)}>
                        <Text style={styles.deleteText}>Удалить</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      {/* Popup уведомление */}
      {showPopup && (
        <Animated.View style={[styles.popup, { opacity: fadeAnim }]}>
          <Text style={styles.popupText}>⚠️ Невозможно завершить задачу: есть незавершённые пункты чеклиста</Text>
        </Animated.View>
      )}

      {/* Модалка добавления/редактирования */}
      <Modal visible={showAdd} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalHeader}>{editingTask ? 'Изменить задачу' : 'Новая задача'}</Text>
          <TextInput value={newTaskTitle} onChangeText={setNewTaskTitle} placeholder="Название" style={styles.input} />
          <TextInput value={newTaskDescription} onChangeText={setNewTaskDescription} placeholder="Описание" style={styles.input} />

          {Platform.OS === 'web' ? (
            <input type="date" value={newTaskDue.toISOString().split('T')[0]} onChange={(e) => setNewTaskDue(new Date(e.target.value))} style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc', marginBottom: 8 }} />
          ) : (
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
              <Text>Срок: {newTaskDue.toISOString().split('T')[0]}</Text>
            </TouchableOpacity>
          )}

          {showDatePicker && Platform.OS !== 'web' && (
            <DateTimePicker value={newTaskDue} mode="date" display="default" onChange={(event, date) => { setShowDatePicker(false); if (date) setNewTaskDue(date); }} />
          )}

          <Picker selectedValue={newTaskPriority} onValueChange={(itemValue) => setNewTaskPriority(itemValue)} style={styles.input}>
            <Picker.Item label="low" value="low" />
            <Picker.Item label="medium" value="medium" />
            <Picker.Item label="high" value="high" />
          </Picker>

          <Text style={styles.modalSubHeader}>Чеклист</Text>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <TextInput value={checkItemText} onChangeText={setCheckItemText} placeholder="Новый элемент" style={[styles.input, { flex: 1 }]} />
            <TouchableOpacity onPress={addChecklistItem} style={styles.addButtonSmall}><Text style={{ color: '#fff' }}>+</Text></TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 100, marginBottom: 16 }}>{newChecklist.map(item => (<Text key={item.id}>- {item.title}</Text>))}</ScrollView>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={() => setShowAdd(false)} style={styles.modalButton}><Text>Отмена</Text></TouchableOpacity>
            <TouchableOpacity onPress={saveTask} style={[styles.modalButton, { backgroundColor: '#1f2937' }]}><Text style={{ color: '#fff' }}>{editingTask ? 'Сохранить' : 'Добавить'}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function sampleTasks(): Task[] {
  return [
    { id: '1', title: 'Подготовить презентацию', description: 'Презентация для встречи', completed: false, due: null, priority: 'high', checklist: [] },
    { id: '2', title: 'Обновить документацию', description: '', completed: false, due: null, priority: 'medium', checklist: [] },
  ];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#d1d5db', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  searchInput: { backgroundColor: '#fff', padding: 8, borderRadius: 8, marginBottom: 12 },
  addTaskButton: { backgroundColor: '#1f2937', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  taskItem: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 },
  taskTitle: { fontSize: 16 },
  completed: { textDecorationLine: 'line-through', color: '#6b7280' },
  deleteText: { color: '#ef4444', fontWeight: 'bold' },
  modalContainer: { flex: 1, padding: 16, backgroundColor: '#fff' },
  modalHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  modalSubHeader: { fontSize: 16, fontWeight: 'bold', marginVertical: 8 },
  input: { backgroundColor: '#f3f4f6', padding: 8, borderRadius: 8, marginBottom: 8 },
  dateButton: { backgroundColor: '#f3f4f6', padding: 8, borderRadius: 8, marginBottom: 8 },
  addButtonSmall: { backgroundColor: '#1f2937', padding: 8, borderRadius: 8, marginLeft: 4, justifyContent: 'center', alignItems: 'center' },
  modalButton: { padding: 10, borderRadius: 8, alignItems: 'center', flex: 1, marginHorizontal: 4, backgroundColor: '#e5e7eb' },
  popup: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  popupText: { color: '#fff', fontWeight: 'bold' },
});
