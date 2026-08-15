import { invoke } from '@tauri-apps/api/core';
import type {
  DmxSettings,
  GenerateOutlinePayload,
  OutlineContent,
  FloatingSettings,
} from '@/types/outline';
import {
  deleteOutline as deleteOutlineDb,
  getOutline as getOutlineDb,
  listOutlines as listOutlinesDb,
  saveOutline as saveOutlineDb,
} from '@/services/db';

export type { OutlineRecord } from '@/types/outline';
export {
  deleteOutlineDb as deleteOutline,
  getOutlineDb as getOutline,
  listOutlinesDb as listOutlines,
  saveOutlineDb as saveOutline,
};

export async function getDmxSettings(): Promise<DmxSettings> {
  return invoke<DmxSettings>('get_dmx_settings');
}

export async function saveDmxSettings(settings: DmxSettings): Promise<void> {
  return invoke('save_dmx_settings', { settings });
}

export async function generateOutline(
  payload: GenerateOutlinePayload
): Promise<OutlineContent> {
  return invoke<OutlineContent>('generate_outline', { payload });
}

export async function showFloatingOutline(id: number): Promise<void> {
  return invoke('show_floating_outline', { id });
}

export async function hideFloatingOutline(): Promise<void> {
  return invoke('hide_floating_outline');
}

export async function setFloatingChapterIndex(index: number): Promise<void> {
  return invoke('set_floating_chapter_index', { index });
}

export async function getFloatingState(): Promise<{
  outlineId: number | null;
  chapterIndex: number;
  viewState: 'collapsed' | 'chapters' | 'detail';
}> {
  return invoke('get_floating_state');
}

export async function setFloatingViewState(
  viewState: 'collapsed' | 'chapters' | 'detail'
): Promise<void> {
  return invoke('set_floating_view_state', { viewState });
}

export async function getFloatingSettings(): Promise<FloatingSettings> {
  return invoke<FloatingSettings>('get_floating_settings');
}

export async function saveFloatingSettings(settings: FloatingSettings): Promise<void> {
  return invoke('save_floating_settings', { settings });
}
