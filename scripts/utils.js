export async function loadData(path) { //json 데이터 페치
  const res = await fetch(path);
  return await res.json();
}

export function raDecToXY(ra, dec) {
  const x = (ra / 360) * 100;  // 적경 좌표 맵핑. (적경 좌표는 십진법 사용)
  const y = 100 - ((dec + 90) / 180) * 100; //적위 좌표는 -90~90 -> 100~0이 되도록 맵핑.
  return [x, y];
}
