import { expect, createMockEnv, createMockRequest, createMockContext } from '../setup.js';
import {
  validate,
  todoSchemas,
  validateCreateTodo,
  validateUpdateTodo,
  validateTodoId,
} from '../../src/middleware/validation.js';
import { describe, it, beforeEach } from 'mocha';

describe('Validation Middleware', () => {
  let env, ctx;

  beforeEach(() => {
  env = createMockEnv();
  ctx = createMockContext();
  });

  describe('Create Todo Validation', () => {
  it('should pass validation with valid title and description', async () => {
  const validData = { title: 'Valid Title', description: 'Valid description' };
  const request = createMockRequest('POST', '/api/todos', validData);

  const result = await validateCreateTodo(request, env, ctx);

  expect(result).to.be.undefined;
  expect(request.validatedData).to.deep.equal(validData);
  });

  it('should pass validation with only title', async () => {
  const validData = { title: 'Valid Title' };
  const request = createMockRequest('POST', '/api/todos', validData);

  const result = await validateCreateTodo(request, env, ctx);

  expect(result).to.be.undefined;
  expect(request.validatedData.title).to.equal('Valid Title');
  });

  it('should reject title exceeding 200 characters (negative test)', async () => {
  const longTitle = 'a'.repeat(201);
  const invalidData = { title: longTitle };
  const request = createMockRequest('POST', '/api/todos', invalidData);

  const response = await validateCreateTodo(request, env, ctx);
  const data = await response.json();

  expect(response.status).to.equal(400);
  expect(data.success).to.be.false;
  expect(data.details[0].message).to.include('less than 200 characters');
  });

  it('should reject description exceeding 1000 characters (negative test)', async () => {
  const longDesc = 'a'.repeat(1001);
  const invalidData = { title: 'Valid', description: longDesc };
  const request = createMockRequest('POST', '/api/todos', invalidData);

  const response = await validateCreateTodo(request, env, ctx);
  const data = await response.json();

  expect(response.status).to.equal(400);
  expect(data.success).to.be.false;
  expect(data.details[0].message).to.include('less than 1000 characters');
  });
  });

  describe('Update Todo Validation', () => {
  it('should pass validation with valid title update', async () => {
  const validData = { title: 'Updated Title' };
  const request = createMockRequest('PATCH', '/api/todos/1', validData);

  const result = await validateUpdateTodo(request, env, ctx);

  expect(result).to.be.undefined;
  expect(request.validatedData).to.deep.equal(validData);
  });

  it('should pass validation with completed flag', async () => {
  const validData = { completed: true };
  const request = createMockRequest('PATCH', '/api/todos/1', validData);

  const result = await validateUpdateTodo(request, env, ctx);

  expect(result).to.be.undefined;
  expect(request.validatedData.completed).to.be.true;
  });

  it('should pass validation with multiple fields', async () => {
  const validData = { title: 'Updated', description: 'Updated desc', completed: true };
  const request = createMockRequest('PATCH', '/api/todos/1', validData);

  const result = await validateUpdateTodo(request, env, ctx);

  expect(result).to.be.undefined;
  expect(request.validatedData).to.deep.equal(validData);
  });

  it('should reject empty update object (negative test)', async () => {
  const invalidData = {};
  const request = createMockRequest('PATCH', '/api/todos/1', invalidData);

  const response = await validateUpdateTodo(request, env, ctx);
  const data = await response.json();

  expect(response.status).to.equal(400);
  expect(data.success).to.be.false;
  expect(data.details[0].message).to.include('At least one field');
  });

  it('should allow empty string description', async () => {
  const validData = { description: '' };
  const request = createMockRequest('PATCH', '/api/todos/1', validData);

  const result = await validateUpdateTodo(request, env, ctx);

  expect(result).to.be.undefined;
  expect(request.validatedData.description).to.equal('');
  });
  });

  describe('ID Validation', () => {
  it('should pass validation with valid numeric ID', async () => {
  const request = createMockRequest('GET', '/api/todos/1');
  request.params = { id: '1' };

  const result = await validateTodoId(request, env, ctx);

  expect(result).to.be.undefined;
  });

  it('should reject non-numeric ID (negative test)', async () => {
  const request = createMockRequest('GET', '/api/todos/abc');
  request.params = { id: 'abc' };

  const response = await validateTodoId(request, env, ctx);
  const data = await response.json();

  expect(response.status).to.equal(400);
  expect(data.success).to.be.false;
  expect(data.details[0].message).to.include('must be a number');
  });

  it('should reject negative ID (negative test)', async () => {
  const request = createMockRequest('GET', '/api/todos/-1');
  request.params = { id: '-1' };

  const response = await validateTodoId(request, env, ctx);
  const data = await response.json();

  expect(response.status).to.equal(400);
  expect(data.success).to.be.false;
  expect(data.details[0].message).to.include('must be positive');
  });

  it('should reject missing ID (negative test)', async () => {
  const request = createMockRequest('GET', '/api/todos/');
  request.params = {};

  const response = await validateTodoId(request, env, ctx);
  const data = await response.json();

  expect(response.status).to.equal(400);
  expect(data.success).to.be.false;
  });
  });

  describe('Generic Validate Function', () => {
  it('should validate query parameters', async () => {
  const schema = todoSchemas.id;
  const request = createMockRequest('GET', '/api/todos?id=1');

  const middleware = validate(schema, 'query');
  const result = await middleware(request, env, ctx);

  expect(result).to.be.undefined;
  });

  it('should return all validation errors (abortEarly: false)', async () => {
  const invalidData = { title: '', description: 'a'.repeat(1001) };
  const request = createMockRequest('POST', '/api/todos', invalidData);

  const response = await validateCreateTodo(request, env, ctx);
  const data = await response.json();

  expect(response.status).to.equal(400);
  expect(data.details).to.have.lengthOf.at.least(2);
  });
  });
});
