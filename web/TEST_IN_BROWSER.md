# Test Automation in Browser

Since the API routes require authentication, let's test directly in the browser console.

## Test Task Initialization

**On the client detail page, open the browser console** (F12 or Cmd+Option+I)

Then paste this code and press Enter:

```javascript
// Initialize tasks for this client
const clientId = window.location.pathname.split('/').pop();

fetch('/api/automation/initialize-tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ clientId })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Task Initialization Result:', data);
  alert('Tasks initialized! Refresh the page to see them.');
})
.catch(err => {
  console.error('❌ Error:', err);
  alert('Error: ' + err.message);
});
```

**Expected result:**
- Console shows: `✅ Task Initialization Result: {success: true, message: "Tasks initialized successfully"}`
- Alert says: "Tasks initialized! Refresh the page to see them."

**Then refresh the page** and you should see:
- Tasks section populated with Month 0-12
- 54 total tasks
- Tasks grouped by month
- Month 0 should have 10 tasks

---

## Test Keyword Research Automation (Optional - Costs ~$0.20)

If you want to test the full automation with DataForSEO:

```javascript
const clientId = window.location.pathname.split('/').pop();

// Find the Month 0 keyword research task ID
// (You'll need to look in the Supabase database or copy from the UI)
const taskId = 'YOUR-TASK-ID-HERE';

fetch('/api/automation/keyword-research', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ clientId, taskId })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Keyword Research Result:', data);
  alert('Keyword research complete! Check console for results.');
})
.catch(err => {
  console.error('❌ Error:', err);
  alert('Error: ' + err.message);
});
```

---

## Try It Now!

1. Make sure you're on the client detail page
2. Open browser console (F12)
3. Paste the task initialization code
4. Press Enter
5. See the magic happen! ✨
