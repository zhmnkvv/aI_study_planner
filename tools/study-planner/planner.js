// Логика составления расписания (без привязки к DOM).

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const PRIORITY_LABEL = { high: "высокий", medium: "средний", low: "низкий" };

// Перерыв после длительной задачи.
const LONG_TASK_MINUTES = 60;
const BREAK_MINUTES = 15;

// "10:30" -> 630 (минуты от начала суток)
function timeToMinutes(value) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

// 630 -> "10:30"
function minutesToTime(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

/**
 * Составляет последовательное расписание.
 * tasks: [{ name, hours, priority }]
 * Задачи сортируются по приоритету (при равном — в порядке добавления)
 * и ставятся друг за другом, начиная с dayStart.
 * Если задача не помещается целиком, ей отдаётся оставшееся время
 * (partial: true), а все менее важные задачи попадают в skipped —
 * время не уходит на менее приоритетные задачи раньше более важных.
 * После задачи длительностью от LONG_TASK_MINUTES перед следующей задачей
 * ставится перерыв BREAK_MINUTES — только если следующая задача после
 * перерыва всё ещё помещается целиком (перерыв не вытесняет задачи
 * и не выходит за dayEnd).
 */
function buildSchedule(tasks, dayStart, dayEnd) {
  const start = timeToMinutes(dayStart);
  const end = timeToMinutes(dayEnd);
  if (end <= start) {
    throw new Error("Конец свободного времени должен быть позже начала.");
  }

  const sorted = tasks
    .map((task, index) => ({ ...task, index }))
    .sort((a, b) =>
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.index - b.index
    );

  const items = [];
  const skipped = [];
  let cursor = start;
  let needBreak = false;

  for (const task of sorted) {
    const duration = Math.round(task.hours * 60);
    if (needBreak && cursor + BREAK_MINUTES + duration <= end) {
      items.push({
        type: "break",
        name: "Перерыв",
        start: minutesToTime(cursor),
        end: minutesToTime(cursor + BREAK_MINUTES),
      });
      cursor += BREAK_MINUTES;
    }
    needBreak = false;

    const available = end - cursor;
    if (available <= 0) {
      skipped.push(task);
      continue;
    }
    const planned = Math.min(duration, available);
    items.push({
      type: "task",
      name: task.name,
      priority: task.priority,
      start: minutesToTime(cursor),
      end: minutesToTime(cursor + planned),
      partial: planned < duration,
    });
    cursor += planned;
    needBreak = planned >= LONG_TASK_MINUTES;
  }

  return { items, skipped, freeMinutes: end - cursor };
}

if (typeof module !== "undefined") {
  module.exports = { buildSchedule, timeToMinutes, minutesToTime };
}
