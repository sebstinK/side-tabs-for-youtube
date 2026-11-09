"""Render the extension icons as PNG without external libraries (4x4 supersampling)."""
import struct
import sys
import zlib

OUT = sys.argv[1]
SS = 4

BG = (79, 70, 229)        # indigo
VIDEO = (255, 255, 255)
TAB_ON = (255, 255, 255)
TAB_OFF = (165, 160, 245)


def in_rrect(x, y, x0, y0, x1, y1, r):
    if x < x0 or x > x1 or y < y0 or y > y1:
        return False
    cx = min(max(x, x0 + r), x1 - r)
    cy = min(max(y, y0 + r), y1 - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def shapes(size):
    # Coordinates in a 0..1 unit square.
    s = []
    s.append(((0.0, 0.0, 1.0, 1.0, 0.22), BG))
    # video area (left) with a play triangle cut out later
    s.append(((0.14, 0.24, 0.60, 0.76, 0.07), VIDEO))
    # three tabs (right column)
    if size >= 32:
        ys = [(0.24, 0.38), (0.43, 0.57), (0.62, 0.76)]
    else:
        ys = [(0.22, 0.38), (0.42, 0.58), (0.62, 0.78)]
    for i, (a, b) in enumerate(ys):
        s.append(((0.66, a, 0.86, b, 0.04), TAB_ON if i == 2 else TAB_OFF))
    return s


def in_play(x, y):
    # triangle inside the video area
    ax, ay, bx, by, cx, cy = 0.31, 0.38, 0.31, 0.62, 0.47, 0.50
    def sign(px, py, qx, qy, rx, ry):
        return (px - rx) * (qy - ry) - (qx - rx) * (py - ry)
    d1 = sign(x, y, ax, ay, bx, by)
    d2 = sign(x, y, bx, by, cx, cy)
    d3 = sign(x, y, cx, cy, ax, ay)
    neg = d1 < 0 or d2 < 0 or d3 < 0
    pos = d1 > 0 or d2 > 0 or d3 > 0
    return not (neg and pos)


def render(size):
    sh = shapes(size)
    rows = []
    for py in range(size):
        row = bytearray([0])
        for px in range(size):
            acc = [0, 0, 0, 0]
            for sy in range(SS):
                for sx in range(SS):
                    x = (px + (sx + 0.5) / SS) / size
                    y = (py + (sy + 0.5) / SS) / size
                    if size == 128:  # Web Store: 96x96 artwork + 16px transparent padding
                        x = (x - 0.125) / 0.75
                        y = (y - 0.125) / 0.75
                    col = None
                    for (x0, y0, x1, y1, r), c in sh:
                        if in_rrect(x, y, x0, y0, x1, y1, r):
                            col = c
                    if col == VIDEO and size >= 32 and in_play(x, y):
                        col = BG
                    if col is not None:
                        acc[0] += col[0]; acc[1] += col[1]; acc[2] += col[2]; acc[3] += 255
            n = SS * SS
            a = acc[3] / n
            if a:
                cov = acc[3] / 255
                row += bytes([round(acc[0] / cov), round(acc[1] / cov), round(acc[2] / cov), round(a)])
            else:
                row += bytes([0, 0, 0, 0])
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    return png


for size in (16, 32, 48, 128):
    with open(f"{OUT}/icon{size}.png", "wb") as f:
        f.write(render(size))
print("done")
