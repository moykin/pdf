import { invoke } from '@tauri-apps/api/core';

import { isTauri } from '../lib/openFile.js';
import { useEditor } from '../store.js';
import { useOverlay } from '../overlay.js';
import { availableStampIds, resolveStampSrc } from './stamps.js';
import { SYSTEM_PROMPT, TOOLS } from './tools.js';

// ---------------------------------------------------------------------------
// Minimal Anthropic Messages API shapes (we only touch what we use)
// ---------------------------------------------------------------------------

interface ContentBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: unknown;
}

interface AnthropicResponse {
  content: ContentBlock[];
  stop_reason: string;
}

export interface ApiMessage {
  role: 'user' | 'assistant';
  content: string | unknown[];
}

export interface AgentEvents {
  onText: (text: string) => void;
  onTool: (name: string, input: unknown, result: string) => void;
  onError: (message: string) => void;
}

const MODEL = 'claude-opus-4-8';
const MAX_ITERATIONS = 8;

/**
 * Run the tool-use loop until Claude stops calling tools. The full assistant
 * `content` is appended verbatim each turn (preserving thinking + tool_use
 * ordering), and every tool_result for a turn goes back in a single user
 * message — the two invariants the Messages API relies on.
 */
export async function runAgent(
  initial: ApiMessage[],
  events: AgentEvents,
): Promise<ApiMessage[]> {
  let messages = initial;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const body = {
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' },
      messages,
    };

    let resp: AnthropicResponse;
    try {
      resp = await callModel(body);
    } catch (e) {
      events.onError(e instanceof Error ? e.message : String(e));
      return messages;
    }

    messages = [...messages, { role: 'assistant', content: resp.content }];

    for (const block of resp.content) {
      if (block.type === 'text' && block.text && block.text.trim()) {
        events.onText(block.text);
      }
    }

    if (resp.stop_reason === 'refusal') {
      events.onError('The assistant declined this request.');
      return messages;
    }
    if (resp.stop_reason !== 'tool_use') return messages;

    const toolUses = resp.content.filter((b) => b.type === 'tool_use');
    const toolResults = toolUses.map((tu) => {
      const { result, isError } = executeTool(tu.name ?? '', tu.input);
      events.onTool(tu.name ?? '', tu.input, result);
      return {
        type: 'tool_result',
        tool_use_id: tu.id,
        content: result,
        ...(isError ? { is_error: true } : {}),
      };
    });

    messages = [...messages, { role: 'user', content: toolResults }];
  }

  events.onError('Reached the tool-iteration limit.');
  return messages;
}

// ---------------------------------------------------------------------------
// Transport: Rust command on desktop (key stays native), HTTP proxy on web
// ---------------------------------------------------------------------------

async function callModel(body: unknown): Promise<AnthropicResponse> {
  if (isTauri()) {
    return invoke<AnthropicResponse>('ai_message', { body });
  }
  const base = import.meta.env.VITE_CONVERTER_URL ?? 'http://localhost:8787';
  const url = import.meta.env.VITE_AI_PROXY_URL ?? `${base}/ai`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`AI proxy error ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as AnthropicResponse;
}

// ---------------------------------------------------------------------------
// Tool execution — dispatched against the editor + overlay stores
// ---------------------------------------------------------------------------

function clampPage(page: unknown, pageCount: number): number {
  const p = Math.round(Number(page));
  if (!Number.isFinite(p)) return 1;
  return Math.min(Math.max(1, p), Math.max(1, pageCount));
}

function executeTool(name: string, input: unknown): { result: string; isError?: boolean } {
  const editor = useEditor.getState();
  const overlay = useOverlay.getState();
  const inp = (input ?? {}) as Record<string, unknown>;

  switch (name) {
    case 'get_document_info':
      return {
        result: JSON.stringify({
          fileName: editor.fileName,
          pageCount: editor.pageCount,
          currentPage: editor.currentPage,
          availableStamps: availableStampIds(),
        }),
      };

    case 'goto_page': {
      if (!editor.doc) return { result: 'No document is open.', isError: true };
      const page = clampPage(inp.page, editor.pageCount);
      editor.setCurrentPage(page);
      return { result: `Now on page ${page}.` };
    }

    case 'place_stamp': {
      if (!editor.doc) return { result: 'No document is open.', isError: true };
      const stamp = String(inp.stamp);
      const src = resolveStampSrc(stamp);
      if (!src) {
        return {
          result: `Stamp '${stamp}' is not available. Available: ${availableStampIds().join(', ')}.`,
          isError: true,
        };
      }
      const page = clampPage(inp.page, editor.pageCount);
      overlay.addStamp({
        page,
        xPct: Number(inp.x_pct),
        yPct: Number(inp.y_pct),
        widthPct: Number(inp.size_pct) || 22,
        src,
      });
      editor.setCurrentPage(page);
      return { result: `Placed '${stamp}' stamp on page ${page} at (${inp.x_pct}, ${inp.y_pct}).` };
    }

    case 'add_text': {
      if (!editor.doc) return { result: 'No document is open.', isError: true };
      const page = clampPage(inp.page, editor.pageCount);
      overlay.addText({
        page,
        xPct: Number(inp.x_pct),
        yPct: Number(inp.y_pct),
        text: String(inp.text ?? ''),
        color: String(inp.color ?? '#111827'),
        fontSizePct: Number(inp.font_size_pct) || 3,
      });
      editor.setCurrentPage(page);
      return { result: `Added text on page ${page}.` };
    }

    case 'list_placements': {
      const items = overlay.items.map((it) =>
        it.kind === 'stamp'
          ? { kind: 'stamp', page: it.page, x: it.xPct, y: it.yPct }
          : { kind: 'text', page: it.page, text: it.text },
      );
      return { result: items.length ? JSON.stringify(items) : 'Nothing placed yet.' };
    }

    case 'remove_last_placement': {
      const removed = overlay.removeLast();
      return { result: removed ? `Removed the last ${removed.kind}.` : 'Nothing to remove.' };
    }

    default:
      return { result: `Unknown tool: ${name}`, isError: true };
  }
}
