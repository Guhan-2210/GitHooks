import { Router } from 'itty-router';
import {
  validateCreateTodo,
  validateUpdateTodo,
  validateTodoId,
} from './src/middleware/validation.js';
import { errorResponse } from './src/utils/errorResponse.js';
// Import handlers
import {
  getTodos,
  getTodo,
  createTodoHandler,
  updateTodoHandler,
  deleteTodoHandler,
} from './src/handlers/todos.js';

// Create router instance for handling API routes
const router = Router();

// Middleware to handle CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function handleCors(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
}

// Apply CORS middleware to all routes
router.all('*', handleCors);

// Health Check Route - Verify all services are operational
router.get('/health', async (request, env) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'todo-list-api',
    checks: {},
  };

  let allHealthy = true;

  // Check D1 Database connectivity
  try {
    if (!env.DB) {
      throw new Error('D1 database not bound');
    }
    // Simple query to verify database is accessible
    const result = await env.DB.prepare('SELECT 1 as health_check').first();
    healthStatus.checks.d1_database = {
      status: result ? 'ok' : 'error',
      message: result ? 'Database is accessible' : 'Database query failed',
    };
    if (!result) allHealthy = false;
  } catch (error) {
    healthStatus.checks.d1_database = {
      status: 'error',
      message: error.message || 'Database connection failed',
    };
    allHealthy = false;
  }

  // Check if todos table exists and is queryable
  try {
    const tableCheck = await env.DB.prepare(
      'SELECT name FROM sqlite_master WHERE type="table" AND name="todos"'
    ).first();
    healthStatus.checks.todos_table = {
      status: tableCheck ? 'ok' : 'error',
      message: tableCheck ? 'Todos table exists' : 'Todos table not found',
    };
    if (!tableCheck) allHealthy = false;
  } catch (error) {
    healthStatus.checks.todos_table = {
      status: 'error',
      message: error.message || 'Unable to verify todos table',
    };
    allHealthy = false;
  }

  // Set overall status
  healthStatus.status = allHealthy ? 'ok' : 'error';

  return new Response(JSON.stringify(healthStatus), {
    status: allHealthy ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
});

// API Routes
router.get('/api/todos', getTodos);
router.get('/api/todos/:id', validateTodoId, getTodo);
router.post('/api/todos', validateCreateTodo, createTodoHandler);
router.patch('/api/todos/:id', validateTodoId, validateUpdateTodo, updateTodoHandler);
router.delete('/api/todos/:id', validateTodoId, deleteTodoHandler);

// Error handling wrapper
async function handleRequest(request, env, ctx) {
  try {
    // Add CORS headers to all responses
    const response = await router.handle(request, env, ctx);

    if (response && !response.headers.has('Access-Control-Allow-Origin')) {
      // Clone the response to add CORS headers
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers),
          ...corsHeaders,
        },
      });
      return newResponse;
    }

    return response;
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

// Export the fetch handler for Cloudflare Workers
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  },
};
// test comment
