// Utility to force database recreation
export function clearDatabase() {
  localStorage.removeItem('musgrave_db');
  console.log('Database cleared - will be recreated on next app load');
}

// Call this to clear the database
if (typeof window !== 'undefined') {
  (window as any).clearDatabase = clearDatabase;
}