import { openDB, DBSchema } from 'idb';

interface Letter {
  id: string;
  letterNumber: string;
  senderName: string;
  subject: string;
  dateSent: Date;
  expectedReplyDate: Date;
  sectionNumber: string;
  received: boolean;
}

interface LetterDB extends DBSchema {
  letters: {
    key: string;
    value: Letter;
    indexes: {
      'by-date': Date;
    };
  };
}

const DB_NAME = 'letter-tracker';
const STORE_NAME = 'letters';

export async function initDB() {
  const db = await openDB<LetterDB>(DB_NAME, 1, {
    upgrade(db) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      store.createIndex('by-date', 'expectedReplyDate');
    },
  });
  return db;
}

export async function getAllLetters(): Promise<Letter[]> {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}

export async function addLetter(letter: Omit<Letter, 'id'>): Promise<Letter> {
  const db = await initDB();
  const id = crypto.randomUUID();
  const newLetter = { ...letter, id };
  await db.add(STORE_NAME, newLetter);
  return newLetter;
}

export async function updateLetter(id: string, updates: Partial<Letter>): Promise<Letter> {
  const db = await initDB();
  const letter = await db.get(STORE_NAME, id);
  if (!letter) throw new Error('Letter not found');
  
  const updatedLetter = { ...letter, ...updates };
  await db.put(STORE_NAME, updatedLetter);
  return updatedLetter;
}