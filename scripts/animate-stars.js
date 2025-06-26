import { raDecToXY } from './utils.js';

/**
 * 두 별자리 간의 부드러운 점 전환 애니메이션
 * @param {SVGElement} svg - SVG 요소
 * @param {Array<{ra: number, dec: number}>} fromStars - 이전 별들
 * @param {Array<{ra: number, dec: number}>} toStars - 새로운 별들
 * @param {number} duration - 총 애니메이션 시간(ms)
 * @param {function} onComplete - 애니메이션 종료 후 실행할 함수
 */
export function fadeTransition(svg, fromStars, toStars, duration = 400, ra_range, dec_range, onComplete = () => {}) {
  const steps = 20;
  const delay = duration / steps;
  let frame = 0;

  const interpolate = (a, b, t) => a + (b - a) * t;

  const pad = (arr, targetLength) => {
    const result = arr.slice();
    while (result.length < targetLength) {
      result.push({ ra: Math.random() * (ra_range[1]-ra_range[0]) + ra_range[0], dec: Math.random() * (dec_range[1]-dec_range[0]) + dec_range[0] });
    } // 별의 개수가 부족하다면 충분해질 때까지 랜덤 위치에 생성.
    return result; // 리턴!!! 돌려주다!!
  };

  const from = pad(fromStars, toStars.length);
  const to = pad(toStars, from.length);

  const interval = setInterval(() => {
    svg.innerHTML = "";
    const t = frame / steps;

    for (let i = 0; i < from.length; i++) { //이동할 별자리의 모든 별에 대하여
      const ra = interpolate(from[i].ra, to[i].ra, t);
      const dec = interpolate(from[i].dec, to[i].dec, t); // 이동해야 하는 위치까지의 직선
      const [x, y] = raDecToXY(ra, dec, ra_range, dec_range);

      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle"); //점생성
      dot.setAttribute("cx", x);
      dot.setAttribute("cy", y);
      dot.setAttribute("r", 1.5);
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
