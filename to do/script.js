(() => {
  "use strict";

  const STORAGE_KEY = "taskflow.todos.v1";


  let todos = [];
  let currentFilter = "all"; // "all" | "active" | "completed"
  let editingId = null;

  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const list = document.getElementById("todo-list");
  const emptyState = document.getElementById("empty-state");
  const itemsLeft = document.getElementById("items-left");
  const filtersWrap = document.getElementById("filters");
  const clearCompletedBtn = document.getElementById("clear-completed");
  const template = document.getElementById("todo-item-template");

  
  function saveTodos() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (err) {
      console.error("Could not save todos to localStorage:", err);
    }
  }

  function loadTodos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      todos = raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error("Could not read todos from localStorage:", err);
      todos = [];
    }
  }

  
  function generateId() {
    return `todo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function getFilteredTodos() {
    switch (currentFilter) {
      case "active":
        return todos.filter((t) => !t.completed);
      case "completed":
        return todos.filter((t) => t.completed);
      default:
        return todos;
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function addTodo(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    todos.unshift({
      id: generateId(),
      text: trimmed,
      completed: false,
    });

    saveTodos();
    render();
  }

  function deleteTodo(id) {
    todos = todos.filter((t) => t.id !== id);
    saveTodos();
    render();
  }

  function toggleTodo(id) {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    todo.completed = !todo.completed;
    saveTodos();
    render();
  }

  function updateTodoText(id, newText) {
    const trimmed = newText.trim();
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    if (!trimmed) {
      // Treat an emptied task as a delete
      deleteTodo(id);
      return;
    }

    todo.text = trimmed;
    saveTodos();
    render();
  }

  function clearCompleted() {
    todos = todos.filter((t) => !t.completed);
    saveTodos();
    render();
  }

 
  function render() {
    const visibleTodos = getFilteredTodos();

    list.innerHTML = "";

    if (todos.length === 0) {
      emptyState.hidden = false;
      emptyState.textContent = "No tasks here. Add one above to get started ✨";
    } else if (visibleTodos.length === 0) {
      emptyState.hidden = false;
      emptyState.textContent = `No ${currentFilter} tasks.`;
    } else {
      emptyState.hidden = true;
    }

    const fragment = document.createDocumentFragment();

    visibleTodos.forEach((todo) => {
      const node = template.content.firstElementChild.cloneNode(true);

      node.dataset.id = todo.id;
      node.classList.toggle("is-completed", todo.completed);
      node.classList.toggle("is-editing", todo.id === editingId);

      const checkbox = node.querySelector(".todo-item__checkbox");
      checkbox.checked = todo.completed;

      const textEl = node.querySelector(".todo-item__text");
      textEl.textContent = todo.text;

      const editInput = node.querySelector(".todo-item__edit-input");
      editInput.value = todo.text;

      fragment.appendChild(node);
    });

    list.appendChild(fragment);


    if (editingId) {
      const editingRow = list.querySelector(`[data-id="${editingId}"]`);
      if (editingRow) {
        const editInput = editingRow.querySelector(".todo-item__edit-input");
        editInput.focus();
        editInput.select();
      }
    }

    updateFooter();
  }

  function updateFooter() {
    const activeCount = todos.filter((t) => !t.completed).length;
    itemsLeft.textContent = `${activeCount} item${activeCount === 1 ? "" : "s"} left`;
  }

  function setFilter(filter) {
    currentFilter = filter;

    [...filtersWrap.children].forEach((btn) => {
      const isActive = btn.dataset.filter === filter;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });

    render();
  }

 
  function enterEditMode(id) {
    editingId = id;
    render();
  }

  function exitEditMode(id, commit, newValue) {
    editingId = null;
    if (commit) {
      updateTodoText(id, newValue);
    } else {
      render();
    }
  }

 

  // Create: form submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addTodo(input.value);
    input.value = "";
    input.focus();
  });


  filtersWrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".filters__btn");
    if (!btn) return;
    setFilter(btn.dataset.filter);
  });


  clearCompletedBtn.addEventListener("click", clearCompleted);

 
  list.addEventListener("click", (e) => {
    const row = e.target.closest(".todo-item");
    if (!row) return;
    const id = row.dataset.id;

    if (e.target.closest(".todo-item__delete-btn")) {
      deleteTodo(id);
      return;
    }

    if (e.target.closest(".todo-item__edit-btn")) {
      enterEditMode(id);
      return;
    }
  });

 
  list.addEventListener("change", (e) => {
    if (e.target.classList.contains("todo-item__checkbox")) {
      const row = e.target.closest(".todo-item");
      toggleTodo(row.dataset.id);
    }
  });

 
  list.addEventListener("keydown", (e) => {
    if (!e.target.classList.contains("todo-item__edit-input")) return;
    const row = e.target.closest(".todo-item");
    const id = row.dataset.id;

    if (e.key === "Enter") {
      exitEditMode(id, true, e.target.value);
    } else if (e.key === "Escape") {
      exitEditMode(id, false);
    }
  });

  list.addEventListener(
    "blur",
    (e) => {
      if (!e.target.classList.contains("todo-item__edit-input")) return;
      const row = e.target.closest(".todo-item");
      const id = row.dataset.id;
      if (editingId === id) {
        exitEditMode(id, true, e.target.value);
      }
    },
    true 
  );

 
  function init() {
    loadTodos();
    setFilter("all"); 
    input.focus();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
