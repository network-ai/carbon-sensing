import { create } from "zustand";

interface ChatStore {
  /**
   * show map in the chat
   */
  map: boolean;

  /**
   * toggle map visibility
   */
  toggleMap: () => void;

  /**
   * set map visibility
   */
  setMap: (open: boolean) => void;
}

export const store = create<ChatStore>((set) => ({
  map: false,

  setMap: (open) => set({ map: open }),

  toggleMap: () => set((state) => ({ map: !state.map })),
}));
