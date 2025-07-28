import csv
import json
import pandas as pd
import math

df = pd.read_csv('constellations.csv', encoding='utf-8-sig')

# 열별로 리스트 추출
english_names = df.iloc[:, 0].tolist()  # 1번 열 (영문명)
abbreviations = df.iloc[:, 1].tolist()  # 2번 열 (약자)
korean_names = df.iloc[:, 2].tolist()   # 3번 열 (한글명)

for i in range(1):

    FAB_PATH = "constellationship.fab"
    HIP_CSV_PATH = "Hipparcos_data.csv"
    TARGET_ABBR = abbreviations[i]
    TARGET_NAME_EN = english_names[i]
    TARGET_NAME_KR = korean_names[i]
    OUTPUT_JSON_PATH = f"{TARGET_ABBR}.json"

    # HIP 번호 → (RA, Dec) 매핑
    hip_to_coord = {}
    with open(HIP_CSV_PATH, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                hip = int(row["HIP"])
                ra_str = row["_RA_icrs"].strip()
                dec_str = row["_DE_icrs"].strip()
                if ra_str == "" or dec_str == "":
                    continue
                ra = float(ra_str)
                dec = float(dec_str)
                hip_to_coord[hip] = [ra, dec]
            except (ValueError, KeyError):
                continue

    # 별자리 연결 정보 추출
    connections = []
    with open(FAB_PATH, encoding='utf-8') as f:
        for line in f:
            parts = line.strip().split()
            if parts[0] == TARGET_ABBR:
                hips = list(map(int, parts[2:]))
                for i in range(0, len(hips), 2):
                    connections.append((hips[i], hips[i+1]))
                break

    # shape과 lines 생성
    shape = []
    lines = []
    coord_to_index = {}

    for hip1, hip2 in connections:
        for hip in (hip1, hip2):
            if hip not in coord_to_index and hip in hip_to_coord:
                coord_to_index[hip] = len(shape)
                shape.append(hip_to_coord[hip])
        if hip1 in coord_to_index and hip2 in coord_to_index:
            lines.append([coord_to_index[hip1], coord_to_index[hip2]])

    # === 정방형 RA/Dec 범위 계산 ===
    def compute_equal_ranges(shape, padding_ratio=0.1):
        ra_vals = [coord[0] for coord in shape]
        dec_vals = [coord[1] for coord in shape]
        
        ra_min, ra_max = min(ra_vals), max(ra_vals)
        dec_min, dec_max = min(dec_vals), max(dec_vals)
        
        ra_center = (ra_min + ra_max) / 2
        dec_center = (dec_min + dec_max) / 2

        ra_span = ra_max - ra_min
        dec_span = dec_max - dec_min
        max_span = max(ra_span, dec_span)
        padded_span = max_span * (1 + padding_ratio)

        ra_range = [round(ra_center - padded_span / 2), round(ra_center + padded_span / 2)]
        dec_range = [round(dec_center - padded_span / 2), round(dec_center + padded_span / 2)]
        return ra_range, dec_range
    
    def compute_centroid(shape):
        ra_vals = [coord[0] for coord in shape]
        dec_vals = [coord[1] for coord in shape]

        # RA: 단위원 평균
        x_sum = sum(math.cos(math.radians(ra)) for ra in ra_vals)
        y_sum = sum(math.sin(math.radians(ra)) for ra in ra_vals)
        ra_0 = math.degrees(math.atan2(y_sum, x_sum))
        if ra_0 < 0:
            ra_0 += 360  # 0~360°로 보정

        # Dec: 단순 평균
        dec_0 = sum(dec_vals) / len(dec_vals)

        return ra_0, dec_0

    # 기존 코드에서
    ra_range, dec_range = compute_equal_ranges(shape)

    # 기본 정보 구성 (shape/lines 제외)
    result = {
        "name_en": f"{TARGET_NAME_EN}",
        "name_ko": f"{TARGET_NAME_KR}",
        "abbr": f"{TARGET_ABBR}",
        "ra_range": ra_range,
        "dec_range": dec_range,
        "center": compute_centroid(shape),
        "major_stars": [
            { "name": "", "ra": 0, "dec": 0 }
        ],
        "is_zodiac": False,
        "is_equatorial": False
    }

    # shape/lines 포맷 (줄바꿈)
    def format_array(arr):
        return "[\n" + ",\n".join(f"  {elem}" for elem in arr) + "\n]"

    shape_formatted = format_array(shape)
    lines_formatted = format_array(lines)

    # 전체 JSON 파일 작성
    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        base_json = json.dumps(result, indent=2, ensure_ascii=False)
        base_json = base_json.rstrip("}")  # 마지막 중괄호 제거
        f.write(base_json)
        f.write(',\n  "shape": ' + shape_formatted + ",\n")
        f.write('  "lines": ' + lines_formatted + "\n}\n")

    print(f"✅ JSON 생성 완료: {OUTPUT_JSON_PATH}")
