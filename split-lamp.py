from PIL import Image
import os

SOURCE = "public/lamp/heroImage.png"
OUTPUT = "public/lamp/parts"

os.makedirs(OUTPUT, exist_ok=True)

img = Image.open(SOURCE).convert("RGBA")

parts = {
    "canopy":      (379, 0,    645, 262),
    "upper-shade": (364, 274,  660, 785),
    "ring":        (398, 799,  627, 871),
    "lower-shade": (234, 880,  791, 1159),
    "socket":      (452, 1170, 573, 1364),
    "diffuser":    (319, 1397, 705, 1497),
}

for name, box in parts.items():
    piece = img.crop(box)
    piece.save(f"{OUTPUT}/{name}.png")
    print(f"Creado: {name}.png")

print("Listo.")