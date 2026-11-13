"""draft/*.html 에 쓰인 글자만 남기도록 fonts/*.ttf 를 줄입니다.

주의: 이미 줄어든 폰트에 다시 실행하면 새 글자가 빠집니다.
새 자막을 넣었다면 Noto Sans KR 원본 TTF를 fonts/ 에 다시 넣은 뒤 실행하세요.
필요: pip install fonttools
"""
import glob
import os
import subprocess
import tempfile

here = os.path.dirname(os.path.abspath(__file__))
chars = set("0123456789:;-–—·~ ")
for page in glob.glob(os.path.join(here, "*.html")):
    with open(page, encoding="utf-8") as f:
        chars |= {c for c in f.read() if ord(c) >= 32}

with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as tf:
    tf.write("".join(sorted(chars)))

for font in sorted(glob.glob(os.path.join(here, "fonts", "*.ttf"))):
    before = os.path.getsize(font)
    out = font + ".sub"
    subprocess.run(
        ["pyftsubset", font, f"--text-file={tf.name}", f"--output-file={out}", "--layout-features=*", "--no-hinting"],
        check=True,
    )
    os.replace(out, font)
    print(os.path.basename(font), before, "->", os.path.getsize(font))
os.unlink(tf.name)
