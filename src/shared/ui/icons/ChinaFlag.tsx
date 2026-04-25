export function ChinaFlag({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 2/3)} viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
      <rect width="30" height="20" fill="#DE2910"/>
      {/* большая звезда */}
      <polygon points="5,2 6.18,5.09 9.51,5.09 6.9,7.06 7.94,10.18 5,8.45 2.06,10.18 3.1,7.06 0.49,5.09 3.82,5.09"
        fill="#FFDE00" transform="translate(0,0) scale(0.9)"/>
      {/* малые звёзды */}
      <polygon points="1,0 1.5,1.54 3,1.54 1.76,2.49 2.24,4.04 1,3.09 -0.24,4.04 0.24,2.49 -1,1.54 0.5,1.54"
        fill="#FFDE00" transform="translate(11,1) scale(0.55)"/>
      <polygon points="1,0 1.5,1.54 3,1.54 1.76,2.49 2.24,4.04 1,3.09 -0.24,4.04 0.24,2.49 -1,1.54 0.5,1.54"
        fill="#FFDE00" transform="translate(14,4) scale(0.55)"/>
      <polygon points="1,0 1.5,1.54 3,1.54 1.76,2.49 2.24,4.04 1,3.09 -0.24,4.04 0.24,2.49 -1,1.54 0.5,1.54"
        fill="#FFDE00" transform="translate(14,8) scale(0.55)"/>
      <polygon points="1,0 1.5,1.54 3,1.54 1.76,2.49 2.24,4.04 1,3.09 -0.24,4.04 0.24,2.49 -1,1.54 0.5,1.54"
        fill="#FFDE00" transform="translate(11,11) scale(0.55)"/>
    </svg>
  );
}
