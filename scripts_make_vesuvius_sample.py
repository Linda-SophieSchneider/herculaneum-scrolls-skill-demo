import io
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, "/private/tmp/vesuvius_py")

import numpy as np
import requests
from numcodecs import Blosc
from PIL import Image, ImageDraw


BASE = "https://dl.ash2txt.org/other/dev/scrolls/1/segments/54keV_7.91um/20230516112444.zarr/0"
OUT = Path("assets/vesuvius_sample")
OUT.mkdir(parents=True, exist_ok=True)

CHUNK_SHAPE = (4, 512, 512)
ARRAY_SHAPE = (65, 1705, 650)
CODEC = Blosc(cname="zstd", clevel=3, shuffle=2)


def fetch_chunk(zc, yc, xc):
    url = f"{BASE}/{zc}/{yc}/{xc}"
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    raw = CODEC.decode(response.content)
    arr = np.frombuffer(raw, dtype=np.uint8).reshape(CHUNK_SHAPE)
    return arr


def normalize(slice_2d):
    lo, hi = np.percentile(slice_2d, [1, 99])
    scaled = (slice_2d.astype(np.float32) - lo) / max(1, hi - lo)
    return np.clip(scaled * 255, 0, 255).astype(np.uint8)


def save_png(path, arr):
    Image.fromarray(normalize(arr), mode="L").save(path)


def build_preview():
    # Probe a 512 x 512 window in the central-y, left-x area across z.
    yc, xc = 1, 0
    tiles = []
    labels = []
    for z in range(4, 60, 4):
        zc = z // 4
        zi = z % 4
        chunk = fetch_chunk(zc, yc, xc)
        img = Image.fromarray(normalize(chunk[zi]), mode="L").resize((128, 128))
        tiles.append(img.convert("RGB"))
        labels.append(str(z))

    sheet = Image.new("RGB", (4 * 128, 4 * 148), "white")
    draw = ImageDraw.Draw(sheet)
    for i, tile in enumerate(tiles[:16]):
        x = (i % 4) * 128
        y = (i // 4) * 148
        sheet.paste(tile, (x, y))
        draw.text((x + 6, y + 130), f"z={labels[i]}", fill=(0, 0, 0))
    sheet.save(OUT / "preview_contact_sheet.png")


def build_sample():
    # Selected after preview: a small real segment cube around central y.
    yc, xc = 1, 0
    z_start, z_count = 12, 40
    y0, x0, size = 80, 52, 360
    slices = []

    for z in range(z_start, z_start + z_count):
        chunk = fetch_chunk(z // 4, yc, xc)
        crop = chunk[z % 4, y0 : y0 + size, x0 : x0 + size]
        thumb = Image.fromarray(normalize(crop), mode="L").resize((156, 156), Image.Resampling.BILINEAR)
        slices.append(np.array(thumb, dtype=np.uint8))

    stack = np.stack(slices, axis=0)
    # Save a compact JSON payload for direct browser loading.
    payload = {
        "source": "Vesuvius Challenge / dl.ash2txt.org, scroll 1 segment 20230516112444.zarr/0",
        "license_note": "Official challenge data; keep project transparency text visible.",
        "original_shape": ARRAY_SHAPE,
        "sample_window": {
            "z_start": z_start,
            "z_count": z_count,
            "chunk_y": yc,
            "chunk_x": xc,
            "crop_y": y0,
            "crop_x": x0,
            "crop_size": size,
            "downsampled_to": [156, 156],
        },
        "width": 156,
        "height": 156,
        "depth": z_count,
        "values": stack.reshape(-1).tolist(),
    }
    (OUT / "real_scroll_sample.json").write_text(json.dumps(payload), encoding="utf-8")

    # Create a quick visual check.
    preview = Image.new("RGB", (5 * 156, 2 * 178), "white")
    draw = ImageDraw.Draw(preview)
    for i, z in enumerate(np.linspace(0, z_count - 1, 10, dtype=int)):
        tile = Image.fromarray(stack[z], mode="L").convert("RGB")
        x = (i % 5) * 156
        y = (i // 5) * 178
        preview.paste(tile, (x, y))
        draw.text((x + 6, y + 158), f"z={z_start + int(z)}", fill=(0, 0, 0))
    preview.save(OUT / "real_scroll_sample_preview.png")

    atlas = Image.new("L", (8 * 156, 5 * 156), 0)
    for i in range(z_count):
      tile = Image.fromarray(stack[i], mode="L")
      atlas.paste(tile, ((i % 8) * 156, (i // 8) * 156))
    atlas.save(OUT / "real_scroll_atlas.png")


if __name__ == "__main__":
    build_preview()
    build_sample()
    print("saved", OUT / "real_scroll_sample.json")
