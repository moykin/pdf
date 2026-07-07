# Build the converter service. Build with the REPO ROOT as context so the
# Rust workspace resolves:  docker build -f services/converter/Dockerfile .
FROM rust:1.83-slim AS build
WORKDIR /app
COPY . .
RUN cargo build --release -p converter

FROM debian:bookworm-slim
# LibreOffice headless powers Office<->PDF conversion; Tesseract powers OCR.
# Swap these for the commercial SDK's server components if you license one.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-core libreoffice-writer libreoffice-calc libreoffice-impress \
    tesseract-ocr ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/release/converter /usr/local/bin/converter

EXPOSE 8787
ENV PORT=8787
CMD ["converter"]
