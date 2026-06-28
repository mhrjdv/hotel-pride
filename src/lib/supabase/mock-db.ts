import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db-mock.json');

// Default starting data for the mock database
const DEFAULT_DB = {
  profiles: [
    {
      id: 'dummy-admin-id',
      email: 'jadhav.mihir05@gmail.com',
      full_name: 'Mihir Jadhav',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  hotel_config: [
    {
      id: 'config-id',
      hotel_name: 'Hotel Pride',
      address_line1: '123 Station Road',
      address_line2: 'Near Bus Stand',
      city: 'Pune',
      state: 'Maharashtra',
      pin_code: '411001',
      phone: '+91-9876543210',
      email: 'hotelpride@gmail.com',
      gst_number: '27AAAAA1111A1Z1',
      currency: 'INR',
      gst_rate: 0.12,
      check_in_time: '14:00:00',
      check_out_time: '12:00:00',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  rooms: [
    { id: 'r1', room_number: 'A201', room_type: 'double-bed-deluxe', base_rate: 2200, current_rate: 2200, ac_rate: 2200, non_ac_rate: 1800, has_ac: true, allow_extra_bed: true, status: 'available', max_occupancy: 2, floor_number: 2, amenities: ['AC', 'TV', 'WiFi'] },
    { id: 'r2', room_number: 'A202', room_type: 'double-bed-deluxe', base_rate: 2200, current_rate: 2200, ac_rate: 2200, non_ac_rate: 1800, has_ac: true, allow_extra_bed: true, status: 'available', max_occupancy: 2, floor_number: 2, amenities: ['AC', 'TV', 'WiFi'] },
    { id: 'r3', room_number: 'A203', room_type: 'double-bed-deluxe', base_rate: 2200, current_rate: 2200, ac_rate: 2200, non_ac_rate: 1800, has_ac: true, allow_extra_bed: true, status: 'available', max_occupancy: 2, floor_number: 2, amenities: ['AC', 'TV', 'WiFi'] },
    { id: 'r4', room_number: 'A204', room_type: 'double-bed-deluxe', base_rate: 2200, current_rate: 2200, ac_rate: 2200, non_ac_rate: 1800, has_ac: true, allow_extra_bed: true, status: 'available', max_occupancy: 2, floor_number: 2, amenities: ['AC', 'TV', 'WiFi'] },
    { id: 'r5', room_number: 'A205', room_type: 'double-bed-deluxe', base_rate: 2200, current_rate: 2200, ac_rate: 2200, non_ac_rate: 1800, has_ac: true, allow_extra_bed: true, status: 'available', max_occupancy: 2, floor_number: 2, amenities: ['AC', 'TV', 'WiFi'] },
    { id: 'r6', room_number: 'A206', room_type: 'double-bed-deluxe', base_rate: 2200, current_rate: 2200, ac_rate: 2200, non_ac_rate: 1800, has_ac: true, allow_extra_bed: true, status: 'available', max_occupancy: 2, floor_number: 2, amenities: ['AC', 'TV', 'WiFi'] },
    
    { id: 'r7', room_number: 'N201', room_type: 'double-bed-deluxe', base_rate: 1500, current_rate: 1500, ac_rate: null, non_ac_rate: 1500, has_ac: false, allow_extra_bed: true, status: 'available', max_occupancy: 2, floor_number: 2, amenities: ['TV', 'WiFi'] },
    { id: 'r8', room_number: 'N202', room_type: 'double-bed-deluxe', base_rate: 1500, current_rate: 1500, ac_rate: null, non_ac_rate: 1500, has_ac: false, allow_extra_bed: true, status: 'available', max_occupancy: 2, floor_number: 2, amenities: ['TV', 'WiFi'] },
    { id: 'r9', room_number: 'N203', room_type: 'double-bed-deluxe', base_rate: 1500, current_rate: 1500, ac_rate: null, non_ac_rate: 1500, has_ac: false, allow_extra_bed: true, status: 'available', max_occupancy: 2, floor_number: 2, amenities: ['TV', 'WiFi'] },
    { id: 'r10', room_number: 'N204', room_type: 'double-bed-deluxe', base_rate: 1500, current_rate: 1500, ac_rate: null, non_ac_rate: 1500, has_ac: false, allow_extra_bed: true, status: 'available', max_occupancy: 2, floor_number: 2, amenities: ['TV', 'WiFi'] },

    { id: 'r11', room_number: 'A301', room_type: 'executive-3bed', base_rate: 3000, current_rate: 3000, ac_rate: 3000, non_ac_rate: 2500, has_ac: true, allow_extra_bed: true, status: 'available', max_occupancy: 3, floor_number: 3, amenities: ['AC', 'TV', 'WiFi', 'Geyser'] },
    { id: 'r12', room_number: 'A302', room_type: 'executive-3bed', base_rate: 3000, current_rate: 3000, ac_rate: 3000, non_ac_rate: 2500, has_ac: true, allow_extra_bed: true, status: 'available', max_occupancy: 3, floor_number: 3, amenities: ['AC', 'TV', 'WiFi', 'Geyser'] },
    { id: 'r13', room_number: 'A303', room_type: 'executive-3bed', base_rate: 3000, current_rate: 3000, ac_rate: 3000, non_ac_rate: 2500, has_ac: true, allow_extra_bed: true, status: 'available', max_occupancy: 3, floor_number: 3, amenities: ['AC', 'TV', 'WiFi', 'Geyser'] },
    { id: 'r14', room_number: 'A304', room_type: 'executive-3bed', base_rate: 3000, current_rate: 3000, ac_rate: 3000, non_ac_rate: 2500, has_ac: true, allow_extra_bed: true, status: 'available', max_occupancy: 3, floor_number: 3, amenities: ['AC', 'TV', 'WiFi', 'Geyser'] },

    { id: 'r15', room_number: 'N301', room_type: 'executive-3bed', base_rate: 2000, current_rate: 2000, ac_rate: null, non_ac_rate: 2000, has_ac: false, allow_extra_bed: true, status: 'available', max_occupancy: 3, floor_number: 3, amenities: ['TV', 'WiFi', 'Geyser'] },
    { id: 'r16', room_number: 'N302', room_type: 'executive-3bed', base_rate: 2000, current_rate: 2000, ac_rate: null, non_ac_rate: 2000, has_ac: false, allow_extra_bed: true, status: 'available', max_occupancy: 3, floor_number: 3, amenities: ['TV', 'WiFi', 'Geyser'] },

    { id: 'r17', room_number: 'V401', room_type: 'vip', base_rate: 4500, current_rate: 4500, ac_rate: 4500, non_ac_rate: null, has_ac: true, allow_extra_bed: true, status: 'available', max_occupancy: 4, floor_number: 4, amenities: ['AC', 'TV', 'WiFi', 'MiniBar', 'Bathtub'] },
    { id: 'r18', room_number: 'V402', room_type: 'vip', base_rate: 4500, current_rate: 4500, ac_rate: 4500, non_ac_rate: null, has_ac: true, allow_extra_bed: true, status: 'available', max_occupancy: 4, floor_number: 4, amenities: ['AC', 'TV', 'WiFi', 'MiniBar', 'Bathtub'] }
  ],
  customers: [
    {
      id: 'c1',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@example.com',
      phone: '9876543210',
      alternate_phone: null,
      id_type: 'aadhaar',
      id_number: '123456789012',
      id_photo_urls: [],
      address_line1: 'Flat 101, Sunshine Apartments',
      address_line2: 'Shivaji Nagar',
      city: 'Pune',
      state: 'Maharashtra',
      pin_code: '411005',
      country: 'India',
      date_of_birth: '1985-05-15',
      gender: 'male',
      nationality: 'Indian',
      is_blacklisted: false,
      blacklist_reason: null,
      notes: 'Frequent business traveler',
      total_bookings: 0,
      total_spent: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'dummy-admin-id',
      updated_by: null
    },
    {
      id: 'c2',
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      phone: '9823456789',
      alternate_phone: null,
      id_type: 'passport',
      id_number: 'Z9876543',
      id_photo_urls: [],
      address_line1: 'Sector 15, Hiranandani',
      address_line2: 'Powai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pin_code: '400076',
      country: 'India',
      date_of_birth: '1990-11-20',
      gender: 'female',
      nationality: 'Indian',
      is_blacklisted: false,
      blacklist_reason: null,
      notes: 'Prefers quiet rooms',
      total_bookings: 0,
      total_spent: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'dummy-admin-id',
      updated_by: null
    }
  ],
  bookings: [] as any[],
  payments: [] as any[],
  invoices: [] as any[],
  invoice_line_items: [] as any[],
  invoice_payments: [] as any[],
  custom_item_types: [] as any[]
};

function readDb(): any {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2));
    return DEFAULT_DB;
  }
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading mock db file, resetting to default:', err);
    return DEFAULT_DB;
  }
}

