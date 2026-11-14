// Работа с интерфейсом.

const tasks = [];

const form = document.getElementById("task-form");
const nameInput = document.getElementById("task-name");
const durationInput = document.getElementById("task-duration");
const priorityInput = document.getElementById("task-priority");
const taskList = document.getElementById("task-list");
const emptyHint = document.getElementById("empty-hint");
const errorBox = document.getElementById("error");
const scheduleCard = document.getElementById("schedule-card");
const scheduleList = document.getElementById("schedule");
const summary = document.getElementById("schedule-summary");

function formatHours(hours) {
  return (hours % 1 === 0 ? hours : hours.toFixed(2).replace(/0$/, "")) + " ч";
}

function renderTasks() {
  taskList.innerHTML = "";
  emptyHint.hidden = tasks.length > 0;

  tasks.forEach((task, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="task-name"></span>
      <span class="meta">${formatHours(task.hours)}</span>
      <span class="badge ${task.priority}">${PRIORITY_LABEL[task.priority]}</span>
      <button class="remove" title="Удалить">✕</button>`;
    li.querySelector(".task-name").textContent = task.name;
    li.querySelector(".remove").addEventListener("click", () => {
      tasks.splice(i, 1);
      renderTasks();
    });
    taskList.appendChild(li);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();
  const hours = parseFloat(durationInput.value);
  if (!name || !(hours > 0)) return;

  tasks.push({ name, hours, priority: priorityInput.value });
  form.reset();
  durationInput.value = "1";
  priorityInput.value = "medium";
  nameInput.focus();
  renderTasks();
});

document.getElementById("build-btn").addEventListener("click", () => {
  errorBox.textContent = "";
  scheduleCard.hidden = true;

  if (tasks.length === 0) {
    errorBox.textContent = "Добавьте хотя бы одну задачу.";
    return;
  }

  let result;
  try {
    result = buildSchedule(
      tasks,
      document.getElementById("day-start").value,
      document.getElementById("day-end").value
    );
  } catch (err) {
    errorBox.textContent = err.message;
    return;
  }

  scheduleList.innerHTML = "";
  for (const item of result.items) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="time">${item.start} – ${item.end}</span>
      <span class="task-name"></span>
      <span class="badge ${item.priority}">${PRIORITY_LABEL[item.priority]}</span>`;
    li.querySelector(".task-name").textContent = item.name;
    scheduleList.appendChild(li);
  }

  const parts = [];
  const free = result.freeMinutes;
  parts.push(`Свободного времени останется: ${Math.floor(free / 60)} ч ${free % 60} мин.`);
  if (result.skipped.length) {
    parts.push("Не поместились: " + result.skipped.map((t) => t.name).join(", ") + ".");
  }
  summary.textContent = parts.join(" ");
  scheduleCard.hidden = false;
});

renderTasks();
