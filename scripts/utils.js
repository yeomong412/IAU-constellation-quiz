export async function loadData(path) { //json 데이터 페치
  const res = await fetch(path);
  return await res.json();
}


export function raDecToXY(ra, dec, ra_range, dec_range) {
  let x = 0
  let y = 0
  if (ra_range[1] - ra_range[0] < 0){
    if(ra<=180){
      x = 100-((ra+360-ra_range[0]) / (ra_range[1]+(360-ra_range[0]))) * 100;  // 적경 좌표 맵핑. (적경 좌표는 십진법 사용)
      y = 100 - ((dec - dec_range[0]) / ((dec_range[1]-dec_range[0]))) * 100; //적위 좌표는 -90~90 -> 100~0이 되도록 맵핑.
    }else{
      x = 100-((ra-ra_range[0]) / (ra_range[1]+(360-ra_range[0]))) * 100;  // 적경 좌표 맵핑. (적경 좌표는 십진법 사용)
      y = 100 - ((dec - dec_range[0]) / ((dec_range[1]-dec_range[0]))) * 100; //적위 좌표는 -90~90 -> 100~0이 되도록 맵핑.
    }
  }
  else{
    x = 100-((ra-ra_range[0]) / (ra_range[1]-ra_range[0])) * 100;  // 적경 좌표 맵핑. (적경 좌표는 십진법 사용)
    y = 100 - ((dec - dec_range[0]) / ((dec_range[1]-dec_range[0]))) * 100; //적위 좌표는 -90~90 -> 100~0이 되도록 맵핑.
  }
  return [x, y];
}
