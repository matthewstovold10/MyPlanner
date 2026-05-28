// --- FIREBASE FIRESTORE IMPORTS ---
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const db = window.db;

let currentUser = "guest";

let categories = [];
let tasks = [];

let selectedCategory = "all";
let currentFilter = "all";
let splashDismissed = false;
let minScrollTop = 0;
let introRemoved = false;
let draggedElement = null;
let draggedTaskId = null;
let scrollingToTop = false;
let currentView = "list";
let calendarDate = new Date();
let _progressInitialised = false;
let _progressVisible = false;
let _progressHideTimer = null;

let taskInput;
let dateInput;
let addTaskBtn;
let tasksList;
let progressFill;
let themeToggle;
let searchToggleBtn;
let searchDropdown;
let searchArrow;
let searchSubmit;
let searchInput;
let searchOutput;
let responseSection;
let tabGroup;
let indicator;
let dropdownToggle;
let dropdownMenu;
let header;
let inputArea;
let introWrapper;
let sentinel;
let calendarBtn;
let scrollTopBtn;
let scrollTopBtnRight;

document.addEventListener("DOMContentLoaded", () => {
  console.log("Script loaded");

  taskInput = document.getElementById("taskInput");
  dateInput = document.getElementById("dateAdd");
  addTaskBtn = document.getElementById("addTask");
  tasksList = document.getElementById("tasks");
  progressFill = document.getElementById("progressFill");
  themeToggle = document.getElementById("theme-toggle");
  searchToggleBtn = document.getElementById("searchToggle");
  searchDropdown = document.getElementById("searchDropdown");
  searchArrow = document.getElementById("searchArrow");
  searchSubmit = document.getElementById("searchSubmit");
  searchInput = document.getElementById("searchInput");
  searchOutput = document.getElementById("searchOutput");
  responseSection = document.querySelector(".search-response");
  tabGroup = document.querySelector(".tab-group");
  indicator = document.querySelector(".tab-indicator");
  dropdownToggle = document.getElementById("dropdownToggle");
  dropdownMenu = document.getElementById("dropdownMenu");
  header = document.querySelector("header");
  inputArea = document.querySelector(".input-area");
  introWrapper = document.getElementById("introWrapper");
  sentinel = document.getElementById("introSentinel");
  calendarBtn = document.getElementById("calendarBtn");
  scrollTopBtn = document.getElementById("scrollTopBtn");
  scrollTopBtnRight = document.getElementById("scrollTopBtnRight");

  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = savedTheme || (prefersDark ? "dark" : "light");

  document.documentElement.setAttribute("data-theme", theme);
  if (theme === "dark") themeToggle.classList.add("theme-toggle--toggled");

  injectToastStyles();
  loadUserData();

  // ------------------------------
  // EVENT LISTENERS
  // ------------------------------

  // Throttle scroll handlers to one execution per animation frame
  function rafThrottle(fn) {
    let rafId = null;
    return function (...args) {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        fn.apply(this, args);
        rafId = null;
      });
    };
  }

  // Scroll-to-top button — lifts lock, restores intro, scrolls back up
  function scrollToTopAction() {
    window.removeEventListener("scroll", lockScroll);
    splashDismissed = false;
    introRemoved = false;
    minScrollTop = 0;
    scrollingToTop = true;

    if (introWrapper) {
      introWrapper.style.display = "";
      introWrapper.style.opacity = "1";
      introWrapper.style.transform = "translateY(0)";
      introWrapper.style.transition = "opacity 0.4s ease, transform 0.4s ease";
    }

    document.body.classList.remove("intro-dismissed");
    scrollTopBtn.classList.remove("visible");
    if (scrollTopBtnRight) scrollTopBtnRight.classList.remove("visible");
    window.scrollTo({ top: 0, behavior: "smooth" });

    setTimeout(() => {
      scrollingToTop = false;
    }, 800);
  }

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", scrollToTopAction);
  }
  if (scrollTopBtnRight) {
    scrollTopBtnRight.addEventListener("click", scrollToTopAction);
  }

  dropdownToggle.addEventListener("click", () => {
    dropdownMenu.classList.toggle("show");

    const arrow = document.getElementById("chooseCatArrow");
    if (arrow) {
      arrow.classList.toggle(
        "rotated",
        dropdownMenu.classList.contains("show"),
      );
    }
  });

  document.addEventListener("click", (e) => {
    if (
      dropdownMenu.classList.contains("show") &&
      !dropdownToggle.contains(e.target) &&
      !dropdownMenu.contains(e.target)
    ) {
      dropdownMenu.classList.remove("show");
      const arrow = document.getElementById("chooseCatArrow");
      if (arrow) arrow.classList.remove("rotated");
    }
  });

  addTaskBtn.addEventListener("click", () => {
    const text = taskInput.value.trim();
    const date = dateInput.value;
    const category = selectedCategory || "school";
    if (text) {
      const newTask = {
        id: Date.now(),
        text,
        date: date || null,
        category,
        completed: false,
        flagged: false,
      };

      tasks.push(newTask);
      taskInput.value = "";
      dateInput.value = "";
      saveTasks();
      renderTasks();
    }
  });

  tasksList.addEventListener("click", async (e) => {
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
        if (currentUser !== "guest") {
          await deleteDoc(
            doc(db, "users", currentUser, "tasks", String(taskId)),
          );
        }
        tasks = tasks.filter((t) => t.id != taskId);
        renderTasks();
      }
    } else if (isFlagBtn) {
      task.flagged = !task.flagged;
      saveTasks();
      renderTasks();
    }
  });

  themeToggle.addEventListener("click", function () {
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    const theme = isDark ? "light" : "dark";
    const newBg = theme === "dark" ? "#1e1e1e" : "#f5f5f5";

    // Cover the page with a GPU-composited overlay while tiles repaint
    const veil = document.createElement("div");
    veil.style.cssText = `position:fixed;inset:0;z-index:99999;pointer-events:none;background:${newBg};opacity:0;transition:opacity 0.07s ease`;
    document.body.appendChild(veil);

    requestAnimationFrame(() => {
      veil.style.opacity = "1";
      setTimeout(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
        themeToggle.classList.toggle("theme-toggle--toggled", theme === "dark");
        // Wait for browser to finish repainting all tiles before revealing
        setTimeout(() => {
          veil.style.transition = "opacity 0.12s ease";
          veil.style.opacity = "0";
          veil.addEventListener("transitionend", () => veil.remove(), {
            once: true,
          });
        }, 60);
      }, 70);
    });
  });

  searchToggleBtn.addEventListener("click", () => {
    searchDropdown.classList.toggle("open");
    searchArrow.classList.toggle("rotated");
    document
      .querySelector(".main-content")
      .classList.toggle(
        "search-open",
        searchDropdown.classList.contains("open"),
      );
    if (searchDropdown.classList.contains("open")) searchInput.focus();
  });

  searchSubmit.addEventListener("click", () => {
    const query = searchInput.value.trim().toLowerCase();

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

  document.getElementById("searchReset").addEventListener("click", () => {
    searchInput.value = "";
    searchInput.focus();
    renderTasks();
  });

  const viewToggle = document.getElementById("viewToggle");
  viewToggle.addEventListener("click", () => {
    currentView = currentView === "list" ? "calendar" : "list";
    const isCalendar = currentView === "calendar";
    viewToggle.classList.toggle("active", isCalendar);
    viewToggle.innerHTML = isCalendar
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> List`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Calendar`;
    renderTasks();
  });

  // Calendar picker
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

  // Enter key — add task
  taskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTaskBtn.click();
  });

  // Enter key — trigger search
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchSubmit.click();
  });

  // Scroll handlers
  window.addEventListener("scroll", rafThrottle(onScrollCheck), {
    passive: true,
  });
  window.addEventListener("scroll", rafThrottle(positionScrollBtn), {
    passive: true,
  });
  // Window resize
  window.addEventListener("resize", () => {
    const activeTab = document.querySelector(".tab.active");
    if (activeTab) {
      moveIndicator(activeTab);
    }
    positionScrollBtn();
  });

  // ── Mobile FAB + bottom drawer ──
  const overlay = document.createElement("div");
  overlay.className = "drawer-overlay";
  document.body.appendChild(overlay);

  const fab = document.createElement("button");
  fab.className = "mobile-fab";
  fab.setAttribute("aria-label", "Add task");
  fab.textContent = "+";
  document.body.appendChild(fab);

  function openDrawer() {
    inputArea.classList.add("drawer-open");
    overlay.classList.add("visible");
    fab.classList.add("fab-open");
    taskInput.focus(); // must be synchronous (within user gesture) for iOS
  }

  function closeDrawer() {
    inputArea.classList.remove("drawer-open");
    overlay.classList.remove("visible");
    fab.classList.remove("fab-open");
    taskInput.blur();
  }

  fab.addEventListener("click", () => {
    inputArea.classList.contains("drawer-open") ? closeDrawer() : openDrawer();
  });

  overlay.addEventListener("click", closeDrawer);

  addTaskBtn.addEventListener("click", () => {
    setTimeout(closeDrawer, 120);
  });

  window.addEventListener("userLoggedIn", () => {
    const firebaseUser = window.currentFirebaseUser;
    currentUser = firebaseUser ? firebaseUser.uid : "guest";
    loadUserData();
  });
});

