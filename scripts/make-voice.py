# 게임 음성 mp3 일괄 생성 (edge-tts, ko-KR-SunHiNeural)
# 사용법: python3.12 scripts/make-voice.py  (프로젝트 루트에서 실행)
# 목소리를 바꾸려면 VOICE만 수정 후 재실행 (예: ko-KR-InJoonNeural)
import asyncio
import os

import edge_tts

VOICE = "ko-KR-SunHiNeural"
RATE = "-10%"  # 아이가 따라 말할 수 있게 약간 천천히
OUT = "assets/voice"

NUMS = ['하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열']
DINOS = ['티라노사우루스', '벨로시랩터', '스피노사우루스', '알로사우루스',
         '기가노토사우루스', '카르노타우루스', '프테라노돈', '트리케라톱스',
         '브라키오사우루스', '스테고사우루스']


def phrases():
    for i, w in enumerate(NUMS, 1):
        yield f"n{i:02d}", f"{w}!"
        yield f"ask{i:02d}", f"{w}! 찾아보세요. {w}!"
    for i, name in enumerate(DINOS, 1):
        yield f"dino{i:02d}", f"{name}!"
    yield "praise01", "우와! 알을 다 깼다! 정말 잘했어!"


async def main():
    os.makedirs(OUT, exist_ok=True)
    for key, text in phrases():
        path = os.path.join(OUT, f"{key}.mp3")
        await edge_tts.Communicate(text, VOICE, rate=RATE).save(path)
        print(f"{key}.mp3  OK  ({text})")


asyncio.run(main())
