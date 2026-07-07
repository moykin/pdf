# converter — conversion + OCR service

Stateless Rust (axum) microservice for the heavy operations that don't run in
the WASM client.

## Endpoints

| Method | Path       | Body                         | Returns                    |
| ------ | ---------- | ---------------------------- | -------------------------- |
| GET    | `/health`  | —                            | `{ status: "ok", ... }`    |
| POST   | `/convert` | multipart: `file`, `target`  | converted file bytes       |
| POST   | `/ocr`     | multipart: `file`, `lang`    | searchable PDF / text      |

`/convert` and `/ocr` currently return **501 Not Implemented** — the HTTP
contract is stable; the engines behind them get wired up when the commercial
SDK license lands (or via LibreOffice-headless + Tesseract, already installed in
the Docker image).

## Run

```bash
# Local (from repo root)
cargo run -p converter                 # listens on :8787

# Docker (build with repo root as context)
docker build -f services/converter/Dockerfile -t pdfcheap-converter .
docker run -p 8787:8787 pdfcheap-converter
```

The frontend reaches this via `VITE_CONVERTER_URL`.
