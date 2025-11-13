import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Modal, Platform, Switch, Animated, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import axios from 'axios';

const fetchTasks = async () => {
  try {
    const res = await axios.get('http://172.20.10.2:3000/tasks');
    console.log('✅ Данные с сервера:', res.data);
  } catch (err: any) {
    console.error('❌ Ошибка при запросе:', err.message);
    if (err.response) {
      console.log('Status:', err.response.status);
      console.log('Data:', err.response.data);
    }
  }
};

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
  const [tasks, setTasks] = useState<Task[]>([]);
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

  const [titleFocused, setTitleFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);

  const titleAnim = useRef(new Animated.Value(newTaskTitle ? 1 : 0)).current;
  const descriptionAnim = useRef(new Animated.Value(newTaskDescription ? 1 : 0)).current;

  const screenWidth = Dimensions.get('window').width;
  const isSmallScreen = screenWidth < 400; // телефоны

  // Функция для анимации лейбла
  const animateLabel = (anim: Animated.Value, focused: boolean, value: string) => {
    Animated.timing(anim, {
      toValue: focused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const showWarningPopup = () => {
    setShowPopup(true);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => setShowPopup(false));
    }, 3000);
  };

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const res = await axios.get('http://172.20.10.2:3000/tasks');
        // Преобразуем id в строку, чтобы соответствовало интерфейсу Task
        const serverTasks: Task[] = res.data.map((t: any) => ({
          ...t,
          id: t.id.toString(),
          checklist: t.checklist || [],
        }));
        setTasks(serverTasks);
      } catch (err: any) {
        console.error('❌ Ошибка при загрузке задач с сервера:', err.message);
        if (err.response) console.log('Status:', err.response.status, 'Data:', err.response.data);
      }
    };

    loadTasks();
  }, []);


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

  const saveTask = async () => {
    if (!newTaskTitle.trim()) return;

    if (editingTask) {
      // обновление существующей задачи
      try {
        await axios.put(`http://172.20.10.2:3000/tasks/${editingTask.id}`, {
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim(),
          completed: editingTask.completed,
          due: newTaskDue.toISOString().split('T')[0],
          priority: newTaskPriority,
          checklist: newChecklist,
        });
        setTasks((s) =>
          s.map((t) =>
            t.id === editingTask.id
              ? {
                ...t,
                title: newTaskTitle.trim(),
                description: newTaskDescription.trim(),
                due: newTaskDue.toISOString().split('T')[0],
                priority: newTaskPriority,
                checklist: newChecklist,
              }
              : t
          )
        );
      } catch (err) {
        console.error('Ошибка при обновлении задачи', err);
      }
    } else {
      // создание новой задачи
      try {
        const res = await axios.post("http://172.20.10.2:3000/tasks", {
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim(),
          due: newTaskDue.toISOString().split('T')[0],
          priority: newTaskPriority,
          checklist: newChecklist,
        });
        const t: Task = {
          id: res.data.id.toString(),
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim(),
          completed: false,
          due: newTaskDue.toISOString().split('T')[0],
          priority: newTaskPriority,
          checklist: newChecklist,
        };
        setTasks((s) => [t, ...s]);
      } catch (err) {
        console.error('Ошибка при создании задачи', err);
      }
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

  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

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

  let stages: string[] = ['Просрочено', 'Сегодня', '1 неделя', '2 недели', '3 недели', 'Без срока'];
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
      <Text style={styles.header}>Radion</Text>
      <View style={{ marginBottom: 12 }}>
        <Animated.Text
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 12,
            top: descriptionAnim.interpolate({ inputRange: [0, 1], outputRange: [10, -8] }),
            fontSize: descriptionAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 12] }),
            color: '#6b7280',
            backgroundColor: descriptionFocused || newTaskDescription ? 'transparent' : 'transparent',
            paddingHorizontal: 4,
            zIndex: 1,
          }}
        >
          Поиск задач
        </Animated.Text>
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          onFocus={() => { setDescriptionFocused(true); animateLabel(descriptionAnim, true, newTaskDescription); }}
          onBlur={() => { setDescriptionFocused(false); animateLabel(descriptionAnim, false, newTaskDescription); }}
          multiline
          style={{
            height: 40,
            borderRadius: 8,
            backgroundColor: '#f3f4f6',
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 16,
            outline: 'none',
            zIndex: 0,
          }}
        />
      </View>

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
                const borderColor = task.completed ? '#10b981' : task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#0000ff';
                return (
                  <View key={task.id} style={[styles.taskItem, { borderLeftWidth: 4, borderLeftColor: borderColor }]}>
                    <TouchableOpacity onPress={() => toggleComplete(task.id)}>
                      <Text style={[styles.taskTitle, task.completed && styles.completed]}>{task.title}</Text>
                    </TouchableOpacity>
                    <Text>{task.description}</Text>
                    {task.due && <Text>Срок: {formatDate(task.due)}</Text>}

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
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={styles.modalHeader}>
              {editingTask ? 'Изменить задачу' : 'Новая задача'}
            </Text>

            <View style={{ marginBottom: 12 }}>
              <Animated.Text
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 12,
                  top: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [12, -8] }),
                  fontSize: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 12] }),
                  color: '#6b7280',
                  backgroundColor: 'transparent',
                  paddingHorizontal: 4,
                  zIndex: 1,
                }}
              >
                Название задачи
              </Animated.Text>
              <TextInput
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                onFocus={() => { setTitleFocused(true); animateLabel(titleAnim, true, newTaskTitle); }}
                onBlur={() => { setTitleFocused(false); animateLabel(titleAnim, false, newTaskTitle); }}
                style={{
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: '#f3f4f6',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 16,
                  outline: 'none',
                  zIndex: 0,
                }}
              />
            </View>

            {/* Описание */}
            <View style={{ marginBottom: 12 }}>
              <Animated.Text
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 12,
                  top: descriptionAnim.interpolate({ inputRange: [0, 1], outputRange: [10, -8] }),
                  fontSize: descriptionAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 12] }),
                  color: '#6b7280',
                  backgroundColor: descriptionFocused || newTaskDescription ? 'transparent' : 'transparent',
                  paddingHorizontal: 4,
                  zIndex: 1,
                }}
              >
                Описание
              </Animated.Text>
              <TextInput
                value={newTaskDescription}
                onChangeText={setNewTaskDescription}
                onFocus={() => { setDescriptionFocused(true); animateLabel(descriptionAnim, true, newTaskDescription); }}
                onBlur={() => { setDescriptionFocused(false); animateLabel(descriptionAnim, false, newTaskDescription); }}
                multiline
                style={{
                  height: 80,
                  borderRadius: 8,
                  backgroundColor: '#f3f4f6',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 16,
                  outline: 'none',
                  zIndex: 0,
                }}
              />
            </View>

            {/* Дата */}
            <Text style={styles.label}>Срок выполнения</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"

                onChange={(e) => setNewTaskDue(new Date(e.target.value))}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  border: '1px solid #ccc',
                  marginBottom: 8,
                  outline: 'none',
                }}
              />
            ) : (
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
              >
                <Text>Срок: {newTaskDue.toISOString().split('T')[0]}</Text>
              </TouchableOpacity>
            )}

            {showDatePicker && Platform.OS !== 'web' && (
              <DateTimePicker
                value={newTaskDue}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setNewTaskDue(date);
                }}
              />
            )}

            {/* Приоритет */}
            <Text style={styles.label}>Приоритет</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'nowrap', }}>
                {['low', 'medium', 'high'].map((p) => {
                  let color = p === 'low' ? '#0000ff' : p === 'medium' ? '#f59e0b' : '#ef4444';
                  let label = p === 'low' ? 'Низкий' : p === 'medium' ? 'Средний' : 'Высокий';
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setNewTaskPriority(p as 'low' | 'medium' | 'high')}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginRight: 12,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        borderWidth: newTaskPriority === p ? 2 : 1,
                        borderColor: newTaskPriority === p ? color : '#d1d5db',
                        backgroundColor: '#f3f4f6',
                        minWidth: 80, // чтобы кнопка не была слишком маленькой
                        justifyContent: 'center',
                      }}
                    >
                      <View style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: color,
                        marginRight: 8,
                      }} />
                      <Text style={{ color: '#111', fontWeight: '600' }}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Чеклист */}
            <Text style={styles.modalSubHeader}>Чеклист</Text>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              <TextInput
                value={checkItemText}
                onChangeText={setCheckItemText}
                style={{
                  flex: 1,
                  backgroundColor: '#f3f4f6',
                  padding: isSmallScreen ? 6 : 8,
                  borderRadius: 8,
                  fontSize: isSmallScreen ? 12 : 14,
                  outline: 'none',
                }}
              />
              <TouchableOpacity
                onPress={addChecklistItem}
                style={{
                  backgroundColor: '#1f2937',
                  borderRadius: 8,
                  marginLeft: 4,
                  paddingHorizontal: isSmallScreen ? 8 : 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: isSmallScreen ? 32 : 40,
                }}
              >
                <Text style={{ color: '#fff', fontSize: isSmallScreen ? 16 : 18 }}>+</Text>
              </TouchableOpacity>
            </View>

            {newChecklist.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                {newChecklist.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      // Переключаем локально
                      const updatedChecklist = newChecklist.map(c =>
                        c.id === item.id ? { ...c, completed: !c.completed } : c
                      );
                      setNewChecklist(updatedChecklist);

                      // Если редактируем существующую задачу, синхронизируем tasks
                      if (editingTask) {
                        setTasks(tasks.map(t =>
                          t.id === editingTask.id
                            ? { ...t, checklist: updatedChecklist }
                            : t
                        ));
                      }
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}
                  >
                    <Text style={{ marginRight: 8 }}>{item.completed ? '✅' : '⬜'}</Text>
                    <Text style={{ textDecorationLine: item.completed ? 'line-through' : 'none' }}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}


            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={() => setShowAdd(false)} style={styles.modalButton}>
                <Text>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveTask}
                style={[styles.modalButton, { backgroundColor: '#1f2937' }]}
              >
                <Text style={{ color: '#fff' }}>
                  {editingTask ? 'Сохранить' : 'Добавить'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151', // серый 700
    marginBottom: 4,
    marginTop: 8,
  },
  completed: { textDecorationLine: 'line-through', color: '#6b7280' },
  deleteText: { color: '#ef4444', fontWeight: 'bold' },
  modalContainer: { flex: 1, padding: 16, backgroundColor: '#fff' },
  modalHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  modalSubHeader: { fontSize: 16, fontWeight: 'bold', marginVertical: 8 },
  input: { backgroundColor: '#f3f4f6', padding: 8, borderRadius: 8, marginBottom: 8 },
  dateButton: { backgroundColor: '#f3f4f6', padding: 8, borderRadius: 8, marginBottom: 8 },
  addButtonSmall: { backgroundColor: '#1f2937', padding: 8, borderRadius: 8, marginLeft: 4, justifyContent: 'center', alignItems: 'center', height: 32 },
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
