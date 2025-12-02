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
  const categorySelect = document.getElementById("categorySelect");

  let tasks = [];
  try {
    const stored = JSON.parse(localStorage.getItem("tasks"));
    if (Array.isArray(stored)) tasks = stored;
  } catch (e) {
    tasks = [];
  }

  let currentFilter = "all";

  // ------------------------------
  // ADD TASK
  // ------------------------------
  addTaskBtn.addEventListener("click", () => {
    const text = taskInput.value.trim();
    const date = dateInput.value;
    const category = (categorySelect?.value || "school").toLowerCase();

    if (text) {
      tasks.push({
        id: Date.now(),
        text,
        date: date || null,
        category,
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
      if (currentFilter !== "all" && (task.category || "").toLowerCase() !== currentFilter) {
        return;
      }

      const li = document.createElement("li");
      li.dataset.id = task.id;
      li.dataset.category = task.category;
      if (task.completed) li.classList.add("completed");

      const completeBtn = document.createElement("button");
      completeBtn.textContent = "✔";

      const taskTextSpan = document.createElement("span");
      taskTextSpan.textContent = task.text;

      const dateSpan = document.createElement("span");
      dateSpan.textContent = task.date ? formatDate(task.date) : "";
      dateSpan.className = "task-date";

      const categorySpan = document.createElement("span");
      categorySpan.textContent = task.category;
      categorySpan.className = "task-category";

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Ｘ";

      li.appendChild(completeBtn);
      li.appendChild(taskTextSpan);
      li.appendChild(dateSpan);
      li.appendChild(categorySpan);
      li.appendChild(deleteBtn);

      tasksList.appendChild(li);
    });

    saveTasks();
    updateProgress();
  }

  // ------------------------------
  // FORMAT DATE
  // ------------------------------
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
    const totalEls = document.querySelectorAll("#tasks li");
    const completedEls = document.querySelectorAll("#tasks li.completed");
    const progressSection = document.querySelector("header .progress");

    if (!progressSection || !progressFill) return;

    const percent = totalEls.length > 0 ? (completedEls.length / totalEls.length) * 100 : 0;
    progressFill.style.width = percent + "%";

    if (completedEls.length > 0) {
      progressSection.style.opacity = 1;
      progressFill.classList.add("flash");

      setTimeout(() => {
        progressFill.classList.remove("flash");
        progressSection.style.opacity = 0;
      }, 3000);
    } else {
      progressSection.style.opacity = 0;
    }
  }

  // ------------------------------
  // TASK BUTTONS (COMPLETE / DELETE)
  // ------------------------------
  tasksList.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;

    const taskId = li.dataset.id;
    const task = tasks.find(t => t.id == taskId);

    if (e.target.textContent === "✔") {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    } else if (e.target.textContent === "Ｘ") {
      const confirmed = confirm("Are you sure you want to delete this task?");
      if (confirmed) {
        tasks = tasks.filter(t => t.id != taskId);
        saveTasks();
        renderTasks();
      }
    }
  });

  // ------------------------------
  // GOOEY TABS LOGIC
  // ------------------------------
  const tabs = document.querySelectorAll(".tab");
  const indicator = document.querySelector(".tab-indicator");

  function moveIndicator(tab) {
    indicator.style.width = tab.offsetWidth + "px";
    indicator.style.left = tab.offsetLeft + "px";
  }

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      moveIndicator(tab);

      currentFilter = tab.dataset.filter;
      renderTasks();
    });
  });

  moveIndicator(document.querySelector(".tab.active"));

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
    if (aiDropdown.classList.contains("open")) AIInput.focus();
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

  // ------------------------------
  // CALENDAR PICKER
  // ------------------------------
  const calendarBtn = document.getElementById("calendarBtn");
  if (calendarBtn && dateInput && typeof dateInput.showPicker === "function") {
    calendarBtn.addEventListener("click", () => {
      dateInput.style.pointerEvents = "auto";
      dateInput.focus();
      dateInput.showPicker();
      setTimeout(() => { dateInput.style.pointerEvents = "none"; }, 0);
    });
  }

  // ------------------------------
  // SERVICE WORKER
  // ------------------------------
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js")
      .then(() => console.log("Service Worker registered"));
  }

  // ------------------------------
  // INITIAL RENDER
  // ------------------------------
  renderTasks();
});