// ------------------------------
// IN-APP TOAST NOTIFICATIONS
// ------------------------------
let toastChecked = false;

function injectToastStyles() {
  if (document.getElementById("toast-styles")) return;
  const style = document.createElement("style");
  style.id = "toast-styles";
  style.textContent = `
    .toast-container {
      position: fixed;
      top: 30px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      z-index: 10000;
      pointer-events: none;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      font-size: 14px;
      font-weight: 500;
      pointer-events: all;
      min-width: 260px;
      max-width: 90vw;
      animation: toastIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      cursor: pointer;
    }
    .toast.toast-today {
      background: #c0392b;
      color: #fff;
    }
    .toast.toast-tomorrow {
      background: #d48f07;
      color: #fff;
    }
    [data-theme="dark"] .toast.toast-today {
      background: #ff3838ff;
    }
    [data-theme="dark"] .toast.toast-tomorrow {
      background: #fbbf24;
    }
    .toast-icon {
      font-size: 20px;
      flex-shrink: 0;
    }
    .toast-text {
      flex: 1;
    }
    .toast-title {
      font-weight: 700;
      margin-bottom: 2px;
    }
    .toast-body {
      opacity: 0.9;
      font-size: 13px;
    }
    .toast-close {
      background: none;
      border: none;
      color: rgba(255,255,255,0.8);
      font-size: 18px;
      cursor: pointer;
      padding: 0 2px;
      line-height: 1;
      flex-shrink: 0;
    }
    .toast-close:hover {
      color: #fff;
    }
    .toast.toast-hiding {
      animation: toastOut 0.3s ease forwards;
    }
    @keyframes toastIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    @keyframes toastOut {
      from {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      to {
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
      }
    }
  `;
  document.head.appendChild(style);
}

