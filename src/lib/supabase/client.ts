import { Database } from './types';

// Helper to get cookies in browser
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i=0;i < ca.length;i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}

// Helper to set cookie in browser
function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days*24*60*60*1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

// Helper to delete cookie
function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

class MockQueryBuilder {
  private table: string;
  private method: string;
  private payload: any;

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

  order(col: string, options?: { ascending?: boolean }) {
    this.payload.order = { col, ascending: options?.ascending !== false };
    return this;
  }

  limit(limit: number) {
    this.payload.limit = limit;
    return this;
  }

  single() {
    this.payload.single = true;
    return this;
  }

  // Promise then method so the builder is awaitable
  async then(resolve: any, reject: any) {
    try {
      const res = await fetch('/api/supabase-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: this.table,
          method: this.method,
          payload: this.payload
        })
      });
      const result = await res.json();
      resolve(result);
    } catch (err: any) {
      resolve({ data: null, error: { message: err.message || 'Mock db network error' } });
    }
  }
}

class MockSupabaseClient {
  private authListeners: any[] = [];

  constructor() {
    // Listen for storage events (optional cross-tab sync)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'sb-user-session') {
          this.triggerAuthChange();
        }
      });
    }
  }

  from(table: string) {
    return new MockQueryBuilder(table, 'select');
  }

  async rpc(func: string, params: any) {
    try {
      const res = await fetch('/api/supabase-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'rpc',
          method: func,
          payload: params
        })
      });
      return await res.json();
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Mock RPC error' } };
    }
  }

  channel(name: string) {
    const mockChannel = {
      on: (event: string, filter: any, callback: any) => {
        return mockChannel;
      },
      subscribe: () => {
        return mockChannel;
      }
    };
    return mockChannel as any;
  }

  removeChannel(channel: any) {
    // No-op
  }

  auth = {
    getSession: async () => {
      const userStr = getCookie('sb-user') || (typeof window !== 'undefined' ? localStorage.getItem('sb-user-session') : null);
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
      const userStr = getCookie('sb-user') || (typeof window !== 'undefined' ? localStorage.getItem('sb-user-session') : null);
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          return { data: { user }, error: null };
        } catch {
          return { data: { user: null }, error: null };
        }
      }
      return { data: { user: null }, error: null };
    },

    signInWithPassword: async ({ email, password }: any) => {
      // Create a dummy user
      const user = {
        id: 'dummy-admin-id',
        email,
        aud: 'authenticated',
        role: 'authenticated',
        email_confirmed_at: new Date().toISOString(),
        user_metadata: {
          full_name: email === 'jadhav.mihir05@gmail.com' ? 'Mihir Jadhav' : 'Hotel Staff'
        }
      };
      
      const sessionStr = JSON.stringify(user);
      setCookie('sb-user', sessionStr, 7);
      if (typeof window !== 'undefined') {
        localStorage.setItem('sb-user-session', sessionStr);
      }

      setTimeout(() => this.triggerAuthChange('SIGNED_IN', user), 50);
      return { data: { user, session: { user, access_token: 'dummy-token' } }, error: null };
    },

    signUp: async ({ email, password, options }: any) => {
      const user = {
        id: `mock-user-${Math.random().toString(36).substr(2, 9)}`,
        email,
        aud: 'authenticated',
        role: 'authenticated',
        user_metadata: options?.data || {}
      };
      return { data: { user }, error: null };
    },

    signOut: async () => {
      deleteCookie('sb-user');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sb-user-session');
      }
      setTimeout(() => this.triggerAuthChange('SIGNED_OUT', null), 50);
      return { error: null };
    },

    onAuthStateChange: (callback: any) => {
      this.authListeners.push(callback);
      // Immediately run once
      this.auth.getSession().then(({ data: { session } }) => {
        callback(session ? 'INITIAL_SESSION' : 'SIGNED_OUT', session);
      });

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              this.authListeners = this.authListeners.filter(l => l !== callback);
            }
          }
        }
      };
    }
  };

  storage = {
    from: (bucket: string) => ({
      upload: async (path: string, file: any) => {
        // Return a simulated URL
        return { data: { path }, error: null };
      },
      getPublicUrl: (path: string) => {
        // Return a simulated image URL (use placeholder image)
        return { data: { publicUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&auto=format&fit=crop' } };
      }
    })
  };

  private triggerAuthChange(event: any = 'SIGNED_IN', user: any = null) {
    const session = user ? { user, access_token: 'dummy-token' } : null;
    this.authListeners.forEach(listener => {
      try {
        listener(event, session);
      } catch (err) {
        console.error('Auth listener error:', err);
      }
    });
  }
}

let clientInstance: any = null;
export const createClient = () => {
  if (!clientInstance) {
    clientInstance = new MockSupabaseClient();
  }
  return clientInstance as any;
};

export const supabase = createClient();