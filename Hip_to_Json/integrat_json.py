import os
import json

# 현재 디렉토리의 모든 .json 파일 탐색
json_files = [f for f in os.listdir('.') if f.endswith('.json') and f != 'constellation.json']

merged_data = []

for file in json_files:
    with open(file, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
            # 각 파일의 최상단이 리스트인지 객체인지에 따라 처리
            if isinstance(data, list):
                merged_data.extend(data)
            else:
                merged_data.append(data)
        except json.JSONDecodeError:
            print(f"⚠️ JSON 파싱 오류: {file}")

# 결과 저장
with open('constellation_edit.json', 'w', encoding='utf-8') as f:
    json.dump(merged_data, f, ensure_ascii=False, indent=2)
