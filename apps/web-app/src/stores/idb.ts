import * as idb from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

const idbStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        const result = await idb.get<string | null>(name);
        return result ?? null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await idb.set(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await idb.del(name);
    },
};

export default idbStorage;