function writeDb(db: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error writing mock db file:', err);
  }
}

export function queryMockDb(table: string, method: string, payload: any): { data: any; error: any } {
  const db = readDb();
  let data = db[table] || [];

  if (table === 'rpc') {
    if (method === 'get_available_rooms') {
      const p_check_in_date = payload.p_check_in_date;
      const p_room_type = payload.p_room_type;
      
      let rooms = db.rooms;
      if (p_room_type && p_room_type !== 'all' && p_room_type !== '') {
        rooms = rooms.filter((r: any) => r.room_type === p_room_type);
      }
      
      rooms = rooms.filter((r: any) => r.status !== 'maintenance' && r.status !== 'blocked');
      
      const checkIn = new Date(p_check_in_date);
      const checkOut = payload.p_check_out_date ? new Date(payload.p_check_out_date) : new Date(checkIn.getTime() + 24 * 60 * 60 * 1000);
      
      rooms = rooms.filter((r: any) => {
        const overlapping = db.bookings.some((b: any) => {
          if (b.room_id !== r.id) return false;
          if (b.booking_status === 'cancelled') return false;
          const bIn = new Date(b.check_in_date);
          const bOut = new Date(b.check_out_date);
          return (checkIn < bOut) && (checkOut > bIn);
        });
        return !overlapping;
      });
      
      return { data: rooms, error: null };
    }

    if (method === 'generate_invoice_number_by_type') {
      const inv_type = payload.inv_type || 'gst';
      const prefix = inv_type === 'gst' ? 'GST' : 'INV';
      const count = db.invoices.filter((i: any) => i.invoice_type === inv_type).length + 1;
      const invNum = `${prefix}-${Date.now().toString().slice(-4)}-${count}`;
      return { data: invNum, error: null };
    }
    
    return { data: null, error: { message: `Unknown RPC function ${method}` } };
  }

  if (method === 'select') {
    // Apply filters
    const filters = payload.filters || [];
    for (const f of filters) {
      const { col, op, val } = f;
      if (op === 'eq') {
        data = data.filter((item: any) => item[col] === val);
      } else if (op === 'neq') {
        data = data.filter((item: any) => item[col] !== val);
      } else if (op === 'in') {
        data = data.filter((item: any) => val.includes(item[col]));
      } else if (op === 'gte') {
        data = data.filter((item: any) => item[col] >= val);
      } else if (op === 'lte') {
        data = data.filter((item: any) => item[col] <= val);
      } else if (op === 'gt') {
        data = data.filter((item: any) => item[col] > val);
      } else if (op === 'lt') {
        data = data.filter((item: any) => item[col] < val);
      } else if (op === 'contains') {
        data = data.filter((item: any) => {
          const arr = item[col];
          if (Array.isArray(arr)) {
            return val.every((v: any) => arr.includes(v));
          }
          return false;
        });
      } else if (op === 'not') {
        if (val === 'null') {
          data = data.filter((item: any) => item[col] === null || item[col] === undefined);
        } else {
          data = data.filter((item: any) => item[col] !== null && item[col] !== undefined);
        }
      }
    }

    // Resolve Joins (e.g. room:rooms(*))
    const selectStr = payload.selectStr || '*';
    if (selectStr.includes('room:rooms(') || selectStr.includes('rooms(')) {
      data = data.map((item: any) => {
        const room = db.rooms.find((r: any) => r.id === item.room_id);
        return { ...item, room, rooms: room };
      });
    }
    if (selectStr.includes('primary_customer:customers(') || selectStr.includes('customers(')) {
      data = data.map((item: any) => {
        const customer = db.customers.find((c: any) => c.id === item.primary_customer_id);
        return { ...item, primary_customer: customer, customers: customer };
      });
    }
    if (selectStr.includes('bookings(')) {
      data = data.map((item: any) => {
        const bookings = db.bookings.filter((b: any) => b.room_id === item.id && b.booking_status !== 'cancelled');
        return { ...item, bookings };
      });
    }

    // Order
    if (payload.order) {
      const { col, ascending } = payload.order;
      data.sort((a: any, b: any) => {
        if (a[col] < b[col]) return ascending ? -1 : 1;
        if (a[col] > b[col]) return ascending ? 1 : -1;
        return 0;
      });
    }

    // Limit
    if (payload.limit) {
      data = data.slice(0, payload.limit);
    }

    const totalCount = data.length;

    // Single
    if (payload.single) {
      return { data: data[0] || null, error: data.length === 0 ? { message: 'JSON database record not found' } : null, count: totalCount };
    }

    return { data, error: null, count: totalCount };
  }

  if (method === 'insert') {
    const records = Array.isArray(payload.data) ? payload.data : [payload.data];
    const newRecords = records.map((r: any) => {
      const newRec = {
        id: r.id || `mock-${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...r
      };
      
      // Auto-generate booking number
      if (table === 'bookings' && !newRec.booking_number) {
        newRec.booking_number = `BK-${Date.now().toString().slice(-6)}`;
      }

      // Auto-generate invoice number and set defaults
      if (table === 'invoices') {
        if (!newRec.invoice_number) {
          newRec.invoice_number = `INV-${Date.now().toString().slice(-6)}`;
        }
        // Ensure default numeric fields
        newRec.paid_amount = newRec.paid_amount || 0;
        newRec.balance_amount = newRec.balance_amount || newRec.total_amount || 0;
        newRec.payment_status = newRec.payment_status || 'pending';
      }
      
      data.push(newRec);
      return newRec;
    });

    db[table] = data;
    writeDb(db);

    // Update related items (e.g. if we insert a booking, update the room status)
    if (table === 'bookings') {
      for (const b of newRecords) {
        const room = db.rooms.find((r: any) => r.id === b.room_id);
        if (room) {
          room.status = b.booking_status === 'checked_in' ? 'occupied' : 'available';
        }
      }
      writeDb(db);
    }

    // Respect .single() — return the first record directly
    if (payload.single) {
      return { data: newRecords[0], error: null };
    }
    return { data: Array.isArray(payload.data) ? newRecords : newRecords[0], error: null };
  }

  if (method === 'update') {
    const filters = payload.filters || [];
    let updatedCount = 0;
    const updatedRecords: any[] = [];
    
    db[table] = data.map((item: any) => {
      let matches = true;
      for (const f of filters) {
        const { col, op, val } = f;
        if (op === 'eq' && item[col] !== val) matches = false;
      }
      if (matches) {
        updatedCount++;
        const updated = { ...item, ...payload.data, updated_at: new Date().toISOString() };
        updatedRecords.push(updated);
        return updated;
      }
      return item;
    });

    writeDb(db);

    // If update changes booking status, update the room status as well
    if (table === 'bookings' && payload.data.booking_status) {
      for (const b of updatedRecords) {
        const room = db.rooms.find((r: any) => r.id === b.room_id);
        if (room) {
          if (b.booking_status === 'checked_in') {
            room.status = 'occupied';
          } else if (b.booking_status === 'checked_out') {
            room.status = 'cleaning';
          } else if (b.booking_status === 'cancelled') {
            room.status = 'available';
          }
        }
      }
      writeDb(db);
    }

    // Respect .single() — return the first record directly
    if (payload.single) {
      return { data: updatedRecords[0] || null, error: updatedRecords.length === 0 ? { message: 'Record not found' } : null };
    }
    return { data: updatedRecords, error: null };
  }

  if (method === 'delete') {
    const filters = payload.filters || [];
    const beforeLength = data.length;
    db[table] = data.filter((item: any) => {
      let matches = true;
      for (const f of filters) {
        const { col, op, val } = f;
        if (op === 'eq' && item[col] !== val) matches = false;
      }
      return !matches;
    });
    writeDb(db);
    return { data: { count: beforeLength - db[table].length }, error: null };
  }

  return { data: null, error: { message: `Unknown method ${method}` } };
}
