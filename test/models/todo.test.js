import { expect } from '../setup.js';
import sinon from 'sinon';
import {
  getAllTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
} from '../../src/models/todo.js';
import { describe, it, beforeEach, afterEach } from 'mocha';

describe('Todo Models', () => {
  let mockDB, sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    mockDB = {
      prepare: sandbox.stub(),
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getAllTodos', () => {
    it('should return all todos ordered by created_at DESC', async () => {
      const mockResults = [
        { id: 2, title: 'Todo 2', description: 'Desc 2', completed: 0 },
        { id: 1, title: 'Todo 1', description: 'Desc 1', completed: 1 },
      ];

      const bindStub = sandbox.stub().returnsThis();
      const allStub = sandbox.stub().resolves({ results: mockResults });

      mockDB.prepare.returns({
        bind: bindStub,
        all: allStub,
      });

      const todos = await getAllTodos(mockDB);

      expect(mockDB.prepare).to.have.been.calledWith(
        'SELECT * FROM todos ORDER BY created_at DESC'
      );
      expect(todos).to.have.lengthOf(2);
      expect(todos[0].completed).to.be.false;
      expect(todos[1].completed).to.be.true;
    });

    it('should filter by completed status (true)', async () => {
      const mockResults = [{ id: 1, title: 'Completed Todo', description: 'Done', completed: 1 }];

      const bindStub = sandbox.stub().returnsThis();
      const allStub = sandbox.stub().resolves({ results: mockResults });

      mockDB.prepare.returns({
        bind: bindStub,
        all: allStub,
      });

      const todos = await getAllTodos(mockDB, true);

      expect(mockDB.prepare).to.have.been.calledWith(
        'SELECT * FROM todos WHERE completed = ? ORDER BY created_at DESC'
      );
      expect(bindStub).to.have.been.calledWith(1);
      expect(todos).to.have.lengthOf(1);
      expect(todos[0].completed).to.be.true;
    });
  });

  describe('getTodoById', () => {
    it('should return a todo by id', async () => {
      const mockTodo = { id: 1, title: 'Test', description: 'Desc', completed: 0 };

      const bindStub = sandbox.stub().returnsThis();
      const firstStub = sandbox.stub().resolves(mockTodo);

      mockDB.prepare.returns({
        bind: bindStub,
        first: firstStub,
      });

      const todo = await getTodoById(mockDB, 1);

      expect(mockDB.prepare).to.have.been.calledWith('SELECT * FROM todos WHERE id = ?');
      expect(bindStub).to.have.been.calledWith(1);
      expect(todo).to.exist;
      expect(todo.id).to.equal(1);
      expect(todo.completed).to.be.false;
    });

    it('should return null when todo not found', async () => {
      mockDB.prepare.returns({
        bind: sandbox.stub().returnsThis(),
        first: sandbox.stub().resolves(null),
      });

      const todo = await getTodoById(mockDB, 999);

      expect(todo).to.be.null;
    });
  });

  describe('createTodo', () => {
    it('should create a new todo with title and description', async () => {
      const newTodo = { title: 'New Todo', description: 'New Description' };
      const createdTodo = { id: 1, ...newTodo, completed: 0 };

      const bindStub = sandbox.stub().returnsThis();
      const firstStub = sandbox.stub().resolves(createdTodo);

      mockDB.prepare.returns({
        bind: bindStub,
        first: firstStub,
      });

      const todo = await createTodo(mockDB, newTodo);

      expect(mockDB.prepare).to.have.been.calledWith(
        'INSERT INTO todos (title, description, completed) VALUES (?, ?, 0) RETURNING *'
      );
      expect(bindStub).to.have.been.calledWith('New Todo', 'New Description');
      expect(todo.id).to.equal(1);
      expect(todo.completed).to.be.false;
    });

    it('should create todo with empty description by default', async () => {
      const newTodo = { title: 'New Todo' };
      const createdTodo = { id: 1, title: 'New Todo', description: '', completed: 0 };

      mockDB.prepare.returns({
        bind: sandbox.stub().returnsThis(),
        first: sandbox.stub().resolves(createdTodo),
      });

      const todo = await createTodo(mockDB, newTodo);

      expect(todo.description).to.equal('');
    });

    it('should set completed to false by default', async () => {
      const newTodo = { title: 'New Todo', description: 'Desc' };
      const createdTodo = { id: 1, ...newTodo, completed: 0 };

      mockDB.prepare.returns({
        bind: sandbox.stub().returnsThis(),
        first: sandbox.stub().resolves(createdTodo),
      });

      const todo = await createTodo(mockDB, newTodo);

      expect(todo.completed).to.be.false;
    });
  });

  describe('updateTodo', () => {
    it('should update completed status', async () => {
      const updates = { completed: true };
      const updatedTodo = { id: 1, title: 'Todo', description: 'Desc', completed: 1 };

      mockDB.prepare.returns({
        bind: sandbox.stub().returnsThis(),
        first: sandbox.stub().resolves(updatedTodo),
      });

      const todo = await updateTodo(mockDB, 1, updates);

      expect(todo.completed).to.be.true;
    });

    it('should update multiple fields', async () => {
      const updates = { title: 'Updated', description: 'Updated desc', completed: true };
      const updatedTodo = { id: 1, ...updates, completed: 1 };

      mockDB.prepare.returns({
        bind: sandbox.stub().returnsThis(),
        first: sandbox.stub().resolves(updatedTodo),
      });

      const todo = await updateTodo(mockDB, 1, updates);

      expect(todo.title).to.equal('Updated');
      expect(todo.description).to.equal('Updated desc');
      expect(todo.completed).to.be.true;
    });

    it('should throw error when no valid fields provided (negative test)', async () => {
      const updates = {};

      try {
        await updateTodo(mockDB, 1, updates);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('No valid fields provided for update');
      }
    });

    it('should update updated_at timestamp', async () => {
      const updates = { title: 'Updated' };
      const updatedTodo = { id: 1, title: 'Updated', description: '', completed: 0 };

      mockDB.prepare.returns({
        bind: sandbox.stub().returnsThis(),
        first: sandbox.stub().resolves(updatedTodo),
      });

      await updateTodo(mockDB, 1, updates);

      const prepareCall = mockDB.prepare.getCall(0).args[0];
      expect(prepareCall).to.include('updated_at = CURRENT_TIMESTAMP');
    });
  });

  describe('deleteTodo', () => {
    it('should delete todo successfully', async () => {
      const bindStub = sandbox.stub().returnsThis();
      const runStub = sandbox.stub().resolves({ changes: 1 });

      mockDB.prepare.returns({
        bind: bindStub,
        run: runStub,
      });

      const deleted = await deleteTodo(mockDB, 1);

      expect(mockDB.prepare).to.have.been.calledWith('DELETE FROM todos WHERE id = ?');
      expect(bindStub).to.have.been.calledWith(1);
      expect(deleted).to.be.true;
    });

    it('should return false when todo not found (negative test)', async () => {
      mockDB.prepare.returns({
        bind: sandbox.stub().returnsThis(),
        run: sandbox.stub().resolves({ changes: 0 }),
      });

      const deleted = await deleteTodo(mockDB, 999);

      expect(deleted).to.be.false;
    });
  });
});
