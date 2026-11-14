// Логика составления расписания (без привязки к DOM).

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const PRIORITY_LABEL = { high: "высокий", medium: "средний", low: "низкий" };

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
 * Задачи, не помещающиеся до dayEnd, попадают в список skipped.
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

  for (const task of sorted) {
    const duration = Math.round(task.hours * 60);
    if (cursor + duration <= end) {
      items.push({
        name: task.name,
        priority: task.priority,
        start: minutesToTime(cursor),
        end: minutesToTime(cursor + duration),
      });
      cursor += duration;
    } else {
      skipped.push(task);
    }
  }

  return { items, skipped, freeMinutes: end - cursor };
}

if (typeof module !== "undefined") {
  module.exports = { buildSchedule, timeToMinutes, minutesToTime };
}
