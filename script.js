document.addEventListener("DOMContentLoaded", () => {
    // ------------------------------
    // TASK SYSTEM
    // ------------------------------
    console.log("Script loaded");

    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

    const taskInput = document.getElementById("taskInput");
    const addTaskBtn = document.getElementById("addTask");
    const tasksList = document.getElementById("tasks");
    const progressFill = document.getElementById("progressFill");
    const themeToggle = document.getElementById("themeToggle");

    // Add new task
    addTaskBtn.addEventListener("click", () => {
        const text = taskInput.value.trim();
        if (text) {
            tasks.push({ text, completed: false });
            taskInput.value = "";
            saveTasks();
            renderTasks();
        }
    });

    // Event delegation for task buttons
    tasksList.addEventListener("click", (e) => {
        const li = e.target.closest("li");
        if (!li) return;
        const index = Array.from(tasksList.children).indexOf(li);

        if (e.target.textContent === "✔") {
            tasks[index].completed = !tasks[index].completed;
            li.classList.toggle("completed");
            saveTasks();
            updateProgress();
        } else if (e.target.textContent === "Ｘ") {
          tasks = tasks.filter(t => t.id != taskId); // remove from array
          saveTasks();
          li.remove(); // remove only this task from DOM
          updateProgress(); // recalc progress bar
}
    });

    function renderTasks() {
        tasksList.innerHTML = "";

        tasks.forEach((task) => {
            const li = document.createElement("li");

            const completeBtn = document.createElement("button");
            completeBtn.textContent = "✔";

            const span = document.createElement("span");
            span.textContent = task.text;
            span.className = task.completed ? "completed" : "";
            
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Ｘ";

            li.appendChild(completeBtn);
            li.appendChild(span);
            li.appendChild(deleteBtn);

            tasksList.appendChild(li);
        });

        updateProgress();
    }

    function saveTasks() {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    function updateProgress() {
        const completed = tasks.filter(t => t.completed).length;
        const percent = tasks.length ? (completed / tasks.length) * 100 : 0;
        progressFill.style.width = percent + "%";
    }

    
    // Theme toggle button
const themeToggleBtn = document.getElementById("themeToggle");

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  // Optional: change button icon depending on mode
  if (document.body.classList.contains("dark")) {
    themeToggle.textContent = "☀️"; // switch to sun icon
  } else {
    themeToggle.textContent = "🌙"; // switch to moon icon
  }
});

    renderTasks();

    // ------------------------------
    // AI FEATURE (SAFE FRONTEND)
    // ------------------------------
  // ------------------------------
// Ask AI Dropdown Toggle
// ------------------------------
document.getElementById("askAIToggle").addEventListener("click", function () {
  const dropdown = document.getElementById("aiDropdown");
  askAIToggleBtn?.addEventListener("click", () => {
    aiDropdown.classList.toggle("open");
    askAIArrow.classList.toggle("rotated");
    console.log("AI dropdown:", aiDropdown.classList.contains("open") ? "open" : "closed");
  });
});
  // Auto-focus input when opening
  if (dropdown.classList.contains("open")) {
    document.getElementById("AIInput").focus();
  }
});

// ------------------------------
// Ask AI Submit
// ------------------------------
document.getElementById("askAISubmit").addEventListener("click", function () {
  const query = document.getElementById("AIInput").value.trim();
  const output = document.getElementById("AIOutput");
  const responseSection = document.querySelector(".ai-response");

  if (query) {
    responseSection.classList.add("show");   // reveal the response box
    output.textContent = "You asked AI: " + query;
    document.getElementById("AIInput").value = "";
  } else {
    responseSection.classList.add("show");
    output.textContent = "Please enter a question for the AI.";
  }
});



    // ------------------------------
    // TASK SYSTEM
    // ------------------------------
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

    const taskInput = document.getElementById("taskInput");
    const addTaskBtn = document.getElementById("addTask");
    const tasksList = document.getElementById("tasks");
    const progressFill = document.getElementById("progressFill");
    const themeToggle = document.getElementById("themeToggle");

    // Add new task
    addTaskBtn.addEventListener("click", () => {
        const text = taskInput.value.trim();
        if (text) {
            tasks.push({ id: Date.now(), text, completed: false }); // unique ID
            taskInput.value = "";
            saveTasks();
            renderTasks();
        }
    });

    // Event delegation for task buttons
    tasksList.addEventListener("click", (e) => {
        const li = e.target.closest("li");
        if (!li) return;
          const taskId = li.dataset.id; // read ID from li
        if (e.target.textContent === "✔") {
            const task = tasks.find(t => t.id == taskId);
            task.completed = !task.completed;
            li.classList.toggle("completed");
          saveTasks();
          updateProgress();
        } else if (e.target.textContent === "Ｘ") {
            tasks = tasks.filter(t => t.id != taskId); // delete only that task
          saveTasks();
          renderTasks();
    }
});

    function renderTasks() {
    tasksList.innerHTML = "";

    tasks.forEach((task) => {
        const li = document.createElement("li");
        li.dataset.id = task.id; // attach ID to li

        const completeBtn = document.createElement("button");
        completeBtn.textContent = "✔";

        const span = document.createElement("span");
        span.textContent = task.text;
        span.className = task.completed ? "completed" : "";
        
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Ｘ";

        li.appendChild(completeBtn);
        li.appendChild(span);
        li.appendChild(deleteBtn);

        tasksList.appendChild(li);
    });


        updateProgress();
    }

    function saveTasks() {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    function updateProgress() {
        const completed = tasks.filter(t => t.completed).length;
        const percent = tasks.length ? (completed / tasks.length) * 100 : 0;
        progressFill.style.width = percent + "%";
    }

    
    


    renderTasks();

    // ------------------------------
    // AI FEATURE (SAFE FRONTEND)
    // ------------------------------
  // ------------------------------
// Ask AI Dropdown Toggle
// ------------------------------
const askAIToggleBtn = document.getElementById("askAIToggle");
  const aiDropdown = document.getElementById("aiDropdown");
  const askAIArrow = document.getElementById("askAIArrow");

  askAIToggleBtn?.addEventListener("click", () => {
    aiDropdown.classList.toggle("open");
    askAIArrow.classList.toggle("rotated");
    console.log("AI dropdown:", aiDropdown.classList.contains("open") ? "open" : "closed");
  });

// ------------------------------
// Ask AI Submit
// ------------------------------
document.getElementById("askAISubmit").addEventListener("click", function () {
  const query = document.getElementById("AIInput").value.trim();
  const output = document.getElementById("AIOutput");
  const resonseSection = document.querySelector(".ai-response");
  if (query) {
    // Show the response section
    responseSection.classList.add("show");
    
    // For now just echo the query — replace with real AI logic later
    output.textContent = "You asked AI: " + query;
    document.getElementById("AIInput").value = "";
  } else {
    responseSection.classList.add("show");
    output.textContent = "Please enter a question for the AI.";
  }
});



