import { getAllTodos, getTodoById, createTodo, updateTodo, deleteTodo } from '../models/todo.js';

/**
 * Todo route
 */

/**
 * GET /todos - Get all todos
 * Query params: completed (boolean) - filter by completion status (optional)
 */
export async function getTodos(request, env) {
  try {
    const url = new URL(request.url);
    const completedParam = url.searchParams.get('completed');

    let completed = null;
    if (completedParam !== null) {
      completed = completedParam.toLowerCase() === 'true';
    }

    const todos = await getAllTodos(env.DB, completed);

    return new Response(
      JSON.stringify({
        success: true,
        data: todos,
        count: todos.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch todos',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * GET /todos/:id - Get a single todo by ID
 */
export async function getTodo(request, env) {
  try {
    // ID is already validated by validateTodoId middleware
    const id = parseInt(request.params.id);

    const todo = await getTodoById(env.DB, id);

    if (!todo) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Todo not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: todo,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch todo',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * POST /todos - Create a new todo
 */
export const createTodoHandler = (deps = { createTodo }) => async (request, env) => {
    try {
      const data = request.validatedData || (await request.json());
      const todo = await deps.createTodo(env.DB, data);

      return new Response(
        JSON.stringify({
          success: true,
          data: todo,
          message: 'Todo created successfully',
        }),
        { status: 201 }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create todo',
        }),
        { status: 500 }
      );
    }
  };

/**
 * PATCH /todos/:id - Update a todo (partial update)
 */
export const updateTodoHandler = (deps = { updateTodo }) => async (request, env) => {
    try {
      // ID is already validated by validateTodoId middleware
      const id = parseInt(request.params.id);

      const updates = request.validatedData || (await request.json());

      const todo = await deps.updateTodo(env.DB, id, updates);

      if (!todo) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Todo not found',
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: todo,
          message: 'Todo updated successfully',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      if (error.message === 'No valid fields provided for update') {
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: 'not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };

/**
 * DELETE /todos/:id - Delete a todo
 */
export async function deleteTodoHandler(request, env) {
  try {
    // ID is already validated by validateTodoId middleware
    const id = parseInt(request.params.id);

    const deleted = await deleteTodo(env.DB, id);

    if (!deleted) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Todo not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Todo deleted successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to delete todo',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