function showToast(title, message, type = "today", duration = 6000) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === "today" ? "⚠️" : "📅"}</span>
    <div class="toast-text">
      <div class="toast-title">${title}</div>
      <div class="toast-body">${message}</div>
    </div>
    <button class="toast-close" aria-label="Dismiss">✕</button>
  `;

  const dismiss = () => {
    toast.classList.add("toast-hiding");
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector(".toast-close").addEventListener("click", dismiss);
  toast.addEventListener("click", dismiss);

  container.appendChild(toast);
  setTimeout(dismiss, duration);
}

function getLocalDateStr(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function checkDueTasks() {
  if (toastChecked) return;
  toastChecked = true;

  const now = new Date();
  const todayStr = getLocalDateStr(now);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getLocalDateStr(tomorrow);

  const dueToday = tasks.filter((t) => t.date === todayStr && !t.completed);
  const dueTomorrow = tasks.filter(
    (t) => t.date === tomorrowStr && !t.completed,
  );

  // Stagger the toasts slightly if both fire
  if (dueToday.length > 0) {
    showToast(
      "Due Today!",
      `You have ${dueToday.length} task${dueToday.length > 1 ? "s" : ""} due today.`,
      "today",
    );
  }

  if (dueTomorrow.length > 0) {
    setTimeout(
      () => {
        showToast(
          "Due Tomorrow",
          `You have ${dueTomorrow.length} task${dueTomorrow.length > 1 ? "s" : ""} due tomorrow.`,
          "tomorrow",
        );
      },
      dueToday.length > 0 ? 400 : 0,
    );
  }
}

// ------------------------------
// LOAD USER DATA
// ------------------------------
async function loadUserData() {
  console.log("Loading user data for:", currentUser);

  if (currentUser === "guest") {
    categories = ["all", "work", "school", "planner", "personal"];
    tasks = [];
    renderTabs();
    renderDropdown();
    renderTasks();
    return;
  }

  const userRef = doc(db, "users", currentUser);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    categories = snap.data().categories || [
      "all",
      "work",
      "school",
      "planner",
      "personal",
    ];
  } else {
    categories = ["all", "work", "school", "planner", "personal"];
    await setDoc(userRef, { categories });
  }

  const tasksRef = collection(db, "users", currentUser, "tasks");
  onSnapshot(tasksRef, (snapshot) => {
    tasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderTabs();
    renderDropdown();
    renderTasks();
    checkDueTasks();
  });
  applyCategoryStyles("all");
}

// ------------------------------
// INTRO DISMISS ON SCROLL
// ------------------------------
const onScrollCheck = () => {
  if (splashDismissed || introRemoved || scrollingToTop) return;

  // On mobile let the intro scroll naturally — never hide it or lock scroll
  if (window.innerWidth <= 768) return;

  const inputTop = inputArea.getBoundingClientRect().top;
  const headerBottom = header.getBoundingClientRect().bottom;
  const scrollY = window.scrollY;

  if (introWrapper && scrollY > 0) {
    const maxScroll = 150;
    const progress = Math.min(scrollY / maxScroll, 1);
    introWrapper.style.transform = `translateY(-${progress * 30}px)`;
    introWrapper.style.opacity = 1 - progress;
  }

  // Trigger when the intro section has scrolled up past the header bottom.
  // Using introWrapper's bottom (not inputArea top) so this fires correctly
  // regardless of what sticky `top` value the input area has.
  const introBottom = introWrapper
    ? introWrapper.getBoundingClientRect().bottom
    : 0;
  if (introBottom <= headerBottom + 5) {
    splashDismissed = true;
    introRemoved = true;

    if (introWrapper) {
      introWrapper.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      introWrapper.style.opacity = "0";
      introWrapper.style.transform = "translateY(-30px)";
      setTimeout(() => {
        // Hide instead of remove so it can be restored by the scroll-top button
        introWrapper.style.display = "none";
        document.body.classList.add("intro-dismissed");

        if (scrollTopBtn) {
          scrollTopBtn.classList.add("visible");
          if (scrollTopBtnRight) scrollTopBtnRight.classList.add("visible");
          positionScrollBtn();
        }

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
      }, 300);
    }
  }
};

const lockScroll = () => {
  if (!introRemoved || minScrollTop === 0) return;
  if (window.innerWidth <= 768) return;
  if (window.scrollY < minScrollTop) {
    window.scrollTo({ top: minScrollTop, behavior: "instant" });
  }
};

// ------------------------------
// POSITION SCROLL-TOP BUTTON
// Keeps the ↑ arrow vertically centred with the sticky input bar
// regardless of which category tab is active.
// ------------------------------
function positionScrollBtn() {
  if (!scrollTopBtn || !inputArea) return;
  const rect = inputArea.getBoundingClientRect();
  const centre = rect.top + rect.height / 2 + "px";
  scrollTopBtn.style.top = centre;
  if (scrollTopBtnRight) scrollTopBtnRight.style.top = centre;
}

// ------------------------------
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
        background-color: ${colors.light} !important;
        border-color: ${colors.lightBorder} !important;
        color: #000 !important;
      }

      [data-theme="dark"] .cat-${cat} {
        background-color: ${colors.dark};
        border-color: ${colors.darkBorder};
        color: #f0f0f0;
      }

      [data-theme="dark"] .tab[data-filter="${cat}"].active {
        background-color: ${colors.dark} !important;
        border-color: ${colors.darkBorder} !important;
        color: #fff !important;
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
  // Wait for the browser to re-layout after renderTasks before reading getBoundingClientRect
  requestAnimationFrame(() => positionScrollBtn());
}

function moveIndicator(tab) {
  indicator.style.width = tab.offsetWidth + "px";
  indicator.style.height = tab.offsetHeight + "px";
  indicator.style.left = tab.offsetLeft + "px";
  indicator.style.top = tab.offsetTop + "px";
}

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
async function saveCategoriesOnly() {
  if (currentUser === "guest") return;

  const userRef = doc(db, "users", currentUser);
  await updateDoc(userRef, { categories });
}

// ------------------------------
// RENDER TABS
// ------------------------------
function renderTabs() {
  document.querySelectorAll(".tab-group .tab").forEach((t) => t.remove());

  categories.forEach((cat, index) => {
    // Apply category styles immediately
    if (cat !== "") {
      applyCategoryStyles(cat);
    }

    const tab = document.createElement("div");
    tab.className = "tab";
    tab.dataset.filter = cat;
    tab.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);

    if (cat === currentFilter) tab.classList.add("active");

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
    // Flagged incomplete always first
    const aFlagged = a.flagged && !a.completed;
    const bFlagged = b.flagged && !b.completed;
    if (aFlagged !== bFlagged) return aFlagged ? -1 : 1;

    // Completed always last
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    // Both auto (no drag order): sort by date, soonest first, no-date last
    if (a.manualOrder == null && b.manualOrder == null) {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date) - new Date(b.date);
    }

    // Both manually ordered: respect drag position
    if (a.manualOrder != null && b.manualOrder != null)
      return a.manualOrder - b.manualOrder;

    // Mixed: auto-sorted (null) appears before manually-ordered ones
    return a.manualOrder == null ? -1 : 1;
  });

  if (currentView === "calendar") {
    renderCalendar(taskArray);
    return;
  }

  tasksList.innerHTML = "";

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
      dateSpan.textContent = formatDateWithDay(task.date);
      if (!task.completed) {
        const urgency = getDateUrgency(task.date);
        if (urgency) dateSpan.classList.add(`date-${urgency}`);
      }
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

    const taskBody = document.createElement("div");
    taskBody.className = "task-body";

    const taskMeta = document.createElement("div");
    taskMeta.className = "task-meta";
    taskMeta.appendChild(categorySpan);
    if (dateSpan) taskMeta.appendChild(dateSpan);

    taskBody.appendChild(taskTextSpan);
    taskBody.appendChild(taskMeta);

    li.appendChild(taskBody);
    li.appendChild(actions);

    li.setAttribute("draggable", "true");
    li.addEventListener("dragstart", handleDragStart);
    li.addEventListener("dragover", handleDragOver);
    li.addEventListener("drop", handleDrop);
    li.addEventListener("dragend", handleDragEnd);

    tasksList.appendChild(li);
  });

  if (tasksList.querySelectorAll("li").length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML =
      window.innerWidth <= 480
        ? '<p class="empty-state-text">No tasks yet — tap <strong>+</strong> to add one!</p>'
        : '<p class="empty-state-text">No tasks yet — add one above!</p>';
    tasksList.appendChild(empty);
  }

  updateProgress();
}

function renderCalendar(taskArray = tasks) {
  tasksList.innerHTML = "";

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  let filtered = taskArray;
  if (currentFilter !== "all") {
    filtered = filtered.filter(
      (t) => (t.category || "").toLowerCase() === currentFilter,
    );
  }

  // ── Header: prev / month title / next ──
  const hdr = document.createElement("div");
  hdr.className = "cal-header";

  const prevBtn = document.createElement("button");
  prevBtn.className = "cal-nav";
  prevBtn.textContent = "‹";
  prevBtn.addEventListener("click", () => {
    calendarDate = new Date(year, month - 1, 1);
    renderTasks();
  });

  const nextBtn = document.createElement("button");
  nextBtn.className = "cal-nav";
  nextBtn.textContent = "›";
  nextBtn.addEventListener("click", () => {
    calendarDate = new Date(year, month + 1, 1);
    renderTasks();
  });

  const titleEl = document.createElement("span");
  titleEl.className = "cal-title";
  titleEl.textContent = calendarDate.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  hdr.append(prevBtn, titleEl, nextBtn);
  tasksList.appendChild(hdr);

  // ── Day-of-week labels ──
  const labels = document.createElement("div");
  labels.className = "cal-grid cal-day-labels";
  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((d) => {
    const el = document.createElement("div");
    el.className = "cal-label";
    el.textContent = d;
    labels.appendChild(el);
  });
  tasksList.appendChild(labels);

  // ── Day grid ──
  const grid = document.createElement("div");
  grid.className = "cal-grid";

  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = getLocalDateStr(new Date());

  // group tasks by date
  const byDate = {};
  filtered.forEach((t) => {
    if (t.date) (byDate[t.date] = byDate[t.date] || []).push(t);
  });

  // empty leading cells
  for (let i = 0; i < firstDayOfWeek; i++) {
    const empty = document.createElement("div");
    empty.className = "cal-day cal-day--empty";
    grid.appendChild(empty);
  }

  const pad = (n) => String(n).padStart(2, "0");
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
    const dayTasks = byDate[dateStr] || [];

    const cell = document.createElement("div");
    cell.className = "cal-day";
    if (dateStr === todayStr) cell.classList.add("cal-day--today");

    const num = document.createElement("span");
    num.className = "cal-day-num";
    num.textContent = d;
    cell.appendChild(num);

    dayTasks.forEach((task) => {
      const chip = document.createElement("div");
      chip.className = `cal-task cat-${task.category.toLowerCase()}`;
      if (task.completed) chip.classList.add("cal-task--done");
      chip.textContent = task.text;
      chip.title = task.text;
      chip.addEventListener("click", (e) => {
        e.stopPropagation();
        showCalendarTaskPopup(task, chip);
      });
      cell.appendChild(chip);
    });

    grid.appendChild(cell);
  }
  tasksList.appendChild(grid);

  // ── Undated tasks ──
  const undated = filtered.filter((t) => !t.date);
  if (undated.length) {
    const section = document.createElement("div");
    section.className = "cal-undated";
    const lbl = document.createElement("h4");
    lbl.textContent = "No due date";
    section.appendChild(lbl);
    undated.forEach((task) => {
      const chip = document.createElement("div");
      chip.className = `cal-task cat-${task.category.toLowerCase()}`;
      if (task.completed) chip.classList.add("cal-task--done");
      chip.textContent = task.text;
      chip.addEventListener("click", (e) => {
        e.stopPropagation();
        showCalendarTaskPopup(task, chip);
      });
      section.appendChild(chip);
    });
    tasksList.appendChild(section);
  }

  updateProgress();
}

// ------------------------------
// CALENDAR TASK POPUP
// ------------------------------
function showCalendarTaskPopup(task, chip) {
  closeCalendarPopup();

  const popup = document.createElement("div");
  popup.id = "cal-task-popup";
  popup.className = "cal-task-popup";

  // Text input
  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.className = "edit-text-input";
  textInput.value = task.text;

  // Complete toggle button
  const completeBtn = document.createElement("button");
  completeBtn.className =
    "cal-popup-complete-btn" + (task.completed ? " completed" : "");
  completeBtn.textContent = task.completed ? "✓ Completed" : "Mark complete";
  completeBtn.addEventListener("click", () => {
    task.completed = !task.completed;
    completeBtn.textContent = task.completed ? "✓ Completed" : "Mark complete";
    completeBtn.classList.toggle("completed", task.completed);
    saveTasks();
    renderTasks();
  });
  // Category select
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

  // Date picker
  const dateWrapper = document.createElement("div");
  dateWrapper.className = "cal-popup-date-row";
  const calButton = document.createElement("button");
  calButton.className = "edit-calendar-btn cal-popup-cal-btn";
  calButton.type = "button";
  calButton.innerHTML = `<img src="img/icons8-calendar-24.png" alt="Calendar" />`;
  const editDateInput = document.createElement("input");
  editDateInput.type = "date";
  editDateInput.className = "edit-date-input";
  editDateInput.value = task.date || "";
  const dateLabel = document.createElement("span");
  dateLabel.className = "cal-popup-date-label";
  dateLabel.textContent = task.date
    ? formatDateWithDay(task.date)
    : "No date set";
  editDateInput.addEventListener("change", () => {
    dateLabel.textContent = editDateInput.value
      ? formatDateWithDay(editDateInput.value)
      : "No date set";
  });
  calButton.addEventListener("click", (e) => {
    e.stopPropagation();
    editDateInput.showPicker?.();
  });

  dateWrapper.appendChild(calButton);
  dateWrapper.appendChild(dateLabel);
  dateWrapper.appendChild(editDateInput);

  // Save / Cancel buttons
  const buttonGroup = document.createElement("div");
  buttonGroup.className = "edit-buttons";
  const saveBtn = document.createElement("button");
  saveBtn.className = "edit-save-btn";
  saveBtn.textContent = "Save";
  saveBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    saveEdit(
      task,
      textInput.value,
      categoryDropdown.value,
      editDateInput.value,
    );
    closeCalendarPopup();
  });
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "edit-cancel-btn";
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeCalendarPopup();
  });
  buttonGroup.appendChild(saveBtn);
  buttonGroup.appendChild(cancelBtn);

  popup.appendChild(textInput);
  popup.appendChild(completeBtn);
  popup.appendChild(categoryWrapper);
  popup.appendChild(dateWrapper);
  popup.appendChild(buttonGroup);

  document.body.appendChild(popup);

  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    // Mobile: CSS bottom-sheet handles position — just make visible
    requestAnimationFrame(() => popup.classList.add("visible"));

    // Backdrop overlay
    let backdrop = document.getElementById("cal-popup-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "cal-popup-backdrop";
      backdrop.style.cssText = backdrop.style.cssText =
        "position:fixed;inset:0;background:rgba(0,0,0,0.42);z-index:1999;";
      document.body.appendChild(backdrop);
      requestAnimationFrame(() => (backdrop.style.opacity = "1"));
    }
    backdrop.addEventListener("click", closeCalendarPopup);
  } else {
    // Desktop: position above/below the chip
    popup.style.top = "-9999px";
    popup.style.left = "-9999px";
    requestAnimationFrame(() => {
      const rect = chip.getBoundingClientRect();
      const popupH = popup.offsetHeight;
      const popupW = popup.offsetWidth;
      const inputBarBottom = inputArea
        ? inputArea.getBoundingClientRect().bottom
        : 80;
      const isBelow = rect.top - popupH - 8 < inputBarBottom;
      let top = isBelow
        ? rect.bottom + window.scrollY + 8
        : rect.top + window.scrollY - popupH - 8;
      if (isBelow) popup.classList.add("cal-task-popup--below");
      let left = rect.left + window.scrollX + rect.width / 2 - popupW / 2;
      left = Math.max(
        8,
        Math.min(left, window.scrollX + window.innerWidth - popupW - 8),
      );
      popup.style.top = top + "px";
      popup.style.left = left + "px";
      popup.classList.add("visible");
    });
    setTimeout(
      () => document.addEventListener("click", calPopupOutsideClick),
      0,
    );
  }
}

function calPopupOutsideClick(e) {
  const popup = document.getElementById("cal-task-popup");
  if (popup && !popup.contains(e.target)) closeCalendarPopup();
}

function closeCalendarPopup() {
  const popup = document.getElementById("cal-task-popup");
  if (popup) popup.remove();
  const backdrop = document.getElementById("cal-popup-backdrop");
  if (backdrop) backdrop.remove();
  document.removeEventListener("click", calPopupOutsideClick);
}

function formatDate(dateString) {
  const options = { day: "numeric", month: "short", year: "numeric" };
  return new Date(dateString).toLocaleDateString("en-GB", options);
}

function formatDateWithDay(dateString) {
  const d = new Date(dateString + "T00:00:00");
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getDateUrgency(dateString) {
  if (!dateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateString + "T00:00:00");
  const diffDays = Math.floor((due - today) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "overdue";
  if (diffDays <= 5) return "soon";
  return null;
}

async function saveTasks() {
  if (currentUser === "guest") return;

  const tasksRef = collection(db, "users", currentUser, "tasks");

  // Save each task
  for (const task of tasks) {
    const taskRef = doc(tasksRef, String(task.id));
    await setDoc(taskRef, task, { merge: true });
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
  arrow.style.cssText =
    "position:absolute; right:8px; top:0; height:100%; display:flex; align-items:center; pointer-events:none;";
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

  const dateLabel = document.createElement("span");
  dateLabel.className = "edit-date-label";
  dateLabel.textContent = task.date
    ? formatDateWithDay(task.date)
    : "No date set";

  const editDateInput = document.createElement("input");
  editDateInput.type = "date";
  editDateInput.className = "edit-date-input";
  editDateInput.value = task.date || "";

  editDateInput.addEventListener("change", () => {
    dateLabel.textContent = editDateInput.value
      ? formatDateWithDay(editDateInput.value)
      : "No date set";
  });

  calButton.addEventListener("click", () => {
    editDateInput.showPicker?.();
  });

  dateWrapper.appendChild(calButton);
  dateWrapper.appendChild(dateLabel);
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
      editDateInput.value,
    );
  });

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "edit-cancel-btn";
  cancelBtn.style.setProperty("background-color", "#f45045", "important");
  cancelBtn.style.setProperty("color", "white", "important");
  cancelBtn.style.setProperty("border", "none", "important");
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

  const flagged = reorderedTasks.filter((t) => t.flagged);
  const unflagged = reorderedTasks.filter((t) => !t.flagged);
  tasks = [...flagged, ...unflagged];
  tasks.forEach((t, i) => {
    t.manualOrder = i;
  });

  saveTasks();
  renderTasks();

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
    { offset: Number.NEGATIVE_INFINITY },
  ).element;
}

// ------------------------------
// UPDATE PROGRESS
// ------------------------------
function updateProgress() {
  const progressSection = document.querySelector("header .progress");

  const visibleTasks =
    currentFilter === "all"
      ? tasks
      : tasks.filter((t) => (t.category || "").toLowerCase() === currentFilter);

  const total = visibleTasks.length;
  const completed = visibleTasks.filter((t) => t.completed).length;
  const percent = total > 0 ? (completed / total) * 100 : 0;

  progressFill.style.width = percent + "%";

  if (!_progressInitialised) {
    _progressInitialised = true;
    return;
  }

  if (completed > 0 && !_progressVisible) {
    _progressVisible = true;
    progressSection.style.opacity = 1;
    document.body.classList.add("progress-active");
    progressFill.classList.add("flash");
    clearTimeout(_progressHideTimer);
    _progressHideTimer = setTimeout(() => {
      progressFill.classList.remove("flash");
      progressSection.style.opacity = 0;
      _progressVisible = false;
      _progressHideTimer = null;
      setTimeout(() => {
        document.body.classList.remove("progress-active");
      }, 500);
    }, 3000);
  } else if (completed === 0) {
    clearTimeout(_progressHideTimer);
    _progressHideTimer = null;
    progressSection.style.opacity = 0;
    _progressVisible = false;
    document.body.classList.remove("progress-active");
  }
}
// ------------------------------
// SERVICE WORKER
// ------------------------------
if ("serviceWorker" in navigator) {
  let refreshing = false;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then((registration) => {
        console.log("[Page] Service Worker registered successfully");

        // Check for updates every 30 seconds
        setInterval(() => {
          registration.update();
        }, 30000);

        // Handle updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          console.log("[Page] New service worker found");

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New version available
              console.log("[Page] New version ready");
              showUpdateBanner(registration);
            }
          });
        });

        // Check if there's already an update waiting
        if (registration.waiting) {
          console.log("[Page] Update already waiting");
          showUpdateBanner(registration);
        }
      })
      .catch((error) => {
        console.error("[Page] Service Worker registration failed:", error);
      });
  });

  // Show update notification banner
  function showUpdateBanner(registration) {
    // Don't show multiple banners
    if (document.getElementById("update-banner")) return;

    const banner = document.createElement("div");
    banner.id = "update-banner";
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #4caf50, #45a049);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      z-index: 10000;
      display: flex;
      gap: 20px;
      align-items: center;
      font-family: Arial, sans-serif;
      font-size: 15px;
      animation: slideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      max-width: 90%;
    `;

    // Check theme for dark mode styling
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      banner.style.background = "linear-gradient(135deg, #3a7afe, #1e5fcf)";
    }

    banner.innerHTML = `
      <span style="flex: 1;">
        <strong>✨ New version available!</strong>
      </span>
      <button id="updateNowBtn" style="
        background: white;
        color: ${isDark ? "#3a7afe" : "#4caf50"};
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      ">
        Update Now
      </button>
      <button id="dismissUpdateBtn" style="
        background: transparent;
        color: white;
        border: 2px solid white;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: background 0.2s ease;
      ">
        Later
      </button>
    `;

    document.body.appendChild(banner);

    // Add animation styles
    if (!document.getElementById("update-banner-styles")) {
      const style = document.createElement("style");
      style.id = "update-banner-styles";
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(-50%) translateY(-100px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
          to {
            transform: translateX(-50%) translateY(-100px);
            opacity: 0;
          }
        }
        #updateNowBtn:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        #dismissUpdateBtn:hover {
          background: rgba(255,255,255,0.2);
        }
      `;
      document.head.appendChild(style);
    }

    document.getElementById("updateNowBtn").addEventListener("click", () => {
      const btn = document.getElementById("updateNowBtn");
      btn.textContent = "Updating...";
      btn.disabled = true;

      if (registration && registration.waiting) {
        // Tell the waiting SW to activate
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
      // Force reload after short delay regardless — don't rely on controllerchange
      setTimeout(() => window.location.reload(), 500);
    });

    document
      .getElementById("dismissUpdateBtn")
      .addEventListener("click", () => {
        banner.style.animation = "slideOut 0.3s ease forwards";
        setTimeout(() => banner.remove(), 300);
      });
  }
}
