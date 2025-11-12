const clientId = window.location.pathname.split('/').pop();

fetch('/api/automation/initialize-tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ clientId })
})
.then(r => r.json())
.then(data => {
  console.log('Result:', data);
  alert('Tasks initialized! Refresh the page.');
})
.catch(err => {
  console.error('Error:', err);
  alert('Error: ' + err.message);
});
