#!/usr/bin/env python3
"""Gera os ícones do 3things (Tauri) sem dependências externas."""
import os
import struct
import subprocess
import zlib

SIZE = 1024
BLACK = (0, 0, 0, 255)
WHITE = (255, 255, 255, 255)
YELLOW = (250, 204, 21, 255)
BLUE = (59, 130, 246, 255)
RED = (239, 68, 68, 255)

HERE = os.path.dirname(os.path.abspath(__file__))
ICONS = os.path.normpath(os.path.join(HERE, "..", "src-tauri", "icons"))
ICONSET = os.path.join(ICONS, "icon.iconset")


def main():
    img = [[WHITE] * SIZE for _ in range(SIZE)]

    def rect(x0, y0, x1, y1, color):
        for y in range(max(0, y0), min(SIZE, y1)):
            row = img[y]
            for x in range(max(0, x0), min(SIZE, x1)):
                row[x] = color

    rect(48, 48, 976, 64, BLACK)
    rect(48, 960, 976, 976, BLACK)
    rect(48, 48, 64, 976, BLACK)
    rect(960, 48, 976, 976, BLACK)

    for i, color in enumerate((YELLOW, BLUE, RED)):
        y0 = 224 + i * 208
        x0, x1, height = 160, 864, 144
        rect(x0 + 12, y0 + 12, x1 + 12, y0 + height + 12, BLACK)
        rect(x0, y0, x1, y0 + height, BLACK)
        rect(x0 + 12, y0 + 12, x1 - 12, y0 + height - 12, color)

    raw = b"".join(
        b"\x00" + b"".join(struct.pack("4B", *px) for px in row) for row in img
    )

    def chunk(kind, payload):
        return (
            struct.pack(">I", len(payload))
            + kind
            + payload
            + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF)
        )

    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )

    os.makedirs(ICONSET, exist_ok=True)
    master = os.path.join(ICONS, "icon.png")
    with open(master, "wb") as handle:
        handle.write(png)

    sizes = {
        "icon_16x16.png": 16,
        "icon_16x16@2x.png": 32,
        "icon_32x32.png": 32,
        "icon_32x32@2x.png": 64,
        "icon_128x128.png": 128,
        "icon_128x128@2x.png": 256,
        "icon_256x256.png": 256,
        "icon_256x256@2x.png": 512,
        "icon_512x512.png": 512,
        "icon_512x512@2x.png": 1024,
    }
    for name, pixels in sizes.items():
        out = os.path.join(ICONSET, name)
        subprocess.run(["sips", "-s", "format", "png", "-z", str(pixels), str(pixels), master, "--out", out], check=True, capture_output=True)

    subprocess.run(["iconutil", "-c", "icns", ICONSET, "-o", os.path.join(ICONS, "icon.icns")], check=True)
    for name, pixels in (("32x32.png", 32), ("128x128.png", 128), ("128x128@2x.png", 256)):
        subprocess.run(["sips", "-s", "format", "png", "-z", str(pixels), str(pixels), master, "--out", os.path.join(ICONS, name)], check=True, capture_output=True)
    print("Ícones gerados em", ICONS)


if __name__ == "__main__":
    main()
