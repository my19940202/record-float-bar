import { create } from 'zustand';
import type { OutlineContent, OutlineRecord } from '@/types/outline';
import {
  deleteOutline as deleteOutlineApi,
  listOutlines as listOutlinesApi,
  saveOutline as saveOutlineApi,
} from '@/services/api';

interface OutlineStore {
  outlines: OutlineRecord[];
  loading: boolean;
  error: string | null;
  activeOutline: OutlineRecord | null;
  draft: OutlineContent | null;
  fetchOutlines: () => Promise<void>;
  setActiveOutline: (outline: OutlineRecord | null) => void;
  setDraft: (draft: OutlineContent | null) => void;
  saveDraft: (input: {
    id?: number;
    title: string;
    sourceType: 'text' | 'file';
    sourceName?: string | null;
  }) => Promise<OutlineRecord>;
  removeOutline: (id: number) => Promise<void>;
}

export const useOutlineStore = create<OutlineStore>((set, get) => ({
  outlines: [],
  loading: false,
  error: null,
  activeOutline: null,
  draft: null,
  fetchOutlines: async () => {
    set({ loading: true, error: null });
    try {
      const outlines = await listOutlinesApi();
      set({ outlines, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '加载失败',
      });
    }
  },
  setActiveOutline: (outline) => set({ activeOutline: outline }),
  setDraft: (draft) => set({ draft }),
  saveDraft: async (input) => {
    const draft = get().draft;
    if (!draft) {
      throw new Error('没有可保存的提纲内容');
    }
    const saved = await saveOutlineApi({
      id: input.id,
      title: input.title,
      sourceType: input.sourceType,
      sourceName: input.sourceName,
      content: draft,
    });
    await get().fetchOutlines();
    set({ activeOutline: saved, draft: saved.content });
    return saved;
  },
  removeOutline: async (id) => {
    await deleteOutlineApi(id);
    await get().fetchOutlines();
    const active = get().activeOutline;
    if (active?.id === id) {
      set({ activeOutline: null, draft: null });
    }
  },
}));
