/**
 * The five top-level modes of the editor, mirroring PDF Expert, and the tools
 * each one exposes. Every tool declares which engine capability it needs, so
 * the UI can gray out tools the active engine can't perform (the open-source
 * build) and light them up the moment the commercial engine is configured.
 */
import {
  ArrowUpRight,
  Circle,
  Combine,
  Copy,
  EyeOff,
  FileImage,
  FileInput,
  FileOutput,
  FileSpreadsheet,
  FileText,
  FormInput,
  Highlighter,
  Image,
  Link,
  Minus,
  PenTool,
  Presentation,
  RotateCw,
  ScanLine,
  Scissors,
  Signature,
  Square,
  Stamp,
  StickyNote,
  Strikethrough,
  Trash2,
  Type,
  Underline,
  type LucideIcon,
} from 'lucide-react';

import type { EngineCapabilities } from '@myfreepdf/pdf-engine';

export type EditorMode = 'annotate' | 'edit' | 'organize' | 'sign' | 'convert';

export interface Tool {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly capability: keyof EngineCapabilities;
}

export interface ModeDef {
  readonly id: EditorMode;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly tools: readonly Tool[];
}

export const MODES: readonly ModeDef[] = [
  {
    id: 'annotate',
    label: 'Annotate',
    icon: Highlighter,
    tools: [
      { id: 'highlight', label: 'Highlight', icon: Highlighter, capability: 'annotate' },
      { id: 'underline', label: 'Underline', icon: Underline, capability: 'annotate' },
      { id: 'strikeout', label: 'Strikeout', icon: Strikethrough, capability: 'annotate' },
      { id: 'ink', label: 'Draw', icon: PenTool, capability: 'annotate' },
      { id: 'rectangle', label: 'Rectangle', icon: Square, capability: 'annotate' },
      { id: 'ellipse', label: 'Ellipse', icon: Circle, capability: 'annotate' },
      { id: 'arrow', label: 'Arrow', icon: ArrowUpRight, capability: 'annotate' },
      { id: 'note', label: 'Note', icon: StickyNote, capability: 'annotate' },
      { id: 'stamp', label: 'Stamp', icon: Stamp, capability: 'annotate' },
    ],
  },
  {
    id: 'edit',
    label: 'Edit',
    icon: Type,
    tools: [
      { id: 'edit-text', label: 'Edit Text', icon: Type, capability: 'editContent' },
      { id: 'insert-image', label: 'Insert Image', icon: Image, capability: 'editContent' },
      { id: 'add-link', label: 'Add Link', icon: Link, capability: 'editContent' },
      { id: 'redact', label: 'Redact', icon: EyeOff, capability: 'redact' },
      { id: 'ocr', label: 'Scan & OCR', icon: ScanLine, capability: 'ocr' },
    ],
  },
  {
    id: 'organize',
    label: 'Organize',
    icon: Copy,
    tools: [
      { id: 'merge', label: 'Merge', icon: Combine, capability: 'organize' },
      { id: 'split', label: 'Split', icon: Scissors, capability: 'organize' },
      { id: 'extract', label: 'Extract', icon: Copy, capability: 'organize' },
      { id: 'rotate', label: 'Rotate', icon: RotateCw, capability: 'organize' },
      { id: 'delete', label: 'Delete', icon: Trash2, capability: 'organize' },
    ],
  },
  {
    id: 'sign',
    label: 'Fill & Sign',
    icon: Signature,
    tools: [
      { id: 'fill-form', label: 'Fill Form', icon: FormInput, capability: 'forms' },
      { id: 'sign', label: 'Sign', icon: Signature, capability: 'sign' },
      { id: 'flatten', label: 'Flatten', icon: Minus, capability: 'forms' },
    ],
  },
  {
    id: 'convert',
    label: 'Convert',
    icon: FileOutput,
    tools: [
      { id: 'to-pdf', label: 'To PDF', icon: FileInput, capability: 'convert' },
      { id: 'to-word', label: 'PDF → Word', icon: FileText, capability: 'convert' },
      { id: 'to-excel', label: 'PDF → Excel', icon: FileSpreadsheet, capability: 'convert' },
      { id: 'to-ppt', label: 'PDF → PPT', icon: Presentation, capability: 'convert' },
      { id: 'to-image', label: 'PDF → Image', icon: FileImage, capability: 'convert' },
    ],
  },
];

export function modeById(id: EditorMode): ModeDef {
  const found = MODES.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown mode: ${id}`);
  return found;
}
