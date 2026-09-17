// Сохранение прогресса в localStorage — статический сайт без бэкенда,
// поэтому вся персистентность хранится в браузере пользователя.
const KEY = 'shamus_clone_save_v1';

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function writeSave(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* хранилище недоступно — не критично */ }
}
export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
