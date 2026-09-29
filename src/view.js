export function visibleTasks(tasks, filter = 'all', query = '') {
  const search = query.trim().toLowerCase();
  return tasks.filter(
    (task) =>
      (filter === 'all' ||
        (filter === 'completed' ? task.completed : !task.completed)) &&
      task.title.toLowerCase().includes(search),
  );
}
export function taskSummary(tasks) {
  const completed = tasks.filter((task) => task.completed).length;
  return { total: tasks.length, active: tasks.length - completed, completed };
}
