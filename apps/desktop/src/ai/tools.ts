/**
 * The tool surface the AI assistant can call to act on the open document, plus
 * the system prompt. Tools are executed client-side (see agent.ts → executeTool)
 * against the overlay + editor stores. Schemas use `strict: true` so Claude's
 * tool inputs validate exactly.
 */

export interface AnthropicTool {
  readonly name: string;
  readonly description: string;
  readonly strict?: boolean;
  readonly input_schema: Record<string, unknown>;
}

const obj = (properties: Record<string, unknown>, required: string[]): Record<string, unknown> => ({
  type: 'object',
  additionalProperties: false,
  properties,
  required,
});

export const TOOLS: readonly AnthropicTool[] = [
  {
    name: 'get_document_info',
    description:
      'Inspect the currently open PDF: file name, page count, current page, and which stamps are available to place. Call this first if you need the page count or the list of stamp ids.',
    strict: true,
    input_schema: obj({}, []),
  },
  {
    name: 'goto_page',
    description: 'Scroll the viewer to a specific page.',
    strict: true,
    input_schema: obj(
      { page: { type: 'integer', description: '1-based page number.' } },
      ['page'],
    ),
  },
  {
    name: 'place_stamp',
    description:
      'Place a rubber-stamp image on a page. Coordinates are the CENTER of the stamp as percentages of the page (0–100), origin top-left. Reference points: center ≈ x50 y50; bottom-right ≈ x82 y86; top-right ≈ x82 y14; bottom-center ≈ x50 y88. The stamp appears immediately on the document.',
    strict: true,
    input_schema: obj(
      {
        stamp: {
          type: 'string',
          description:
            "Stamp id: 'approved', 'paid', 'confidential', 'rejected', 'draft', or 'custom' for a user-uploaded stamp. Use get_document_info to confirm 'custom' is available.",
        },
        page: { type: 'integer', description: '1-based page number.' },
        x_pct: { type: 'number', description: 'Horizontal center, 0–100.' },
        y_pct: { type: 'number', description: 'Vertical center, 0–100.' },
        size_pct: {
          type: 'number',
          description: 'Stamp width as a percentage of page width. Typical 18–26.',
        },
      },
      ['stamp', 'page', 'x_pct', 'y_pct', 'size_pct'],
    ),
  },
  {
    name: 'add_text',
    description:
      'Place a line (or short block) of text on a page. Coordinates are the CENTER of the text as percentages of the page (0–100), origin top-left.',
    strict: true,
    input_schema: obj(
      {
        page: { type: 'integer', description: '1-based page number.' },
        x_pct: { type: 'number', description: 'Horizontal center, 0–100.' },
        y_pct: { type: 'number', description: 'Vertical center, 0–100.' },
        text: { type: 'string', description: 'The text to place.' },
        font_size_pct: {
          type: 'number',
          description: 'Font size as a percentage of page height. Typical 2–4.',
        },
        color: { type: 'string', description: "CSS color, e.g. '#111827' or 'red'." },
      },
      ['page', 'x_pct', 'y_pct', 'text', 'font_size_pct', 'color'],
    ),
  },
  {
    name: 'list_placements',
    description: 'List all stamps and text currently placed on the document.',
    strict: true,
    input_schema: obj({}, []),
  },
  {
    name: 'remove_last_placement',
    description: 'Undo the most recently placed stamp or text item.',
    strict: true,
    input_schema: obj({}, []),
  },
];

export const SYSTEM_PROMPT = `You are the built-in AI assistant of PDF.cheap, a PDF editor. You help the user act on the PDF they currently have open by calling tools.

What you can do right now: place rubber stamps (approved / paid / confidential / rejected / draft, or a user-uploaded "custom" stamp), place text, navigate pages, list what's been placed, and undo the last placement. Placed items appear on the document immediately as an overlay the user can drag.

Guidelines:
- When the user asks to stamp/sign/mark a document, pick the matching stamp and a sensible position, then call place_stamp. If they don't specify a location, a signature/approval stamp usually goes bottom-right (≈ x82 y86).
- If you're unsure of the page count or whether a custom stamp exists, call get_document_info first.
- Coordinates are percentages (0–100) of the page, origin top-left, referring to the item's CENTER.
- After acting, confirm briefly what you did in the user's language. Keep replies short.
- If no document is open, or a requested stamp id doesn't exist, say so and suggest what to do (e.g. upload a custom stamp).
- You cannot yet edit the PDF's original text or export a flattened file — those need the commercial engine. Don't claim to have done things you didn't.`;
