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
  const categorySelect = document.getElementById("categorySelect");
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

  let categories = JSON.parse(localStorage.getItem("categories")) || ["all", "work", "school", "planner", "personal"];
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let selectedCategory = "all";
  let currentFilter = "all";
  let splashDismissed = false;
  let minScrollTop = 0;
  let introRemoved = false;
  let draggedElement = null;
  let draggedTaskId = null;
  
  dropdownToggle.addEventListener("click", () => {
    dropdownMenu.classList.toggle("show");
  
    const arrow = document.getElementById("chooseCatArrow");
    if (arrow) {
      arrow.classList.toggle("rotated", dropdownMenu.classList.contains("show"));
  }
  });
  
  // ------------------------------
  // INTRO DISMISS ON SCROLL
  // ------------------------------
  // ------------------------------



  const onScrollCheck = () => {
    if (splashDismissed || introRemoved) return;

    const inputTop = inputArea.getBoundingClientRect().top;
    const headerBottom = header.getBoundingClientRect().bottom;
    const scrollY = window.scrollY;

    // Animate intro text as user scrolls
    if (introWrapper && scrollY > 0) {
      const maxScroll = 150; // Distance to complete fade
      const progress = Math.min(scrollY / maxScroll, 1);
      
      // Move up and fade out
      introWrapper.style.transform = `translateY(-${progress * 30}px)`;
      introWrapper.style.opacity = 1 - progress;
    }

    // When input area reaches the header, dismiss intro
    if (inputTop <= headerBottom + 5) { // small buffer
      splashDismissed = true;
      introRemoved = true;

      // Remove intro wrapper with fade effect
      if (introWrapper) {
        introWrapper.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        introWrapper.style.opacity = '0';
        introWrapper.style.transform = 'translateY(-30px)';
        setTimeout(() => {
          if (introWrapper.parentNode) {
            introWrapper.remove();
            document.body.classList.add('intro-dismissed');

            // Wait for layout to settle, then calculate minimum scroll position
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                // Calculate where the input should stick (accounting for sentinel)
                const sentinelHeight = parseInt(getComputedStyle(sentinel).height) || 30;
                minScrollTop = sentinelHeight;
                
                // Add scroll lock listeners after everything is settled
                window.addEventListener("scroll", lockScroll, { passive: false });
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
      window.scrollTo({ top: minScrollTop, behavior: 'instant' });
    }
  };



  window.addEventListener("scroll", onScrollCheck, { passive: true });


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
    const category = selectedCategory || "school";
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
  // DROPDOWN FUNCTIONS
  // ------------------------------
  
  function renderDropdown() {
    dropdownMenu.innerHTML = "";

    categories.forEach(cat => {
      const item = document.createElement("div");
      item.className = "dropdown-item";

      // Label text
      const label = document.createElement("span");
      label.className = "dropdown-label";
      label.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);

      // Delete button
      const delBtn = document.createElement("button");
      delBtn.textContent = "×";
      delBtn.className = "dropdown-delete";
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteCategory(cat);
      });

      // Assemble item
      item.appendChild(label);
      item.appendChild(delBtn);

      // Click handler for selecting category
      item.addEventListener("click", () => {
        selectedCategory = cat.toLowerCase();
        dropdownToggle.innerHTML = `
          ${label.textContent}
          <span id="chooseCatArrow"><img src="dropdown-arrow.svg" alt=""></span>
        `;
        const tab = document.querySelector(`.tab[data-filter="${cat}"]`);
        if (tab) activateTab(tab);
        dropdownMenu.classList.remove("show");
      
        const arrow = document.getElementById("chooseCatArrow");
        if (arrow) arrow.classList.remove("rotated");
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
          localStorage.setItem("categories", JSON.stringify(categories));

          // Create tab
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
    categories = categories.filter(c => c !== cat);
    localStorage.setItem("categories", JSON.stringify(categories));
    const tab = document.querySelector(`.tab[data-filter="${cat}"]`);
    if (tab) tab.remove();
    renderDropdown();
    const allTab = document.querySelector('.tab[data-filter="all"]');
    if (allTab) activateTab(allTab);
  }

  renderDropdown();
  renderTabs();
  
  
  function renderTabs() {
    // Clear existing tabs except indicator
    document.querySelectorAll(".tab-group .tab").forEach(t => t.remove());

    categories.forEach((cat, index) => {
      const tab = document.createElement("div");
      tab.className = "tab";
      tab.dataset.filter = cat;
      tab.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);

      if (index === 0) tab.classList.add("active"); // make "all" active by default

      tab.addEventListener("click", () => activateTab(tab));
      tabGroup.insertBefore(tab, indicator);
    });

    // Position indicator under the active tab
    const activeTab = document.querySelector(".tab.active");
    if (activeTab) moveIndicator(activeTab);
  }

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

    const dragBtn = document.createElement("button");
    dragBtn.className = "drag-btn";
    dragBtn.innerHTML = `<img src="icons8-drag-handle-90.png" alt="Reorder task" class="drag-icon" />`;
    dragBtn.setAttribute("draggable", "false");

    const completeBtn = document.createElement("button");
    completeBtn.textContent = "✔";

    const taskTextSpan = document.createElement("span");
    taskTextSpan.textContent = task.text;

    const categorySpan = document.createElement("span");
    categorySpan.textContent =
      task.category.charAt(0).toUpperCase() + task.category.slice(1);
    categorySpan.className = "task-category";

    // Only create date span if a date exists
    let dateSpan = null;
    if (task.date) {
      dateSpan = document.createElement("span");
      dateSpan.textContent = formatDate(task.date);
      dateSpan.className = "task-date";
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = `<img src="icons8-trash.svg" alt="Delete task" class="delete-icon" />`;

    const flagBtn = document.createElement("button");
    flagBtn.className = "flag-btn";
    flagBtn.innerHTML = `<img src="icons8-flag-96.png" alt="Flag task" class="flag-icon" />`;

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.innerHTML = `<img src="icons8-edit-96.png" alt="Edit task" class="edit-icon" />`;

    const actions = document.createElement("div");
    actions.className = "task-actions";
    actions.appendChild(editBtn);
    actions.appendChild(flagBtn);
    actions.appendChild(deleteBtn);

    // Append in correct order
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
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }
  
  // ------------------------------
  // DRAG AND DROP HANDLERS
  // ------------------------------
  function handleDragStart(e) {
    draggedElement = e.currentTarget;
    draggedTaskId = draggedElement.dataset.id;
    e.currentTarget.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    // Only allow vertical movement - ignore horizontal position
    const afterElement = getDragAfterElement(tasksList, e.clientY);
    const draggable = draggedElement;
    
    // Remove any existing drop indicator classes
    document.querySelectorAll(".drop-above, .drop-below").forEach(el => {
      el.classList.remove("drop-above", "drop-below");
    });
    
    if (afterElement == null) {
      // Dragging to the bottom - add gap below last item
      const lastItem = tasksList.querySelector("li:not(.dragging):last-child");
      if (lastItem) {
        lastItem.classList.add("drop-below");
      }
      tasksList.appendChild(draggable);
    } else {
      // Add gap above the element we're hovering over
      afterElement.classList.add("drop-above");
      tasksList.insertBefore(draggable, afterElement);
    }
    
    return false;
  }

  function handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    // Reorder the tasks array based on current DOM order
    const reorderedTasks = [];
    const listItems = tasksList.querySelectorAll("li");
    
    listItems.forEach(li => {
      const taskId = li.dataset.id;
      const task = tasks.find(t => t.id == taskId);
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
    
    // Clean up all drop indicator classes
    document.querySelectorAll(".drop-above, .drop-below").forEach(el => {
      el.classList.remove("drop-above", "drop-below");
    });
    
    draggedElement = null;
    draggedTaskId = null;
  }

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
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

    const isCompleteBtn = e.target.closest("button") && e.target.closest("button").textContent.includes("✔");
    const isDeleteBtn = e.target.closest("button")?.classList.contains("delete-btn");

    if (e.target.textContent === "✔") {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    } else if (isDeleteBtn) {
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


  document.getElementById("theme-toggle").addEventListener("change", function () {
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
  renderTabs();
});
