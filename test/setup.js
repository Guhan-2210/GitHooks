import * as chai from 'chai';
import { default as chaiHttp } from 'chai-http';
import sinonChai from 'sinon-chai';

chai.use(chaiHttp);
chai.use(sinonChai);

// optionally: const { expect } = chai; but you already imported expect

export const { expect } = chai;

// Global test configuration
export const testConfig = {
  timeout: 5000,
};

// Mock Cloudflare Workers environment
export function createMockEnv() {
  return {
  DB: {
  prepare: () => ({
  bind: () => ({
    all: () => Promise.resolve({ results: [] }),
    first: () => Promise.resolve(null),
    run: () => Promise.resolve({ changes: 0 }),
  }),
  }),
  },
  };
}

// Mock request helper
export function createMockRequest(method, url, body = null, params = {}) {
  const request = {
  method,
  url: `http://localhost${url}`,
  params,
  headers: new Headers({
  'Content-Type': 'application/json',
  }),
  json: async () => body,
  };
  return request;
}

// Mock context
export function createMockContext() {
  return {
  waitUntil: () => {},
  passThroughOnException: () => {},
  };
}
