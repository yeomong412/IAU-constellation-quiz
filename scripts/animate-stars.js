import { raDecToXY } from './utils.js';
import { computeProjectionBounds } from './utils.js';


/**
 * 두 별자리 간의 부드러운 점 전환 애니메이션
 * @param {SVGElement} svg - SVG 요소
 * @param {Array<{ra: number, dec: number}>} fromStars - 이전 별들
 * @param {Array<{ra: number, dec: number}>} toStars - 새로운 별들
 * @param {number} duration - 총 애니메이션 시간(ms)
 * @param {function} onComplete - 애니메이션 종료 후 실행할 함수
 */
export function fadeTransition(
  svg, fromStars, toStars,
  duration = 700,
  ra_0, dec_0,
  toBounds, fromBounds,
  onComplete = () => {}
) {
  const steps = 20;
  const delay = duration / steps;
  let frame = 0;

  const interpolate = (a, b, t) => a + (b - a) * t;

  const pad = (arr, targetLength, bounds) => {
  const result = arr.slice();
  const { minX, minY, dx, dy } = bounds;

  while (result.length < targetLength) {
    const ra = Math.random() * 360;
    const dec = Math.random() * 180 - 90;
    result.push({ ra, dec });
  }

    return result;
  };

  const from = pad(fromStars, toStars.length, fromBounds);
  const to = pad(toStars, from.length, toBounds);
  
  const interval = setInterval(() => {
    svg.innerHTML = "";
    const t = frame / steps;

    for (let i = 0; i < from.length; i++) { //이동할 별자리의 모든 별에 대하여
      let from_xy = raDecToXY(from[i].ra, from[i].dec, ra_0, dec_0, fromBounds);
      let to_xy = raDecToXY(to[i].ra, to[i].dec, ra_0, dec_0, toBounds);

      const [x, y] = [interpolate(from_xy[0], to_xy[0], t), interpolate(from_xy[1], to_xy[1], t)];// 이동해야 하는 위치까지의 직선

      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle"); //점생성
      dot.setAttribute("cx", x);
      dot.setAttribute("cy", y);
      dot.setAttribute("r", 1);
      dot.setAttribute("fill", `rgba(255,255,255,${t})`);
      svg.appendChild(dot); //점 노드
    }

    frame++; //프레임 수 올림
    if (frame > steps) {
      clearInterval(interval); // 반복 작업 종료 
      onComplete();
    }
  }, delay);
}
// export function fadeTransition(svg, oldStars, newStars, duration, callback) {
//   const circles = svg.querySelectorAll("circle");
//   circles.forEach(dot => {
//     dot.style.transition = `opacity ${duration / 2}ms`;
//     dot.style.opacity = 0;
//   });

//   setTimeout(() => {
//     callback();
//     const newCircles = svg.querySelectorAll("circle");
//     newCircles.forEach(dot => {
//       dot.style.transition = `opacity ${duration / 2}ms`;
//       dot.style.opacity = 1;
//     });
//   }, duration / 2);
// }
