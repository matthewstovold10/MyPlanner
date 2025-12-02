document.addEventListener("DOMContentLoaded", () => {
  console.log("Script loaded");

  // ------------------------------
  // DOM REFERENCES
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
  const tabGroup = document.querySelector(".tab-group");
  const indicator = document.querySelector(".tab-indicator");

  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let currentFilter = "all";

  // ------------------------------
  // TAB ACTIVATION HELPER
  // ------------------------------
  function activateTab(tab) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    moveIndicator(tab);
    currentFilter = tab.dataset.filter;
    renderTasks();
  }

  function moveIndicator(tab) {
    indicator.style.width = tab.offsetWidth + "px";
    indicator.style.left = tab.offsetLeft + "px";
  }

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
  // ADD NEW CATEGORY VIA DROPDOWN
  // ------------------------------
  /*categorySelect.addEventListener("change", () => {
    const val = categorySelect.value;

    // --- Step 2: Handle delete selection ---
    if (val.startsWith("__delete_")) {
      const catToDelete = val.replace("__delete_", "");

      if (confirm(`Delete category "${catToDelete}"?`)) {
        // Remove tab
        const tab = document.querySelector(`.tab[data-filter="${catToDelete}"]`);
        if (tab) tab.remove();

        // Remove both options (category + delete)
        const catOption = categorySelect.querySelector(`option[value="${catToDelete}"]`);
        const delOption = categorySelect.querySelector(`option[value="__delete_${catToDelete}"]`);
        if (catOption) catOption.remove();
        if (delOption) delOption.remove();

        // Reset filter to "all"
        const allTab = document.querySelector('.tab[data-filter="all"]');
        if (allTab) activateTab(allTab);
        categorySelect.value = "school"; // or reset to default
      } else {
        categorySelect.value = "school"; // cancel deletion
      }
      return; // stop here so we don’t run addNew logic
    }
    
    
    if (categorySelect.value === "__addNew") {
      const newCat = prompt("Enter a new category name:");
      if (newCat && newCat.trim() !== "") {
        const value = newCat.trim().toLowerCase();

        // Insert new option before "Add Category"
        const option = document.createElement("option");
        option.value = value;
        option.textContent = newCat.trim();
        categorySelect.insertBefore(option, categorySelect.querySelector("option[value='__addNew']"));

        // --- Step 1: Add paired delete option ---
        const deleteOption = document.createElement("option");
        deleteOption.value = "__delete_" + value;
        deleteOption.textContent = "❌ Delete " + newCat.trim();
        categorySelect.insertBefore(deleteOption, categorySelect.querySelector("option[value='__addNew']"));
        
        // Select the new category
        categorySelect.value = value;

        // Create new tab
        const tab = document.createElement("div");
        tab.className = "tab";
        tab.dataset.filter = value;
        tab.textContent = newCat.trim();
        tabGroup.insertBefore(tab, indicator);

        // Ensure inactive by default
        tab.classList.remove("active");
        const currentActive = document.querySelector(".tab.active");
        if (currentActive) moveIndicator(currentActive);

        // Attach click handler
        tab.addEventListener("click", () => activateTab(tab));
      } else {
        categorySelect.value = "school"; // reset if cancelled
      }
    }
  });*/

  let categories = ["school", "work", "planner", "personal"];
  const dropdownToggle = document.getElementById("dropdownToggle");
  const dropdownMenu = document.getElementById("dropdownMenu");

  dropdownToggle.addEventListener("click", () => {
    dropdownMenu.classList.toggle("show");
  });

  function renderDropdown() {
    dropdownMenu.innerHTML = "";

    categories.forEach(cat => {
      const item = document.createElement("div");
      item.className = "dropdown-item";

      const label = document.createElement("span");
      label.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);

      const delBtn = document.createElement("button");
      delBtn.textContent = "×";
      delBtn.className = "dropdown-delete";
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteCategory(cat);
      });

      item.appendChild(label);
      item.appendChild(delBtn);

      item.addEventListener("click", () => {
        dropdownToggle.textContent = label.textContent + " ▼";
        const tab = document.querySelector(`.tab[data-filter="${cat}"]`);
        if (tab) activateTab(tab);
        dropdownMenu.classList.remove("show");
      });

      dropdownMenu.appendChild(item);
    });

    // Add Category option
    const addItem = document.createElement("div");
    addItem.className = "dropdown-add";
    addItem.textContent = "Add Category...";
    addItem.addEventListener("click", () => {
      const newCat = prompt("Enter a new category name:");
      if (newCat && newCat.trim() !== "") {
        const value = newCat.trim().toLowerCase();
        if (!categories.includes(value)) {
          categories.push(value);

          // Create tab
          const tab = document.createElement("div");
          tab.className = "tab";
          tab.dataset.filter = value;
          tab.textContent = newCat.trim();
          tabGroup.insertBefore(tab, indicator);
          tab.addEventListener("click", () => activateTab(tab));

          renderDropdown();
        }
      }
    });
    dropdownMenu.appendChild(addItem);
  }

  function deleteCategory(cat) {
    categories = categories.filter(c => c !== cat);
    const tab = document.querySelector(`.tab[data-filter="${cat}"]`);
    if (tab) tab.remove();
    renderDropdown();
    const allTab = document.querySelector('.tab[data-filter="all"]');
    if (allTab) activateTab(allTab);
  }

  renderDropdown();
  
  
  // ------------------------------
  // RENDER TASKS
  // ------------------------------
  function renderTasks() {
    tasksList.innerHTML = "";

    tasks.forEach(task => {
      if (currentFilter !== "all" && (task.category || "").toLowerCase() !== currentFilter) return;

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

  function formatDate(dateString) {
    const options = { day: "numeric", month: "short", year: "numeric" };
    return new Date(dateString).toLocaleDateString("en-GB", options);
  }

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
  tasksList.addEventListener("click", e => {
    const li = e.target.closest("li");
    if (!li) return;

    const taskId = li.dataset.id;
    const task = tasks.find(t => t.id == taskId);

    if (e.target.textContent === "✔") {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    } else if (e.target.textContent === "Ｘ") {
      if (confirm("Are you sure you want to delete this task?")) {
        tasks = tasks.filter(t => t.id != taskId);
        saveTasks();
        renderTasks();
      }
    }
  });

  // ------------------------------
  // INITIAL TAB SETUP
  // ------------------------------
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => activateTab(tab));
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
