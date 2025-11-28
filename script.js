  document.addEventListener("DOMContentLoaded", () => {
  console.log("Script loaded");

  // ------------------------------
  // GLOBAL ELEMENTS
  // ------------------------------
  const taskInput = document.getElementById("taskInput");
  const dateInput = document.getElementById("dateAdd");
  const addTaskBtn = document.getElementById("addTask");
  const tasksList = document.getElementById("tasks");
  const progressFill = document.getElementById("progressFill");
  const themeToggle = document.getElementById("themeToggle");
  const askAIToggleBtn = document.getElementById("askAIToggle");
  const aiDropdown = document.getElementById("aiDropdown");
  const askAIArrow = document.getElementById("askAIArrow");
  const askAISubmit = document.getElementById("askAISubmit");
  const AIInput = document.getElementById("AIInput");
  const AIOutput = document.getElementById("AIOutput");
  const responseSection = document.querySelector(".ai-response");

  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  // ------------------------------
  // ADD TASK
  // ------------------------------
  addTaskBtn.addEventListener("click", () => {
    const text = taskInput.value.trim();
    const date = dateInput.value;

    if (text) {
      tasks.push({
        id: Date.now(),
        text,
        date: date || null,
        completed: false
      });

      taskInput.value = "";
      dateInput.value = "";
      saveTasks();
      renderTasks();
    }
  });

  // ------------------------------
  // RENDER TASKS
  // ------------------------------
  function renderTasks() {
    tasksList.innerHTML = "";

    tasks.forEach((task) => {
      if (!task.id) {
      task.id = Date.now() + Math.random(); // fallback for legacy tasks
    }

      const li = document.createElement("li");
      li.dataset.id = task.id;

      const completeBtn = document.createElement("button");
      completeBtn.textContent = "✔";

      const contentSpan = document.createElement("span");
      contentSpan.className = task.completed ? "completed" : "";

      const taskTextSpan = document.createElement("span");
      taskTextSpan.textContent = task.text;

      const dateSpan = document.createElement("span");
      dateSpan.textContent = task.date ? formatDate(task.date) : "";
      dateSpan.className = "task-date";

      contentSpan.appendChild(taskTextSpan);
      contentSpan.appendChild(dateSpan);

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Ｘ";

      li.appendChild(completeBtn);
      li.appendChild(taskTextSpan);
      li.appendChild(dateSpan);
      li.appendChild(deleteBtn);

      tasksList.appendChild(li);
    });
    saveTasks(); // update localStorage with fixed IDs
    updateProgress();
  }

// Helper to format date nicely
function formatDate(dateString) {
  const options = { day: "numeric", month: "short", year: "numeric" };
  return new Date(dateString).toLocaleDateString("en-GB", options);
}

  // ------------------------------
  // SAVE TASKS
  // ------------------------------
  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  // ------------------------------
  // UPDATE PROGRESS
  // ------------------------------
  function updateProgress() {
    const completed = tasks.filter(t => t.completed).length;
    const percent = tasks.length ? (completed / tasks.length) * 100 : 0;
    progressFill.style.width = percent + "%";
  }

  // ------------------------------
  // TASK BUTTONS (COMPLETE / DELETE)
  // ------------------------------
  tasksList.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;

    const dropdown = document.querySelector('.dropdown');
    const taskId = li.dataset.id;
    const task = tasks.find(t => t.id == taskId);

    if (e.target.textContent === "✔") {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    } else if (e.target.textContent === "Ｘ") {
      tasks = tasks.filter(t => t.id != taskId);
      saveTasks();
      renderTasks();
    }
  });

  // ------------------------------
  // THEME TOGGLE
  // ------------------------------
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  });

  // ------------------------------
  // AI DROPDOWN TOGGLE
  // ------------------------------
  askAIToggleBtn.addEventListener("click", () => {
    aiDropdown.classList.toggle("open");
    askAIArrow.classList.toggle("rotated");

    if (aiDropdown.classList.contains("open")) {
      AIInput.focus();
    }
  });

  // ------------------------------
  // AI SUBMIT
  // ------------------------------
  askAISubmit.addEventListener("click", () => {
    const query = AIInput.value.trim();

    responseSection.classList.add("show");
    AIOutput.textContent = query
      ? "You asked AI: " + query
      : "Please enter a question for the AI.";

    AIInput.value = "";
  });

const calendarBtn = document.getElementById('calendarBtn');
const dateAdd = document.getElementById('dateAdd');

if (calendarBtn && dateAdd && typeof dateAdd.showPicker === 'function') {
  calendarBtn.addEventListener('click', () => {
    // Ensure the input is focusable when we call showPicker
    dateAdd.style.pointerEvents = 'auto';
    dateAdd.focus();
    dateAdd.showPicker();
    // Restore pointer-events afterwards
    setTimeout(() => { dateAdd.style.pointerEvents = 'none'; }, 0);
  });
}

  // ------------------------------
  // INITIAL RENDER
  // ------------------------------
  renderTasks();
});