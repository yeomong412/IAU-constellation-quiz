export async function loadData(path) { //json 데이터 페치
  const res = await fetch(path);
  return await res.json();
}

/***********************************************************
 * 아래는 직사각형 투영법 코드
// export function raDecToXY(ra, dec, ra_range, dec_range) {
//   let x = 0
//   let y = 0
//   if (ra_range[1] - ra_range[0] < 0){
//     if(ra<=180){
//       x = 100-((ra+360-ra_range[0]) / (ra_range[1]+(360-ra_range[0]))) * 100;  // 적경 좌표 맵핑. (적경 좌표는 십진법 사용)
//       y = 100 - ((dec - dec_range[0]) / ((dec_range[1]-dec_range[0]))) * 100; //적위 좌표는 -90~90 -> 100~0이 되도록 맵핑.
//     }else{
//       x = 100-((ra-ra_range[0]) / (ra_range[1]+(360-ra_range[0]))) * 100;  // 적경 좌표 맵핑. (적경 좌표는 십진법 사용)
//       y = 100 - ((dec - dec_range[0]) / ((dec_range[1]-dec_range[0]))) * 100; //적위 좌표는 -90~90 -> 100~0이 되도록 맵핑.
//     }
//   }
//   else{
//     x = 100-((ra-ra_range[0]) / (ra_range[1]-ra_range[0])) * 100;  // 적경 좌표 맵핑. (적경 좌표는 십진법 사용)
//     y = 100 - ((dec - dec_range[0]) / ((dec_range[1]-dec_range[0]))) * 100; //적위 좌표는 -90~90 -> 100~0이 되도록 맵핑.
//   }
//   return [x, y];
// }

*/

export function raDecToXY(ra, dec, ra_0, dec_0, bounds) {
  const [x, y] = StereographicProjection(ra, dec, ra_0, dec_0);
  const { minX, minY, dx, dy } = bounds;

  const scale = 90 / Math.max(dx, dy);
  const cx = minX + dx / 2;
  const cy = minY + dy / 2;

  const x_px = 50 - (x - cx) * scale;
  const y_px = 50 - (y - cy) * scale; // y축 뒤집기

  return [x_px, y_px];
}

export function computeProjectionBounds(shape, ra_0, dec_0) {
  const projected = shape.map(([ra, dec]) => StereographicProjection(ra, dec, ra_0, dec_0));
  const xs = projected.map(p => p[0]);
  const ys = projected.map(p => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    minX,
    minY,
    dx: maxX - minX,
    dy: maxY - minY
  };
}


export function StereographicProjection(ra,dec,ra_0,dec_0){ // 평사도법 투영 후 평면좌표 변환
  let lambda=null, phi=null, lambda_0=null, phi_0=null;
  lambda  = ra * (Math.PI/180);
  phi = dec * (Math.PI/180);
  lambda_0 = ra_0 * (Math.PI/180);
  phi_0 = dec_0 * (Math.PI/180);   // 저 긴 수식을 아무래도 주석으로 설명할 순 없겠다...
  const k = 2/(1 + Math.sin(phi_0)*Math.sin(phi) + Math.cos(phi_0)*Math.cos(phi)*Math.cos(lambda-lambda_0));
  const x = k * Math.cos(phi) * Math.sin(lambda - lambda_0);
  const y = k * (Math.cos(phi_0)*Math.sin(phi) - Math.sin(phi_0)*Math.cos(phi)*Math.cos(lambda-lambda_0))
  return [x, y];
}
