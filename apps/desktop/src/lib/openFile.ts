import { invoke } from '@tauri-apps/api/core';
import { open as openDialog } from '@tauri-apps/plugin-dialog';

export interface PickedFile {
  readonly bytes: Uint8Array;
  readonly name: string;
}

/** True when running inside the Tauri desktop shell (vs a plain browser tab). */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/**
 * Open a PDF. Uses the native file dialog on desktop (reading bytes through the
 * Rust `read_file_bytes` command so the webview needs no filesystem scope), and
 * a hidden <input type=file> on the web — one call site, both platforms.
 */
export async function pickPdf(): Promise<PickedFile | null> {
  if (isTauri()) {
    const selected = await openDialog({
      multiple: false,
      directory: false,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (!selected || Array.isArray(selected)) return null;
    const data = await invoke<number[]>('read_file_bytes', { path: selected });
    const name = selected.split(/[\\/]/).pop() ?? 'document.pdf';
    return { bytes: Uint8Array.from(data), name };
  }

  return new Promise<PickedFile | null>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,.pdf';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const buffer = await file.arrayBuffer();
      resolve({ bytes: new Uint8Array(buffer), name: file.name });
    };
    input.click();
  });
}

/** Read a dropped File object into our PickedFile shape. */
export async function readDroppedFile(file: File): Promise<PickedFile> {
  const buffer = await file.arrayBuffer();
  return { bytes: new Uint8Array(buffer), name: file.name };
}
