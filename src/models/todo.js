/**
 * Helper function to convert DB row to todo object with proper types
 */
function formatTodo(row) {
    if (!row) return null;

    return {
        ...row,
        completed: Boolean(row.completed), // Convert 0/1 to false/true
    };
}

/**
 * Get all todos with optional filter
 */
export async function getAllTodos(db, completed = null) {
    let query = 'SELECT * FROM todos ORDER BY created_at DESC';
    let params = [];

    if (completed !== null) {
        query = 'SELECT * FROM todos WHERE completed = ? ORDER BY created_at DESC';
        params = [completed ? 1 : 0];
    }

    const result = await db
        .prepare(query)
        .bind(...params)
        .all();

    // Convert completed field to boolean for all todos
    return result.results.map(formatTodo);
}

/**
 * Get a single todo by ID
 */
export async function getTodoById(db, id) {
    const result = await db.prepare('SELECT * FROM todos WHERE id = ?').bind(id).first();
    return formatTodo(result);
}

/**
 * Create a new todo
 */
export async function createTodo(db, { title, description = '' }) {
    const result = await db
        .prepare('INSERT INTO todos (title, description, completed) VALUES (?, ?, 0) RETURNING *')
        .bind(title, description)
        .first();

    return formatTodo(result);
}

/**
 * Update an existing todo
 */
export async function updateTodo(db, id, updates) {
    const fields = [];
    const values = [];
    const allowedFields = ['title', 'description', 'completed'];

    for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
            fields.push(`${key} = ?`);
            // Convert boolean to 0/1 for SQLite
            values.push(key === 'completed' ? (value ? 1 : 0) : value);
        }
    }

    if (fields.length === 0) {
        throw new Error('No valid fields provided for update');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE todos SET ${fields.join(', ')} WHERE id = ? RETURNING *`;
    const result = await db
        .prepare(query)
        .bind(...values)
        .first();

    return formatTodo(result);
}

/**
 * Delete a todo by ID
 */
export async function deleteTodo(db, id) {
    const result = await db.prepare('DELETE FROM todos WHERE id = ?').bind(id).run();
    return result.changes > 0;
}
