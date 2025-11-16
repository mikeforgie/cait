/* ============================================================================
   CAIT DASHBOARD - INTERACTION LOGIC
   ============================================================================ */

// Navigation Management
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.dashboard-view, .connections-view, .tasks-view, .analytics-view');
const modal = document.getElementById('aiModal');
const modalTaskName = document.getElementById('modalTaskName');

// View Navigation
navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
        e.preventDefault();

        // Remove active class from all nav items
        navItems.forEach((navItem) => navItem.classList.remove('active'));
        item.classList.add('active');

        // Hide all views
        views.forEach((view) => view.classList.remove('active'));

        // Show the selected view
        const href = item.getAttribute('href');
        if (href === '#') {
            document.querySelector('.dashboard-view').classList.add('active');
        } else {
            const viewName = href.substring(1) + '-view';
            const targetView = document.querySelector('.' + viewName);
            if (targetView) {
                targetView.classList.add('active');
            }
        }
    });
});

// Task View Toggle (List <-> Kanban)
const viewToggleBtns = document.querySelectorAll('.view-btn');
const tasksList = document.querySelector('.tasks-list');
const tasksKanban = document.querySelector('.tasks-kanban');

viewToggleBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');

        // Update active state
        viewToggleBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        // Toggle view visibility
        if (view === 'list') {
            tasksList.classList.remove('hidden');
            tasksKanban.classList.add('hidden');
        } else if (view === 'kanban') {
            tasksList.classList.add('hidden');
            tasksKanban.classList.remove('hidden');
        }
    });
});

// Filter Tasks
const filterBtns = document.querySelectorAll('.filter-btn');

filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.textContent;
        console.log('Filtering by:', filterValue);

        // TODO: Implement actual filtering logic
    });
});

// AI Generation Modal
const generateBtns = document.querySelectorAll('[data-action="generate"]');

generateBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
        const taskText = btn.closest('.task-item').querySelector('.task-content strong').textContent;
        openAIModal(taskText);
    });
});

function openAIModal(taskName) {
    modalTaskName.textContent = `Generate: ${taskName}`;
    modal.classList.remove('hidden');

    // Simulate generation process
    simulateAIGeneration();
}

function closeAIModal() {
    modal.classList.add('hidden');
}

function simulateAIGeneration() {
    const preview = modal.querySelector('.modal-preview');
    const spinner = preview.querySelector('.spinner');

    // Show spinner for 2 seconds
    setTimeout(() => {
        spinner.innerHTML = '';
        preview.innerHTML = `
            <div style="text-align: left; width: 100%;">
                <h4 style="margin-bottom: 12px; color: #111827; font-weight: 600;">Generated Content</h4>
                <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
                    This is AI-generated content that would be customized based on your specific needs.
                    You can review, edit, or regenerate before applying it to your site.
                </p>
            </div>
        `;
    }, 2000);
}

// Modal Close Button
const modalClose = modal.querySelector('.modal-close');
const modalCancelBtn = modal.querySelector('[data-action="close-modal"]');

if (modalClose) {
    modalClose.addEventListener('click', closeAIModal);
}

if (modalCancelBtn) {
    modalCancelBtn.addEventListener('click', closeAIModal);
}

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeAIModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAIModal();
    }
});

// Task Checkbox Interaction
const taskCheckboxes = document.querySelectorAll('.task-item input[type="checkbox"]');

taskCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
        const taskItem = checkbox.closest('.task-item');

        if (checkbox.checked) {
            taskItem.classList.add('completed');
            taskItem.classList.remove('in-progress', 'todo');
            console.log('Task marked as completed');
        } else {
            taskItem.classList.remove('completed');
            console.log('Task marked as incomplete');
        }
    });
});

// Connection Card Interactions
const connectionCards = document.querySelectorAll('.connection-card');

connectionCards.forEach((card) => {
    if (card.classList.contains('add-more')) {
        card.addEventListener('click', () => {
            console.log('Browse more connections');
            // TODO: Navigate to connection marketplace
        });
    }
});

// Kanban Drag & Drop
let draggedCard = null;

const kanbanCards = document.querySelectorAll('.kanban-card');
const kanbanColumns = document.querySelectorAll('.kanban-cards');

kanbanCards.forEach((card) => {
    card.addEventListener('dragstart', (e) => {
        draggedCard = card;
        card.style.opacity = '0.5';
    });

    card.addEventListener('dragend', (e) => {
        card.style.opacity = '1';
        draggedCard = null;
    });
});

kanbanColumns.forEach((column) => {
    column.addEventListener('dragover', (e) => {
        e.preventDefault();
        column.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
    });

    column.addEventListener('dragleave', (e) => {
        column.style.backgroundColor = '';
    });

    column.addEventListener('drop', (e) => {
        e.preventDefault();
        column.style.backgroundColor = '';

        if (draggedCard) {
            column.appendChild(draggedCard);
            console.log('Card moved to new column');
        }
    });
});

// Navigation Link Handlers
document.querySelectorAll('.link-btn').forEach((link) => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetHref = link.getAttribute('href');
        const targetNav = document.querySelector(`.nav-item[href="${targetHref}"]`);

        if (targetNav) {
            targetNav.click();
        }
    });
});

// Quick Action Handlers
document.querySelectorAll('.action-buttons .btn-primary').forEach((btn) => {
    btn.addEventListener('click', () => {
        const actionText = btn.closest('.action-item').querySelector('strong').textContent;
        openAIModal(actionText);
    });
});

// Notification Badge (demo)
document.querySelector('.notification-badge')?.addEventListener('click', () => {
    console.log('Showing notifications...');
    alert('You have 3 new notifications!\n\n1. Google Search Console: New data available\n2. OpenAI API: Rate limit notice\n3. Task: "Write blog post" due today');
});

// Settings Button (demo)
document.querySelector('.icon-btn:nth-of-type(2)')?.addEventListener('click', () => {
    console.log('Opening settings...');
    alert('Settings modal would open here');
});

// User Profile (demo)
document.querySelector('.user-profile')?.addEventListener('click', () => {
    console.log('Opening user profile...');
    alert('User profile menu would appear here');
});

// Initialize
console.log('CAIT Dashboard initialized successfully');

// Log available interactions
console.log('Available Interactions:');
console.log('- Click nav items to switch views');
console.log('- Use List/Kanban toggle to change task view');
console.log('- Click "Generate with AI" buttons to see modal');
console.log('- Drag Kanban cards between columns');
console.log('- Click checkboxes to mark tasks complete');
