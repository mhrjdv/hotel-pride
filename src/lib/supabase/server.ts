import { cookies } from 'next/headers';
import { Database } from './types';
import { queryMockDb } from './mock-db';

class ServerMockQueryBuilder {
  private table: string;
  private method: string;
  private payload: any;
  private _originalMethod: string | null = null;

  constructor(table: string, method: string, initialData?: any) {
    this.table = table;
    this.method = method;
    this.payload = {
      filters: [],
      data: initialData
    };
  }

  select(selectStr = '*', options?: { count?: string; head?: boolean }) {
    // Only set method to 'select' if we're not chaining after insert/update
    if (this.method !== 'insert' && this.method !== 'update') {
      this.method = 'select';
    }
    this.payload.selectStr = selectStr;
    this.payload.returnData = true;
    if (options?.count) {
      this.payload.count = options.count;
    }
    if (options?.head) {
      this.payload.head = options.head;
    }
    return this;
  }

  insert(data: any) {
    this.method = 'insert';
    this.payload.data = data;
    return this;
  }

  update(data: any) {
    this.method = 'update';
    this.payload.data = data;
    return this;
  }

  delete() {
    this.method = 'delete';
    return this;
  }

  eq(col: string, val: any) {
    this.payload.filters.push({ col, op: 'eq', val });
    return this;
  }

  neq(col: string, val: any) {
    this.payload.filters.push({ col, op: 'neq', val });
    return this;
  }

  in(col: string, val: any) {
    this.payload.filters.push({ col, op: 'in', val });
    return this;
  }

  gte(col: string, val: any) {
    this.payload.filters.push({ col, op: 'gte', val });
    return this;
  }

  lte(col: string, val: any) {
    this.payload.filters.push({ col, op: 'lte', val });
    return this;
  }

  gt(col: string, val: any) {
    this.payload.filters.push({ col, op: 'gt', val });
    return this;
  }

  lt(col: string, val: any) {
    this.payload.filters.push({ col, op: 'lt', val });
    return this;
  }

  not(col: string, op: string, val: any) {
    this.payload.filters.push({ col, op: 'not', val });
    return this;
  }

  or(orStr: string) {
    this.payload.filters.push({ col: '_or', op: 'or', val: orStr });
    return this;
  }

  order(col: string, options?: { ascending?: boolean }) {
    this.payload.order = { col, ascending: options?.ascending !== false };
    return this;
  }

  limit(limit: number) {
    this.payload.limit = limit;
    return this;
  }

  range(from: number, to: number) {
    this.payload.rangeFrom = from;
    this.payload.rangeTo = to;
    return this;
  }

  single() {
    this.payload.single = true;
    return this;
  }

  async then(resolve: any, reject: any) {
    try {
      const result = queryMockDb(this.table, this.method, this.payload);
      resolve(result);
    } catch (err: any) {
      resolve({ data: null, error: { message: err.message || 'Mock db error' } });
    }
  }
}

class ServerMockSupabaseClient {
  private cookieStore: any;

  constructor(cookieStore: any) {
    this.cookieStore = cookieStore;
  }

  from(table: string) {
    return new ServerMockQueryBuilder(table, 'select');
  }

  async rpc(func: string, params: any) {
    try {
      return queryMockDb('rpc', func, params);
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Mock RPC error' } };
    }
  }

  auth = {
    getSession: async () => {
      const cookie = this.cookieStore.get('sb-user');
      const userStr = cookie?.value;
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          return { data: { session: { user, access_token: 'dummy-token' } }, error: null };
        } catch {
          return { data: { session: null }, error: null };
        }
      }
      return { data: { session: null }, error: null };
    },

    getUser: async () => {
      const cookie = this.cookieStore.get('sb-user');
      const userStr = cookie?.value;
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          return { data: { user }, error: null };
        } catch {
          return { data: { user: null }, error: null };
        }
      }
      return { data: { user: null }, error: null };
    }
  };
}

export const createServerClient = async () => {
  const cookieStore = await cookies();
  return new ServerMockSupabaseClient(cookieStore) as any;
};

export const createClient = createServerClient;