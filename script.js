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
  const themeToggle = document.getElementById("theme-toggle");
  const askAIToggleBtn = document.getElementById("askAIToggle");
  const aiDropdown = document.getElementById("aiDropdown");
  const askAIArrow = document.getElementById("askAIArrow");
  const askAISubmit = document.getElementById("askAISubmit");
  const AIInput = document.getElementById("AIInput");
  const AIOutput = document.getElementById("AIOutput");
  const responseSection = document.querySelector(".ai-response");
  const tabGroup = document.querySelector(".tab-group");
  const indicator = document.querySelector(".tab-indicator");
  const dropdownToggle = document.getElementById("dropdownToggle");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = savedTheme || (prefersDark ? "dark" : "light");
  const header = document.querySelector("header");
  const inputArea = document.querySelector(".input-area");
  const introWrapper = document.getElementById("introWrapper");
  const sentinel = document.getElementById("introSentinel");

  document.documentElement.setAttribute("data-theme", theme);
  document.getElementById("theme-toggle").checked = theme === "dark";

  // Get current user
  let currentUser = localStorage.getItem("currentUser") || "guest";

  // Load user-specific data
  function loadUserData() {
    currentUser = localStorage.getItem("currentUser") || "guest";
    const users = JSON.parse(localStorage.getItem("users")) || {};

    if (currentUser === "guest") {
      // Guest gets a fresh session each time
      categories = ["all", "work", "school", "planner", "personal"];
      tasks = [];
    } else if (users[currentUser]) {
      // Load user's saved data
      categories = users[currentUser].categories || [
        "all",
        "work",
        "school",
        "planner",
        "personal",
      ];
      tasks = users[currentUser].tasks || [];
    } else {
      // Fallback
      categories = ["all", "work", "school", "planner", "personal"];
      tasks = [];
    }
  }

  let categories = [];
  loadUserData();
  let selectedCategory = "all";
  let currentFilter = "all";
  let splashDismissed = false;
  let minScrollTop = 0;
  let introRemoved = false;
  let draggedElement = null;
  let draggedTaskId = null;

  // ------------------------------
  // MAIN CATEGORY DROPDOWN (TOP INPUT)
  // ------------------------------
  dropdownToggle.addEventListener("click", () => {
    dropdownMenu.classList.toggle("show");

    const arrow = document.getElementById("chooseCatArrow");
    if (arrow) {
      arrow.classList.toggle(
        "rotated",
        dropdownMenu.classList.contains("show")
      );
    }
  });

  // ------------------------------
  // INTRO DISMISS ON SCROLL
  // ------------------------------
  const onScrollCheck = () => {
    if (splashDismissed || introRemoved) return;

    const inputTop = inputArea.getBoundingClientRect().top;
    const headerBottom = header.getBoundingClientRect().bottom;
    const scrollY = window.scrollY;

    if (introWrapper && scrollY > 0) {
      const maxScroll = 150;
      const progress = Math.min(scrollY / maxScroll, 1);
      introWrapper.style.transform = `translateY(-${progress * 30}px)`;
      introWrapper.style.opacity = 1 - progress;
    }

    if (inputTop <= headerBottom + 5) {
      splashDismissed = true;
      introRemoved = true;

      if (introWrapper) {
        introWrapper.style.transition =
          "opacity 0.3s ease, transform 0.3s ease";
        introWrapper.style.opacity = "0";
        introWrapper.style.transform = "translateY(-30px)";
        setTimeout(() => {
          if (introWrapper.parentNode) {
            introWrapper.remove();
            document.body.classList.add("intro-dismissed");

            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                const sentinelHeight =
                  parseInt(getComputedStyle(sentinel).height) || 30;
                minScrollTop = sentinelHeight;

                window.addEventListener("scroll", lockScroll, {
                  passive: false,
                });
              });
            });
          }
        }, 300);
      }
    }
  };

  const lockScroll = () => {
    if (!introRemoved || minScrollTop === 0) return;
    if (window.scrollY < minScrollTop) {
      window.scrollTo({ top: minScrollTop, behavior: "instant" });
    }
  };

  window.addEventListener("scroll", onScrollCheck, { passive: true });

  // ------------------------------
  // COLOR GENERATION
  // ------------------------------
  const predefinedColors = [
    {
      light: "hsl(210, 70%, 85%)",
      lightBorder: "hsl(210, 70%, 55%)",
      dark: "hsla(210, 70%, 40%, 0.25)",
      darkBorder: "hsl(210, 70%, 60%)",
    },
    {
      light: "hsl(350, 70%, 85%)",
      lightBorder: "hsl(350, 70%, 55%)",
      dark: "hsla(350, 70%, 40%, 0.25)",
      darkBorder: "hsl(350, 70%, 60%)",
    },
    {
      light: "hsl(120, 70%, 85%)",
      lightBorder: "hsl(120, 70%, 55%)",
      dark: "hsla(120, 70%, 40%, 0.25)",
      darkBorder: "hsl(120, 70%, 60%)",
    },
    {
      light: "hsl(280, 70%, 85%)",
      lightBorder: "hsl(280, 70%, 55%)",
      dark: "hsla(280, 70%, 40%, 0.25)",
      darkBorder: "hsl(280, 70%, 60%)",
    },
    {
      light: "hsl(40, 70%, 85%)",
      lightBorder: "hsl(40, 70%, 55%)",
      dark: "hsla(40, 70%, 40%, 0.25)",
      darkBorder: "hsl(40, 70%, 60%)",
    },
    {
      light: "hsl(180, 70%, 85%)",
      lightBorder: "hsl(180, 70%, 55%)",
      dark: "hsla(180, 70%, 40%, 0.25)",
      darkBorder: "hsl(180, 70%, 60%)",
    },
    {
      light: "hsl(320, 70%, 85%)",
      lightBorder: "hsl(320, 70%, 55%)",
      dark: "hsla(320, 70%, 40%, 0.25)",
      darkBorder: "hsl(320, 70%, 60%)",
    },
    {
      light: "hsl(160, 70%, 85%)",
      lightBorder: "hsl(160, 70%, 55%)",
      dark: "hsla(160, 70%, 40%, 0.25)",
      darkBorder: "hsl(160, 70%, 60%)",
    },
    {
      light: "hsl(60, 70%, 85%)",
      lightBorder: "hsl(60, 70%, 55%)",
      dark: "hsla(60, 70%, 40%, 0.25)",
      darkBorder: "hsl(60, 70%, 60%)",
    },
    {
      light: "hsl(250, 70%, 85%)",
      lightBorder: "hsl(250, 70%, 55%)",
      dark: "hsla(250, 70%, 40%, 0.25)",
      darkBorder: "hsl(250, 70%, 60%)",
    },
  ];

  function generateColorForCategory(cat) {
    const categoryIndex = categories.indexOf(cat.toLowerCase());

    if (categoryIndex >= 0 && categoryIndex < predefinedColors.length) {
      return predefinedColors[categoryIndex];
    }

    const extraIndex = categoryIndex - predefinedColors.length;
    const hue = (extraIndex * 137.5) % 360;

    return {
      light: `hsl(${hue}, 70%, 85%)`,
      lightBorder: `hsl(${hue}, 70%, 55%)`,
      dark: `hsla(${hue}, 70%, 40%, 0.25)`,
      darkBorder: `hsl(${hue}, 70%, 60%)`,
    };
  }

  function applyCategoryStyles(cat) {
    const colors = generateColorForCategory(cat);
    const styleId = `cat-style-${cat}`;

    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      .cat-${cat} {
        background-color: ${colors.light};
        border: 1px solid ${colors.lightBorder};
        color: #000;
      }

      .tab[data-filter="${cat}"] {
        border-radius: 20px;
        border: 1px solid transparent;
      }
      
      .tab[data-filter="${cat}"].active {
        color: #000;
      }

      [data-theme="dark"] .cat-${cat} {
        background-color: ${colors.dark};
        border-color: ${colors.darkBorder};
        color: #f0f0f0;
      }

      [data-theme="dark"] .tab[data-filter="${cat}"].active {
        color: #fff;
      }

      .tab-indicator.cat-${cat} {
        background-color: ${colors.light} !important;
        border: 2px solid ${colors.lightBorder} !important;
        height: 30px;
      }

      [data-theme="dark"] .tab-indicator.cat-${cat} {
        background-color: ${colors.dark} !important;
        border: 2px solid ${colors.darkBorder} !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ------------------------------
  // TAB ACTIVATION
  // ------------------------------
  function activateTab(tab) {
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    indicator.className = "tab-indicator";
    indicator.classList.add(`cat-${tab.dataset.filter}`);
    moveIndicator(tab);
    currentFilter = tab.dataset.filter;
    renderTasks();
  }

  function moveIndicator(tab) {
    indicator.style.width = tab.offsetWidth + "px";
    indicator.style.height = tab.offsetHeight + "px";
    indicator.style.left = tab.offsetLeft + "px";
    indicator.style.top = tab.offsetTop + "px";
  }

  // ------------------------------
  // ADD TASK
  // ------------------------------
  addTaskBtn.addEventListener("click", () => {
    const text = taskInput.value.trim();
    const date = dateInput.value;
    const category = selectedCategory || "school";
    if (text) {
      tasks.push({
        id: Date.now(),
        text,
        date: date || null,
        category,
        completed: false,
        flagged: false,
      });

      taskInput.value = "";
      dateInput.value = "";
      saveTasks();
      renderTasks();
    }
  });

  // ------------------------------
  // MAIN CATEGORY DROPDOWN OPTIONS
  // ------------------------------
  function renderDropdown() {
    dropdownMenu.innerHTML = "";

    categories.forEach((cat) => {
      const item = document.createElement("div");
      item.className = "dropdown-item";

      const label = document.createElement("span");
      label.className = "dropdown-label";
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
        selectedCategory = cat.toLowerCase();
        currentFilter = cat.toLowerCase();
        dropdownToggle.innerHTML = `
          ${label.textContent}
          <span id="chooseCatArrow"><img src="img/dropdown-arrow.svg" alt=""></span>
        `;
        const tab = document.querySelector(`.tab[data-filter="${cat}"]`);
        if (tab) {
          activateTab(tab);
        } else {
          renderTasks();
        }
        dropdownMenu.classList.remove("show");

        const arrow = document.getElementById("chooseCatArrow");
        if (arrow) arrow.classList.remove("rotated");
      });

      dropdownMenu.appendChild(item);
    });

    const addItem = document.createElement("div");
    addItem.className = "dropdown-add";
    addItem.textContent = "Add Category...";
    addItem.addEventListener("click", () => {
      const newCat = prompt("Enter a new category name:");
      if (newCat && newCat.trim() !== "") {
        const value = newCat.trim().toLowerCase();
        if (!categories.includes(value)) {
          categories.push(value);
          saveCategoriesOnly();

          applyCategoryStyles(value);

          const tab = document.createElement("div");
          tab.className = "tab";
          tab.dataset.filter = value;
          tab.textContent = newCat.trim();
          tabGroup.insertBefore(tab, indicator);
          tab.addEventListener("click", () => activateTab(tab));

          renderDropdown();
          renderTabs();
        }
      }
    });
    dropdownMenu.appendChild(addItem);
  }

  function deleteCategory(cat) {
    categories = categories.filter((c) => c !== cat);
    saveCategoriesOnly();
    const tab = document.querySelector(`.tab[data-filter="${cat}"]`);
    if (tab) tab.remove();
    renderDropdown();
    const allTab = document.querySelector('.tab[data-filter="all"]');
    if (allTab) activateTab(allTab);
  }

  // Save categories separately
  function saveCategoriesOnly() {
    currentUser = localStorage.getItem("currentUser") || "guest";

    if (currentUser === "guest") {
      return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || {};

    if (users[currentUser]) {
      users[currentUser].categories = categories;
      localStorage.setItem("users", JSON.stringify(users));
    }
  }

  // ------------------------------
  // RENDER TABS
  // ------------------------------
  function renderTabs() {
    document.querySelectorAll(".tab-group .tab").forEach((t) => t.remove());

    categories.forEach((cat, index) => {
      const tab = document.createElement("div");
      tab.className = "tab";
      tab.dataset.filter = cat;
      tab.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);

      if (index === 0) tab.classList.add("active");

      tab.addEventListener("click", () => activateTab(tab));
      tabGroup.insertBefore(tab, indicator);
    });

    requestAnimationFrame(() => {
      const activeTab = document.querySelector(".tab.active");
      if (activeTab) {
        moveIndicator(activeTab);
        indicator.classList.add(`cat-${activeTab.dataset.filter}`);
      }
    });
  }

  // ------------------------------
  // RENDER TASKS
  // ------------------------------
  function renderTasks(taskArray = tasks) {
    taskArray = [...taskArray].sort((a, b) => {
      if (a.flagged === b.flagged) return 0;
      return a.flagged ? -1 : 1;
    });

    tasksList.innerHTML = "";

    taskArray.forEach((task) => {
      if (
        currentFilter !== "all" &&
        (task.category || "").toLowerCase() !== currentFilter
      )
        return;

      const li = document.createElement("li");
      li.dataset.id = task.id;
      li.dataset.category = task.category;

      if (task.completed) li.classList.add("completed");

      const dragBtn = document.createElement("button");
      dragBtn.className = "drag-btn";
      dragBtn.innerHTML = `<img src="img/icons8-drag-handle-90.png" class="drag-icon" />`;
      dragBtn.addEventListener("mousedown", () => (li._allowDrag = true));

      const completeBtn = document.createElement("button");
      completeBtn.textContent = "✓";

      const taskTextSpan = document.createElement("span");
      taskTextSpan.textContent = task.text;

      const categorySpan = document.createElement("span");
      categorySpan.className = `task-category cat-${task.category.toLowerCase()}`;
      categorySpan.textContent =
        task.category.charAt(0).toUpperCase() + task.category.slice(1);

      applyCategoryStyles(task.category.toLowerCase());

      let dateSpan = null;
      if (task.date) {
        dateSpan = document.createElement("span");
        dateSpan.className = "task-date";
        dateSpan.textContent = formatDate(task.date);
      }

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.innerHTML = `<img src="img/icons8-trash.svg" class="delete-icon" />`;

      const flagBtn = document.createElement("button");
      flagBtn.className = "flag-btn";
      flagBtn.innerHTML = task.flagged
        ? `<img src="img/icons8-flag-96-2.png" class="flag-icon" />`
        : `<img src="img/icons8-flag-96.png" class="flag-icon" />`;

      const editBtn = document.createElement("button");
      editBtn.className = "edit-btn";
      editBtn.innerHTML = `<img src="img/icons8-edit-96.png" class="edit-icon" />`;
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        enterEditMode(li, task);
      });

      const actions = document.createElement("div");
      actions.className = "task-actions";
      actions.appendChild(editBtn);
      actions.appendChild(flagBtn);
      actions.appendChild(deleteBtn);

      li.appendChild(dragBtn);
      li.appendChild(completeBtn);
      li.appendChild(taskTextSpan);
      li.appendChild(categorySpan);
      if (dateSpan) li.appendChild(dateSpan);
      li.appendChild(actions);

      li.setAttribute("draggable", "true");
      li.addEventListener("dragstart", handleDragStart);
      li.addEventListener("dragover", handleDragOver);
      li.addEventListener("drop", handleDrop);
      li.addEventListener("dragend", handleDragEnd);

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
    currentUser = localStorage.getItem("currentUser") || "guest";

    if (currentUser === "guest") {
      // Don't save guest tasks permanently
      return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || {};

    if (users[currentUser]) {
      users[currentUser].tasks = tasks;
      users[currentUser].categories = categories;
      localStorage.setItem("users", JSON.stringify(users));
    }
  }

  function autoSizeSelect(selectEl) {
    const temp = document.createElement("span");
    temp.style.visibility = "hidden";
    temp.style.position = "fixed";
    temp.style.whiteSpace = "nowrap";
    temp.style.fontSize = window.getComputedStyle(selectEl).fontSize;
    temp.style.fontFamily = window.getComputedStyle(selectEl).fontFamily;
    temp.textContent = selectEl.options[selectEl.selectedIndex].text;

    document.body.appendChild(temp);
    const width = temp.getBoundingClientRect().width + 40; // padding + arrow
    document.body.removeChild(temp);

    selectEl.style.width = width + "px";
  }

  // ------------------------------
  // EDIT MODE FUNCTIONS
  // ------------------------------
  function enterEditMode(li, task) {
    li.dataset.editMode = "true";
    li.innerHTML = "";
    li.classList.add("editing");

    const editForm = document.createElement("div");
    editForm.className = "edit-form";

    // TEXT INPUT
    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.className = "edit-text-input";
    textInput.value = task.text;

    // CATEGORY SELECT (native + custom arrow)
    const categoryWrapper = document.createElement("div");
    categoryWrapper.className = "edit-select-wrapper";

    const categoryDropdown = document.createElement("select");
    categoryDropdown.className = "edit-category-select";

    categories.forEach((cat) => {
      if (cat === "all") return;
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      if (cat === task.category) option.selected = true;
      categoryDropdown.appendChild(option);
    });

    const arrow = document.createElement("span");
    arrow.className = "edit-select-arrow";
    arrow.innerHTML = `<img src="img/dropdown-arrow.svg">`;

    categoryWrapper.appendChild(categoryDropdown);
    categoryWrapper.appendChild(arrow);

    // DATE PICKER
    const dateWrapper = document.createElement("div");
    dateWrapper.className = "edit-date-wrapper";

    const calButton = document.createElement("button");
    calButton.className = "edit-calendar-btn";
    calButton.type = "button";
    calButton.innerHTML = `<img src="img/icons8-calendar-24.png" alt="Calendar" />`;

    const editDateInput = document.createElement("input");
    editDateInput.type = "date";
    editDateInput.className = "edit-date-input";
    editDateInput.value = task.date || "";

    calButton.addEventListener("click", () => {
      editDateInput.showPicker?.();
    });

    dateWrapper.appendChild(calButton);
    dateWrapper.appendChild(editDateInput);

    // BUTTONS
    const buttonGroup = document.createElement("div");
    buttonGroup.className = "edit-buttons";

    const saveBtn = document.createElement("button");
    saveBtn.className = "edit-save-btn";
    saveBtn.textContent = "Save";
    saveBtn.addEventListener("click", () => {
      saveEdit(
        task,
        textInput.value,
        categoryDropdown.value,
        editDateInput.value
      );
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "edit-cancel-btn";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => {
      renderTasks();
    });

    buttonGroup.appendChild(saveBtn);
    buttonGroup.appendChild(cancelBtn);

    // BUILD FORM
    editForm.appendChild(textInput);
    editForm.appendChild(categoryWrapper);
    editForm.appendChild(dateWrapper);
    editForm.appendChild(buttonGroup);

    li.appendChild(editForm);

    textInput.focus();
    textInput.select();
  }

  function saveEdit(task, newText, newCategory, newDate) {
    const trimmedText = newText.trim();
    if (!trimmedText) {
      alert("Task text cannot be empty");
      return;
    }

    task.text = trimmedText;
    task.category = newCategory;
    task.date = newDate || null;

    saveTasks();
    renderTasks();
  }

  // ------------------------------
  // DRAG AND DROP HANDLERS
  // ------------------------------
  function handleDragStart(e) {
    if (!e.currentTarget._allowDrag) {
      e.preventDefault();
      return;
    }

    draggedElement = e.currentTarget;
    draggedTaskId = draggedElement.dataset.id;
    e.currentTarget.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const afterElement = getDragAfterElement(tasksList, e.clientY);
    const draggable = draggedElement;

    document.querySelectorAll(".drop-above, .drop-below").forEach((el) => {
      el.classList.remove("drop-above", "drop-below");
    });

    if (afterElement == null) {
      const lastItem = tasksList.querySelector("li:not(.dragging):last-child");
      if (lastItem) {
        lastItem.classList.add("drop-below");
      }
      tasksList.appendChild(draggable);
    } else {
      afterElement.classList.add("drop-above");
      tasksList.insertBefore(draggable, afterElement);
    }

    return false;
  }

  function handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    const reorderedTasks = [];
    const listItems = tasksList.querySelectorAll("li");

    listItems.forEach((li) => {
      const taskId = li.dataset.id;
      const task = tasks.find((t) => t.id == taskId);
      if (task) {
        reorderedTasks.push(task);
      }
    });

    tasks = reorderedTasks;
    saveTasks();

    return false;
  }

  function handleDragEnd(e) {
    e.currentTarget.classList.remove("dragging");
    e.currentTarget._allowDrag = false;
    document.querySelectorAll(".drop-above, .drop-below").forEach((el) => {
      el.classList.remove("drop-above", "drop-below");
    });

    draggedElement = null;
    draggedTaskId = null;
  }

  function getDragAfterElement(container, y) {
    const draggableElements = [
      ...container.querySelectorAll("li:not(.dragging)"),
    ];

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;
  }

  // ------------------------------
  // UPDATE PROGRESS
  // ------------------------------
  function updateProgress() {
    const totalEls = document.querySelectorAll("#tasks li");
    const completedEls = document.querySelectorAll("#tasks li.completed");
    const progressSection = document.querySelector("header .progress");

    const percent =
      totalEls.length > 0 ? (completedEls.length / totalEls.length) * 100 : 0;
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
  // TASK BUTTON HANDLERS
  // ------------------------------
  tasksList.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;

    const taskId = li.dataset.id;
    const task = tasks.find((t) => t.id == taskId);

    const isCompleteBtn =
      e.target.closest("button") &&
      e.target.closest("button").textContent.includes("✓");
    const isDeleteBtn = e.target
      .closest("button")
      ?.classList.contains("delete-btn");
    const isFlagBtn = e.target
      .closest("button")
      ?.classList.contains("flag-btn");

    if (isCompleteBtn) {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    } else if (isDeleteBtn) {
      if (confirm("Are you sure you want to delete this task?")) {
        tasks = tasks.filter((t) => t.id != taskId);
        saveTasks();
        renderTasks();
      }
    } else if (isFlagBtn) {
      task.flagged = !task.flagged;
      saveTasks();
      renderTasks();
    }
  });

  // ------------------------------
  // THEME TOGGLE
  // ------------------------------
  document
    .getElementById("theme-toggle")
    .addEventListener("change", function () {
      const theme = this.checked ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
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
    const query = AIInput.value.trim().toLowerCase();

    if (!query) {
      renderTasks();
      return;
    }

    const results = tasks.filter((task) => {
      return (
        task.text.toLowerCase().includes(query) ||
        (task.category && task.category.toLowerCase().includes(query)) ||
        (task.date && formatDate(task.date).toLowerCase().includes(query))
      );
    });

    renderTasks(results);
  });

  // ------------------------------
  // CALENDAR PICKER (MAIN INPUT)
  // ------------------------------
  const calendarBtn = document.getElementById("calendarBtn");
  if (calendarBtn && dateInput && typeof dateInput.showPicker === "function") {
    calendarBtn.addEventListener("click", () => {
      dateInput.style.pointerEvents = "auto";
      dateInput.focus();
      dateInput.showPicker();
      setTimeout(() => {
        dateInput.style.pointerEvents = "none";
      }, 0);
    });
  }

  // ------------------------------
  // SERVICE WORKER
  // ------------------------------
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(() => console.log("Service Worker registered"));
  }

  // ------------------------------
  // INITIAL SETUP
  // ------------------------------
  renderDropdown();
  renderTabs();

  categories.forEach((cat) => {
    if (cat !== "") applyCategoryStyles(cat);
  });

  const activeTab = document.querySelector(".tab.active");
  if (activeTab) {
    indicator.className = "tab-indicator";
    indicator.classList.add(`cat-${activeTab.dataset.filter}`);
    moveIndicator(activeTab);
  }

  renderTasks();

  window.addEventListener("resize", () => {
    const activeTab = document.querySelector(".tab.active");
    if (activeTab) {
      moveIndicator(activeTab);
    }
  });

  // Listen for user login event
  window.addEventListener("userLoggedIn", () => {
    loadUserData();
    renderDropdown();
    renderTabs();

    categories.forEach((cat) => {
      if (cat !== "") applyCategoryStyles(cat);
    });

    const activeTab = document.querySelector(".tab.active");
    if (activeTab) {
      indicator.className = "tab-indicator";
      indicator.classList.add(`cat-${activeTab.dataset.filter}`);
      moveIndicator(activeTab);
    }

    renderTasks();
  });
});
