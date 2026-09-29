import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { visibleTasks, taskSummary } from '../view.js';

type Task = {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
};
type Change = {
  id?: number;
  method: 'POST' | 'PATCH' | 'DELETE';
  data?: Partial<Task>;
};
async function api(path = '', options?: RequestInit) {
  const response = await fetch(`/api/tasks${path}`, options);
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.error || 'Something went wrong.');
  return data;
}
export const Route = createFileRoute('/')({ component: TasksPage });
function TasksPage() {
  const client = useQueryClient();
  const tasksQuery = useQuery<{ tasks: Task[] }>({
    queryKey: ['tasks'],
    queryFn: () => api(),
  });
  const mutation = useMutation({
    mutationFn: ({ id, method, data }: Change) =>
      api(id ? `/${id}` : '', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined,
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['tasks'] }),
  });
  const [title, setTitle] = useState(''),
    [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'),
    [error, setError] = useState('');
  const [editError, setEditError] = useState(''),
    [editTitle, setEditTitle] = useState('');
  const [editing, setEditing] = useState<Task | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const tasks = tasksQuery.data?.tasks ?? [];
  const summary = taskSummary(tasks),
    shown: Task[] = visibleTasks(tasks, filter, search);
  async function change(input: Change, success: () => void, editing = false) {
    setError('');
    setEditError('');
    try {
      await mutation.mutateAsync(input);
      success();
      setAnnouncement('Tasks updated.');
    } catch (e) {
      (editing ? setEditError : setError)(
        e instanceof Error ? e.message : 'Something went wrong.',
      );
    }
  }
  const busy = mutation.isPending;
  return (
    <>
      <header className="topbar">
        <a className="brand" href="/">
          elm<span> / tasks</span>
        </a>
        <span className="workspace">Personal workspace</span>
      </header>
      <main>
        <section className="intro">
          <div>
            <p className="eyebrow">ROOM TO MAKE PROGRESS</p>
            <h1>A little more focus.</h1>
            <p className="subtitle">
              Capture what matters. Take it one task at a time.
            </p>
          </div>
          <div className="date-mark">
            Your day,
            <br />
            <strong>well planned.</strong>
          </div>
        </section>
        <section className="summary" aria-label="Task summary">
          <div>
            <span id="total">{summary.total}</span>
            <p>Total tasks</p>
          </div>
          <div>
            <span id="active">{summary.active}</span>
            <p>In progress</p>
          </div>
          <div>
            <span id="done">{summary.completed}</span>
            <p>Completed</p>
          </div>
        </section>
        <section className="board" aria-labelledby="board-title">
          <div className="board-heading">
            <h2 id="board-title">Your tasks</h2>
            <span>
              {summary.total
                ? `${summary.completed} of ${summary.total} complete`
                : 'Let’s get started'}
            </span>
          </div>
          <form
            id="add-form"
            onSubmit={(e) => {
              e.preventDefault();
              void change({ method: 'POST', data: { title } }, () =>
                setTitle(''),
              );
            }}
          >
            <label className="sr-only" htmlFor="title">
              New task title
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              required
              placeholder="What would you like to get done?"
              autoComplete="off"
              disabled={busy}
            />
            <button type="submit" disabled={busy}>
              + Add task
            </button>
          </form>
          <div className="toolbar">
            <div className="filters" role="group" aria-label="Filter tasks">
              {['all', 'active', 'completed'].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                >
                  {value[0].toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
            <label className="sr-only" htmlFor="search">
              Search tasks
            </label>
            <input
              type="search"
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks…"
            />
          </div>
          <p
            id="error"
            className="error"
            role="alert"
            hidden={!error && !tasksQuery.error}
          >
            {error || tasksQuery.error?.message}
          </p>
          <div id="loading" role="status" hidden={!tasksQuery.isPending}>
            Loading your tasks…
          </div>
          <ul id="task-list" aria-label="Tasks">
            {shown.map((task) => (
              <li
                key={task.id}
                className={`task ${task.completed ? 'is-complete' : ''}`}
              >
                <label>
                  <input
                    type="checkbox"
                    aria-label={`Complete ${task.title}`}
                    checked={task.completed}
                    disabled={busy}
                    onChange={(e) =>
                      void change(
                        {
                          id: task.id,
                          method: 'PATCH',
                          data: { completed: e.target.checked },
                        },
                        () => {},
                      )
                    }
                  />
                  <span className="task-title">{task.title}</span>
                </label>
                <div className="task-actions">
                  <button
                    disabled={busy}
                    aria-label={`Edit ${task.title}`}
                    onClick={() => {
                      setEditing(task);
                      setEditTitle(task.title);
                      setEditError('');
                      dialog.current?.showModal();
                    }}
                  >
                    Edit
                  </button>
                  <button
                    disabled={busy}
                    aria-label={`Delete ${task.title}`}
                    onClick={() => {
                      if (confirm(`Delete “${task.title}”?`))
                        void change(
                          { id: task.id, method: 'DELETE' },
                          () => {},
                        );
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p
            className="empty"
            hidden={
              tasksQuery.isPending || !!tasksQuery.error || shown.length > 0
            }
          >
            {tasks.length
              ? 'No tasks match this view. Try another filter or search.'
              : 'A fresh start. Add your first task above.'}
          </p>
          <p className="sr-only" role="status" aria-live="polite">
            {announcement}
          </p>
        </section>
        <footer>
          Small steps. Real progress.<span>elm-tasks</span>
        </footer>
      </main>
      <dialog ref={dialog} id="edit-dialog" aria-labelledby="edit-heading">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editing)
              void change(
                { id: editing.id, method: 'PATCH', data: { title: editTitle } },
                () => dialog.current?.close(),
                true,
              );
          }}
        >
          <p className="eyebrow">MAKE IT CLEAR</p>
          <h2 id="edit-heading">Edit task</h2>
          <label htmlFor="edit-title">Task title</label>
          <input
            id="edit-title"
            required
            maxLength={120}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            disabled={busy}
          />
          <p className="error" role="alert" hidden={!editError}>
            {editError}
          </p>
          <div className="dialog-actions">
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => dialog.current?.close()}
            >
              Cancel
            </button>
            <button type="submit" disabled={busy}>
              Save changes
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
