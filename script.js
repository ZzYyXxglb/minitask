
const taskInput = document.getElementById("task-input");
const addButton = document.getElementById("add-button");
const pendingList = document.getElementById("pending-list");
const completedList = document.getElementById("completed-list");
const completedToggle = document.getElementById("completed-toggle");
const taskCount = document.getElementById("task-count");
const emptyMessage = document.getElementById("empty-message");


const STORAGE_KEY = "minitask-tasks-v01";

function loadTasks() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (savedData === null) {
            return [];
        }

        const parsedData = JSON.parse(savedData);

        if (!Array.isArray(parsedData)) {
            return [];
        }

        
    const validTasks = parsedData.filter(function(task) {
        return (
            task !== null &&
            typeof task === "object" &&
            typeof task.id === "string" &&
            task.id.length > 0 &&
            typeof task.text === "string" &&
            task.text.trim() !== "" &&
            typeof task.completed === "boolean" &&
            typeof task.createdAt === "number" &&
            Number.isFinite(task.createdAt)
        );
    });

    return validTasks;

    } catch (error) {
        console.error("读取任务失败：", error);
        return [];
    }
}

let tasks = loadTasks();
let editingTaskId = null;

function isEditing() {
    return editingTaskId !== null;
}



function saveTasks() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(tasks)
        );

        return true;
    } catch (error) {
        console.error("保存任务失败：", error);
        window.alert("任务保存失败，本次修改未能保存");

        return false;
    }
}


function updateTasksSafely(changeTasks) {
    const previousTasks = structuredClone(tasks);

    changeTasks();

    if (!saveTasks()) {
        tasks = previousTasks;
        return false;
    }

    renderTasks();
    return true;
}



// 添加任务
function addTask() {
    if (isEditing()) {
    return;
    }

    const text = taskInput.value.trim();

    if (text === "") {
        return;
    }

    const task = {
        id: crypto.randomUUID(),
        text: text,
        completed: false,
        createdAt: Date.now()
    };

    const saved = updateTasksSafely(function() {
        tasks.push(task);
    });

    if (saved) {
        taskInput.value = "";
    }
}

// 切换任务的完成状态
function toggleTask(id) {
    if (isEditing()) {
    return;
    }
    
    const task = tasks.find(item => item.id === id);

    if (!task) {
        return;
    }

    updateTasksSafely(function() {
        task.completed = !task.completed;
    });
}

function startEdit(id) {
    if (editingTaskId !== null) {
        return;
    }

    editingTaskId = id;
    renderTasks();
}

function cancelEdit() {
    editingTaskId = null;
    renderTasks();
}

function saveEdit(id, newText) {
    const text = newText.trim();

    if (text === "") {
        window.alert("任务内容不能为空");
        return;
    }

    const task = tasks.find(item => item.id === id);

    if (!task) {
        return;
    }

    const saved = updateTasksSafely(function() {
        task.text = text;
    });

    if (saved) {   
        editingTaskId = null;
        renderTasks();
    }
}

function deleteTask(id) {
    if (isEditing()) {
    return;
    }
    
    const confirmed = window.confirm("确定删除这项任务吗？");

    if (!confirmed) {
        return;
    }

    updateTasksSafely(function() {
        tasks = tasks.filter(task => task.id !== id);
    });
}

// 生成一条任务对应的页面元素

function createTaskElement(task) {
    const li = document.createElement("li");
    li.className = "task-item";

    // 当前任务处于编辑状态
    if (editingTaskId === task.id) {
        li.classList.add("task-item-editing");
        const input = document.createElement("input");
        const saveButton = document.createElement("button");
        const cancelButton = document.createElement("button");
        li.classList.add("is-editing");

        input.type = "text";
        input.className = "task-edit-input";
        input.value = task.text;
        input.setAttribute("aria-label", "编辑任务文字");

        saveButton.type = "button";
        saveButton.className = "task-action";
        saveButton.textContent = "保存";

        cancelButton.type = "button";
        cancelButton.className = "task-action";
        cancelButton.textContent = "取消";

        saveButton.addEventListener("click", function() {
            saveEdit(task.id, input.value);
        });

        cancelButton.addEventListener("click", cancelEdit);

        li.appendChild(input);
        li.appendChild(saveButton);
        li.appendChild(cancelButton);

        return li;
    }

    // 正常显示任务
    const button = document.createElement("button");
    const text = document.createElement("span");
    const editButton = document.createElement("button");
    const deleteButton = document.createElement("button");
    
    button.className = "task-status";
    text.className = "task-text";
    editButton.className = "task-action";
    deleteButton.className = "task-action";

    
    if (task.completed) {
        li.classList.add("task-completed");
    }



    button.type = "button";
    button.textContent = task.completed ? "✓" : "○";
    button.setAttribute(
        "aria-label",
        task.completed ? "恢复任务" : "完成任务"
    );

    button.addEventListener("click", function() {
        toggleTask(task.id);
    });

    text.textContent = task.text;



    // 编辑按钮
    editButton.type = "button";
    editButton.textContent = "编辑";
    editButton.disabled = editingTaskId !== null;

    editButton.addEventListener("click", function() {
        startEdit(task.id);
    });

    // 删除按钮
    deleteButton.type = "button";
    deleteButton.textContent = "删除";

    deleteButton.addEventListener("click", function() {
        deleteTask(task.id);
    });

    li.appendChild(button);
    li.appendChild(text);
    li.appendChild(editButton);
    li.appendChild(deleteButton);

    return li;
}


// 根据任务数据重新绘制页面
function renderTasks() {
    pendingList.innerHTML = "";
    completedList.innerHTML = "";

    const pendingTasks = tasks.filter(
        task => !task.completed
    );

    const completedTasks = tasks.filter(
        task => task.completed
    );

    pendingTasks.forEach(function(task) {
        pendingList.appendChild(createTaskElement(task));
    });

    completedTasks.forEach(function(task) {
        completedList.appendChild(createTaskElement(task));
    });

    taskCount.textContent =
        pendingTasks.length + " 项待完成";

    emptyMessage.hidden = pendingTasks.length > 0;

    completedToggle.textContent =
        "已完成 (" + completedTasks.length + ")";
}

// 控制已完成区域展开和收起
completedToggle.addEventListener("click", function() {
    if (isEditing()) {
    return;
    }
    
    const isExpanded =
        completedToggle.getAttribute("aria-expanded") === "true";

    completedList.hidden = isExpanded;

    completedToggle.setAttribute(
        "aria-expanded",
        String(!isExpanded)
    );
});

// 监听添加按钮
addButton.addEventListener("click", addTask);

// 首次显示页面
renderTasks();
