document.addEventListener("DOMContentLoaded", () => {
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
            tasks.splice(index, 1);
            saveTasks();
            renderTasks();
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

    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark");
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
  dropdown.classList.toggle("open");

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
});


