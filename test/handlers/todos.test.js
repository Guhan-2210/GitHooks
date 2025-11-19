import { expect, createMockEnv, createMockRequest, createMockContext } from '../setup.js';
import sinon from 'sinon';
import {
  getTodos,
  getTodo,
  createTodoHandler,
  updateTodoHandler,
  deleteTodoHandler,
} from '../../src/handlers/todos.js';
import { updateTodo } from '../../src/models/todo.js';
import { describe, it, beforeEach, afterEach } from 'mocha';

describe('Todo Handlers', () => {
  let env, ctx, sandbox;

  beforeEach(() => {
  env = createMockEnv();
  ctx = createMockContext();
  sandbox = sinon.createSandbox();
  });

  afterEach(() => {
  sandbox.restore();
  });

  describe('GET /todos', () => {
  it('should return all todos successfully', async () => {
  const mockTodos = [
  { id: 1, title: 'Test Todo 1', description: 'Desc 1', completed: false },
  { id: 2, title: 'Test Todo 2', description: 'Desc 2', completed: true },
  ];

  // Mock D1 DB chain: prepare → bind → all
  env.DB.prepare = sandbox.stub().returns({
  bind: sandbox.stub().returns({
    all: sandbox.stub().resolves({ results: mockTodos }),
  }),
  });

  const request = createMockRequest('GET', '/api/todos');
  const response = await getTodos(request, env, ctx);
  const data = await response.json();

  expect(response.status).to.equal(200);
  expect(data.success).to.be.true;
  expect(data.data).to.deep.equal(mockTodos);
  expect(data.count).to.equal(2);
  });

  it('should handle DB errors gracefully', async () => {
  env.DB.prepare = sandbox.stub().returns({
  bind: sandbox.stub().returns({
    all: sandbox.stub().rejects(new Error('DB failed')),
  }),
  });

  const request = createMockRequest('GET', '/api/todos');
  const response = await getTodos(request, env, ctx);
  const data = await response.json();

  expect(response.status).to.equal(500);
  expect(data.success).to.be.false;
  expect(data.error).to.match(/failed/i);
  });

  it('should return empty array when no todos exist', async () => {
  env.DB.prepare = sandbox.stub().returns({
  bind: sandbox.stub().returns({
    all: sandbox.stub().resolves({ results: [] }),
  }),
  });

  const request = createMockRequest('GET', '/api/todos');
  const response = await getTodos(request, env, ctx);
  const data = await response.json();

  expect(response.status).to.equal(200);
  expect(data.data).to.be.an('array').that.is.empty;
  expect(data.count).to.equal(0);
  });
  });

  // ========================================================
  // GET /todos/:id
  // ========================================================
  describe('GET /todos/:id', () => {
  it('should return a single todo by ID', async () => {
  const mockTodo = { id: 1, title: 'Single Todo', completed: false };

  env.DB.prepare = sandbox.stub().returns({
  bind: sandbox.stub().returns({
    first: sandbox.stub().resolves(mockTodo),
  }),
  });

  const request = createMockRequest('GET', '/api/todos/1');
  request.params = { id: '1' };

  const response = await getTodo(request, env, ctx);
  const data = await response.json();

  expect(response.status).to.equal(200);
  expect(data.success).to.be.true;
  expect(data.data).to.deep.equal(mockTodo);
  });

  it('should return 404 if not found', async () => {
  env.DB.prepare = sandbox.stub().returns({
  bind: sandbox.stub().returns({
    first: sandbox.stub().resolves(null),
  }),
  });

  const request = createMockRequest('GET', '/api/todos/99');
  request.params = { id: '99' };
  const response = await getTodo(request, env, ctx);
  const data = await response.json();

  expect(response.status).to.equal(404);
  expect(data.error).to.match(/not found/i);
  });

  it('should handle DB errors gracefully', async () => {
  env.DB.prepare = sandbox.stub().returns({
  bind: sandbox.stub().returns({
    first: sandbox.stub().rejects(new Error('DB error')),
  }),
  });

  const request = createMockRequest('GET', '/api/todos/1');
  request.params = { id: '1' };
  const response = await getTodo(request, env, ctx);
  const data = await response.json();

  expect(response.status).to.equal(500);
  expect(data.success).to.be.false;
  expect(data.error).to.match(/failed/i);
  });
  });

  // ========================================================
  // POST /todos
  // ========================================================
  describe('POST /todos', () => {
  it('should create a new todo successfully', async () => {
  const mockTodo = { title: 'New Todo', description: 'Test' };
  const mockCreated = { id: 1, ...mockTodo };

  const fakeCreate = sandbox.stub().resolves(mockCreated);

  const handler = createTodoHandler({ createTodo: fakeCreate });

  const request = createMockRequest('POST', '/api/todos', mockTodo);
  request.validatedData = mockTodo;
  const response = await handler(request, env, ctx);
  const data = await response.json();

  expect(response.status).to.equal(201);
  expect(data.success).to.be.true;
  expect(data.message).to.match(/created/i);
  expect(data.data).to.deep.equal(mockCreated);
  expect(fakeCreate.calledOnceWith(env.DB, mockTodo)).to.be.true;
  });
  });

  // ========================================================
  // PATCH /todos/:id
  // ========================================================
  describe('PATCH /todos/:id', () => {
  it('should update todo successfully', async () => {
  const mockUpdated = { id: 1, title: 'Updated', description: 'Updated Desc', completed: 1 };
  const fakeUpdate = sandbox.stub().resolves(mockUpdated);

  const handler = updateTodoHandler({ updateTodo: fakeUpdate });

  const updates = { title: 'Updated', completed: true };
  const request = createMockRequest('PATCH', '/api/todos/1', updates);
  request.validatedData = updates;

  const response = await handler(request, env, ctx);
  const data = await response.json();

  expect(response.status).to.equal(200);
  expect(data.success).to.be.true;
  expect(data.message).to.match(/updated/i);
  });

  it('should return 404 when no rows updated', async () => {
  env.DB.prepare = sandbox.stub().returns({
  bind: sandbox.stub().returns({
    run: sandbox.stub().resolves({ changes: 0 }),
  }),
  });

  const handler = updateTodoHandler({ updateTodo });
  const request = createMockRequest('PATCH', '/api/todos/99', { title: 'Missing' });
  request.params = { id: '99' };
  request.validatedData = { title: 'Missing' };

  const response = await handler(request, env, ctx);
  const data = await response.json();

  expect(response.status).to.equal(404);
  expect(data.error).to.match(/not found/i);
  });
  });

  // ========================================================
  // DELETE /todos/:id
  // ========================================================
  describe('DELETE /todos/:id', () => {
  it('should delete todo successfully', async () => {
  env.DB.prepare = sandbox.stub().returns({
  bind: sandbox.stub().returns({
    run: sandbox.stub().resolves({ changes: 1 }),
  }),
  });

  const request = createMockRequest('DELETE', '/api/todos/1');
  request.params = { id: '1' };
  const response = await deleteTodoHandler(request, env, ctx);
  const data = await response.json();

  expect(response.status).to.equal(200);
  expect(data.success).to.be.true;
  expect(data.message).to.match(/deleted/i);
  });

  it('should return 404 when deleting non-existent todo', async () => {
  env.DB.prepare = sandbox.stub().returns({
  bind: sandbox.stub().returns({
    run: sandbox.stub().resolves({ changes: 0 }),
  }),
  });

  const request = createMockRequest('DELETE', '/api/todos/999');
  request.params = { id: '999' };
  const response = await deleteTodoHandler(request, env, ctx);
  const data = await response.json();

  expect(response.status).to.equal(404);
  expect(data.error).to.match(/not found/i);
  });

  it('should handle DB errors during deletion', async () => {
  env.DB.prepare = sandbox.stub().returns({
  bind: sandbox.stub().returns({
    run: sandbox.stub().rejects(new Error('DB crash')),
  }),
  });

  const request = createMockRequest('DELETE', '/api/todos/1');
  request.params = { id: '1' };
  const response = await deleteTodoHandler(request, env, ctx);
  const data = await response.json();

  expect(response.status).to.equal(500);
  expect(data.error).to.match(/failed/i);
  });
  });
});
