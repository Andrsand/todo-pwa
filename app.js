/**
 * To-Do PWA: UI и логика
 */
import * as db from './db.js';

const addForm = document.getElementById('addForm');
const addInput = document.getElementById('addInput');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const statsEl = document.getElementById('stats');

const LONG_PRESS_MS = 500;

let currentFilter = 'all';
let tasks = [];
let longPressTimer = null;
let contextMenu = null;
let contextTaskId = null;

function getFilteredTasks() {
  if (currentFilter === 'active') return tasks.filter((t) => !t.completed);
  if (currentFilter === 'done') return tasks.filter((t) => t.completed);
  return tasks;
}

function renderStats() {
  const active = tasks.filter((t) => !t.completed).length;
  const total = tasks.length;
  if (total === 0) statsEl.textContent = '0 задач';
  else if (active === 0) statsEl.textContent = `Все выполнены (${total})`;
  else statsEl.textContent = `${active} из ${total} задач`;
}

function getContextMenu() {
  if (contextMenu) return contextMenu;
  contextMenu = document.createElement('div');
  contextMenu.className = 'context-menu';
  contextMenu.setAttribute('role', 'menu');
  contextMenu.innerHTML = `
    <button type="button" class="context-menu-item" data-action="edit" role="menuitem">Редактировать</button>
    <button type="button" class="context-menu-item context-menu-item-danger" data-action="delete" role="menuitem">Удалить</button>
  `;
  contextMenu.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn || !contextTaskId) return;
    if (btn.dataset.action === 'edit') startEditTask(contextTaskId);
    if (btn.dataset.action === 'delete') removeTask(contextTaskId);
    hideContextMenu();
  });
  document.body.appendChild(contextMenu);
  return contextMenu;
}

function showContextMenu(taskId, x, y) {
  const menu = getContextMenu();
  contextTaskId = taskId;
  menu.style.left = `${Math.min(x, window.innerWidth - 180)}px`;
  menu.style.top = `${y}px`;
  menu.classList.add('context-menu-visible');
  const close = () => {
    hideContextMenu();
    document.removeEventListener('click', close);
    document.removeEventListener('touchstart', close);
  };
  requestAnimationFrame(() => {
    document.addEventListener('click', close);
    document.addEventListener('touchstart', close, { passive: true });
  });
}

function hideContextMenu() {
  if (contextMenu) contextMenu.classList.remove('context-menu-visible');
  contextTaskId = null;
}

function cancelLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

function setupLongPress(li, taskId) {
  const showMenu = (clientX, clientY) => {
    cancelLongPress();
    showContextMenu(taskId, clientX, clientY);
  };
  const start = (clientX, clientY) => {
    cancelLongPress();
    longPressTimer = setTimeout(() => showMenu(clientX, clientY), LONG_PRESS_MS);
  };
  li.addEventListener('touchstart', (e) => {
    if (e.target.closest('.task-check, .task-delete')) return;
    const t = e.changedTouches[0];
    start(t.clientX, t.clientY);
  }, { passive: true });
  li.addEventListener('touchend', cancelLongPress, { passive: true });
  li.addEventListener('touchcancel', cancelLongPress, { passive: true });
  li.addEventListener('touchmove', cancelLongPress, { passive: true });
  li.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || e.target.closest('.task-check, .task-delete')) return;
    start(e.clientX, e.clientY);
  });
  li.addEventListener('mouseup', cancelLongPress);
  li.addEventListener('mouseleave', cancelLongPress);
  li.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.task-check, .task-delete')) return;
    e.preventDefault();
    showContextMenu(taskId, e.clientX, e.clientY);
  });
}

async function startEditTask(id) {
  const li = taskList.querySelector(`[data-id="${id}"]`);
  if (!li) return;
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  const label = li.querySelector('.task-label');
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'task-edit-input';
  input.value = task.text;
  input.maxLength = 280;
  li.classList.add('editing');
  label.replaceWith(input);
  input.focus();
  input.select();

  const save = async () => {
    const text = input.value.trim();
    li.classList.remove('editing');
    input.replaceWith(label);
    label.textContent = task.text;
    if (text && text !== task.text) {
      try {
        const updated = await db.updateTaskText(id, text);
        const idx = tasks.findIndex((t) => t.id === id);
        if (idx !== -1) tasks[idx] = updated;
        label.textContent = updated.text;
      } catch (err) {
        console.error('Ошибка сохранения:', err);
      }
    } else {
      label.textContent = task.text;
    }
  };

  input.addEventListener('blur', save, { once: true });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      input.removeEventListener('blur', save);
      save();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      li.classList.remove('editing');
      input.replaceWith(label);
      label.textContent = task.text;
    }
  });
}

function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = 'task-item' + (task.completed ? ' completed' : '');
  li.dataset.id = task.id;

  const checkbox = document.createElement('button');
  checkbox.type = 'button';
  checkbox.className = 'task-check';
  checkbox.setAttribute('aria-label', task.completed ? 'Отметить невыполненной' : 'Отметить выполненной');
  checkbox.innerHTML = task.completed ? '✓' : '';

  const label = document.createElement('span');
  label.className = 'task-label';
  label.textContent = task.text;

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'task-delete';
  deleteBtn.setAttribute('aria-label', 'Удалить');

  li.append(checkbox, label, deleteBtn);

  setupLongPress(li, task.id);
  checkbox.addEventListener('click', () => toggleTask(task.id));
  deleteBtn.addEventListener('click', () => removeTask(task.id));

  return li;
}

function renderTasks() {
  const filtered = getFilteredTasks();
  taskList.innerHTML = '';
  filtered.forEach((task) => taskList.appendChild(createTaskElement(task)));
  emptyState.hidden = tasks.length > 0;
  renderStats();
}

async function loadTasks() {
  try {
    tasks = await db.getAllTasks();
    tasks.sort((a, b) => a.createdAt - b.createdAt);
    renderTasks();
  } catch (e) {
    console.error('Ошибка загрузки задач:', e);
    tasks = [];
    renderTasks();
  }
}

async function addTask(e) {
  e.preventDefault();
  const text = addInput.value.trim();
  if (!text) return;
  addInput.value = '';
  try {
    const task = await db.addTask(text);
    tasks.push(task);
    if (currentFilter !== 'done') {
      taskList.appendChild(createTaskElement(task));
    }
    emptyState.hidden = true;
    renderStats();
  } catch (err) {
    console.error('Ошибка добавления:', err);
  }
}

async function toggleTask(id) {
  try {
    const updated = await db.toggleTask(id);
    if (!updated) return;
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx !== -1) tasks[idx] = updated;
    renderTasks();
  } catch (err) {
    console.error('Ошибка обновления:', err);
  }
}

async function removeTask(id) {
  try {
    await db.deleteTask(id);
    tasks = tasks.filter((t) => t.id !== id);
    renderTasks();
  } catch (err) {
    console.error('Ошибка удаления:', err);
  }
}

document.querySelectorAll('.filter').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelector('.filter.active').classList.remove('active');
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

addForm.addEventListener('submit', addTask);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

loadTasks();
