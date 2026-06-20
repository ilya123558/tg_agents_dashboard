'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

type BodyZone =
  | 'hair' | 'head' | 'face' | 'thyroid'
  | 'heart' | 'chest' | 'adrenals' | 'liver'
  | 'stomach' | 'intestines' | 'pelvis'
  | 'joints' | 'spine';

const ZONE_META: Record<BodyZone, { color: string; glow: string; label: string }> = {
  hair:       { color: '#f59e0b', glow: 'rgba(245,158,11,0.38)',  label: 'Волосы / Алопеция' },
  head:       { color: '#8b5cf6', glow: 'rgba(139,92,246,0.40)',  label: 'Нервная система / Голова' },
  face:       { color: '#f97316', glow: 'rgba(249,115,22,0.38)',  label: 'Кожа лица / Акне' },
  thyroid:    { color: '#06b6d4', glow: 'rgba(6,182,212,0.40)',   label: 'Щитовидная железа' },
  heart:      { color: '#ef4444', glow: 'rgba(239,68,68,0.42)',   label: 'Сердце / Сосуды' },
  chest:      { color: '#f43f5e', glow: 'rgba(244,63,94,0.30)',   label: 'Грудная клетка' },
  adrenals:   { color: '#eab308', glow: 'rgba(234,179,8,0.38)',   label: 'Надпочечники / Кортизол' },
  liver:      { color: '#ec4899', glow: 'rgba(236,72,153,0.36)',  label: 'Печень / Желчный пузырь' },
  stomach:    { color: '#22c55e', glow: 'rgba(34,197,94,0.40)',   label: 'Желудок / ЖКТ' },
  intestines: { color: '#10b981', glow: 'rgba(16,185,129,0.38)',  label: 'Кишечник / Микробиом' },
  pelvis:     { color: '#d946ef', glow: 'rgba(217,70,239,0.36)',  label: 'Гормональная / Репродуктивная' },
  joints:     { color: '#38bdf8', glow: 'rgba(56,189,248,0.40)',  label: 'Суставы / Колени' },
  spine:      { color: '#facc15', glow: 'rgba(250,204,21,0.36)',  label: 'Позвоночник / Мышцы' },
};

function detectZones(texts: (string | null | undefined)[]): BodyZone[] {
  const t = texts.filter(Boolean).join(' ').toLowerCase();
  const found = new Set<BodyZone>();
  const rules: [RegExp, BodyZone][] = [
    [/волос|алопеция|облысен/,                                                                          'hair'],
    [/голов|мозг|памят|бессонниц|депресс|тревог|выгоран|стресс|паник|нервн|апатия|настроен|плохо сп/,  'head'],
    [/акне|прыщ|кожа лиц|угри/,                                                                        'face'],
    [/щитовид|ттг|т3|т4|тиреоид|гипотиреоз|гипертиреоз/,                                              'thyroid'],
    [/надпочечник|кортизол/,                                                                            'adrenals'],
    [/сердц|аритм|кардио/,                                                                              'heart'],
    [/желудок|поджелудочн|гастрит/,                                                                     'stomach'],
    [/печень|желчн/,                                                                                    'liver'],
    [/кишечник|дисбактер|микробиом|вздутие|запор|метеоризм|срк|синдром раздраж|пробиотик/,             'intestines'],
    [/яичник|спкя|эстроген|прогестерон|менопауз|климак|цикл|пмс|эндометриоз|матк|тестостерон|простат|репродукт|половые гормон|инсулин/, 'pelvis'],
    [/колен|сустав|артрит|артроз|хрящ/,                                                                 'joints'],
    [/спина|позвоночн|мышц|сколиоз/,                                                                    'spine'],
  ];
  for (const [re, zone] of rules) if (re.test(t)) found.add(zone);
  return [...found];
}

interface Shape { type: 'ellipse'|'circle'|'rect'; props: Record<string, number|string> }

// Zone positions are in the 640×1280 SVG coordinate space
const ZONES_MALE: Record<BodyZone, Shape[]> = {
  hair:       [{ type: 'ellipse', props: { cx: 320, cy: 28,  rx: 108, ry: 30 } }],
  head:       [{ type: 'circle',  props: { cx: 320, cy: 78,  r: 98 } }],
  face:       [{ type: 'ellipse', props: { cx: 320, cy: 108, rx: 72, ry: 66 } }],
  thyroid:    [{ type: 'ellipse', props: { cx: 320, cy: 198, rx: 48, ry: 22 } }],
  heart:      [{ type: 'circle',  props: { cx: 258, cy: 295, r: 58 } }],
  chest:      [{ type: 'ellipse', props: { cx: 320, cy: 318, rx: 150, ry: 94 } }],
  adrenals:   [{ type: 'ellipse', props: { cx: 320, cy: 458, rx: 90, ry: 40 } }],
  liver:      [{ type: 'ellipse', props: { cx: 388, cy: 418, rx: 86, ry: 62 } }],
  stomach:    [{ type: 'ellipse', props: { cx: 268, cy: 422, rx: 82, ry: 62 } }],
  intestines: [{ type: 'ellipse', props: { cx: 320, cy: 542, rx: 132, ry: 102 } }],
  pelvis:     [{ type: 'ellipse', props: { cx: 320, cy: 598, rx: 148, ry: 56 } }],
  joints:     [{ type: 'circle',  props: { cx: 228, cy: 892, r: 58 } }, { type: 'circle', props: { cx: 412, cy: 892, r: 58 } }],
  spine:      [{ type: 'rect',    props: { x: 308,  y: 218,  width: 24, height: 380, rx: 12 } }],
};

const ZONES_FEMALE: Record<BodyZone, Shape[]> = {
  hair:       [{ type: 'ellipse', props: { cx: 320, cy: 28,  rx: 108, ry: 30 } }],
  head:       [{ type: 'circle',  props: { cx: 320, cy: 78,  r: 92 } }],
  face:       [{ type: 'ellipse', props: { cx: 320, cy: 106, rx: 68, ry: 62 } }],
  thyroid:    [{ type: 'ellipse', props: { cx: 320, cy: 196, rx: 46, ry: 22 } }],
  heart:      [{ type: 'circle',  props: { cx: 260, cy: 300, r: 56 } }],
  chest:      [{ type: 'ellipse', props: { cx: 320, cy: 322, rx: 144, ry: 90 } }],
  adrenals:   [{ type: 'ellipse', props: { cx: 320, cy: 462, rx: 86, ry: 38 } }],
  liver:      [{ type: 'ellipse', props: { cx: 384, cy: 422, rx: 82, ry: 60 } }],
  stomach:    [{ type: 'ellipse', props: { cx: 265, cy: 425, rx: 78, ry: 60 } }],
  intestines: [{ type: 'ellipse', props: { cx: 320, cy: 546, rx: 126, ry: 98 } }],
  pelvis:     [{ type: 'ellipse', props: { cx: 320, cy: 602, rx: 168, ry: 60 } }],
  joints:     [{ type: 'circle',  props: { cx: 222, cy: 888, r: 55 } }, { type: 'circle', props: { cx: 418, cy: 888, r: 55 } }],
  spine:      [{ type: 'rect',    props: { x: 308,  y: 216,  width: 24, height: 378, rx: 12 } }],
};

function ZoneShape({ shape, color, glow }: { shape: Shape; color: string; glow: string }) {
  const style = { filter: `drop-shadow(0 0 10px ${color}90)` };
  if (shape.type === 'circle')  return <motion.circle  fill={glow} style={style} {...(shape.props as any)} />;
  if (shape.type === 'ellipse') return <motion.ellipse fill={glow} style={style} {...(shape.props as any)} />;
  if (shape.type === 'rect')    return <motion.rect    fill={glow} style={style} {...(shape.props as any)} />;
  return null;
}

// potrace output — viewBox 0 0 640 1280, transform flips Y axis
const MAN_PATH =
  'M3108 12784 c-90 -19 -148 -45 -225 -100 -142 -102 -221 -254 -243 -472 -12 -114 -6 -197 17 -252 8 -19 19 -84 24 -145 14 -181 68 -335 148 -427 35 -39 41 -53 47 -109 8 -82 -9 -175 -38 -206 -75 -80 -270 -140 -598 -183 -335 -44 -430 -65 -524 -114 -113 -59 -172 -199 -213 -511 -24 -179 -23 -743 1 -1040 30 -372 84 -809 126 -1013 16 -82 17 -98 5 -132 -39 -110 -50 -211 -49 -460 1 -303 6 -351 114 -975 62 -366 76 -461 100 -710 21 -216 77 -371 178 -492 49 -58 52 -66 52 -117 0 -130 45 -615 91 -976 35 -273 57 -419 101 -655 l31 -170 -21 -165 c-47 -366 -59 -628 -43 -930 18 -321 43 -500 141 -995 67 -342 100 -552 100 -642 0 -51 3 -64 19 -73 11 -5 25 -26 31 -45 16 -49 1 -116 -71 -310 -33 -87 -62 -178 -66 -200 -5 -38 -2 -43 35 -77 65 -59 138 -81 267 -82 154 -1 254 29 309 94 33 40 34 86 5 213 -20 84 -21 119 -20 407 0 173 3 338 6 365 14 129 86 920 100 1085 31 383 45 663 45 920 0 156 5 283 11 310 7 27 12 179 14 375 1 182 7 389 13 460 19 213 82 1447 82 1604 0 46 3 81 6 78 12 -11 33 -769 33 -1172 1 -387 -2 -427 -34 -600 -13 -67 -19 -182 -25 -455 -5 -201 -14 -437 -20 -525 -14 -193 -8 -792 16 -1390 24 -628 23 -715 -10 -945 -15 -107 -28 -231 -27 -275 0 -44 -9 -141 -20 -215 -12 -74 -19 -152 -16 -173 11 -84 96 -128 260 -135 165 -7 296 26 375 94 38 32 42 40 42 80 0 26 -21 109 -51 202 -34 104 -53 181 -56 227 -5 66 -3 73 22 103 23 28 28 45 36 139 15 161 43 326 105 611 30 142 69 320 85 397 119 551 179 1076 179 1561 0 82 6 140 25 220 98 439 178 1007 216 1554 l13 175 42 45 c135 146 180 285 214 660 6 68 15 140 20 160 5 19 13 71 20 115 6 44 39 211 75 370 120 543 145 714 145 980 0 169 -15 299 -44 382 -8 23 -10 49 -5 66 13 47 47 396 66 662 12 175 17 384 17 695 1 463 -7 597 -45 828 -34 206 -74 303 -152 365 -103 82 -206 119 -522 186 -322 69 -467 120 -542 191 -32 29 -38 59 -38 196 l0 121 42 46 c94 101 142 246 150 447 4 107 9 144 25 178 19 40 20 50 9 155 -26 245 -121 392 -315 487 -135 67 -274 85 -418 54z m-964 -3709 c46 -256 95 -614 112 -822 6 -76 4 -86 -25 -156 -35 -86 -74 -206 -94 -292 -14 -58 -14 -56 -9 85 3 86 0 160 -6 182 -8 30 -6 49 9 97 10 33 24 119 30 191 16 175 -2 488 -47 815 -14 100 5 36 30 -100z m2176 -690 c14 -123 35 -223 55 -272 11 -27 13 -44 6 -63 -25 -66 -51 -272 -51 -404 0 -33 -2 -57 -5 -54 -3 3 -12 58 -20 124 -16 130 -58 374 -80 470 -16 70 -11 137 41 539 l29 220 6 -230 c4 -126 12 -275 19 -330z';

const WOMAN_PATH =
  'M3123 12789 c-73 -12 -183 -52 -251 -90 -78 -45 -183 -151 -214 -219 -92 -196 -135 -485 -125 -835 6 -205 22 -329 58 -448 l20 -68 29 25 c33 27 115 60 174 69 l39 6 -7 -68 c-9 -102 -21 -126 -83 -171 -101 -72 -176 -94 -590 -174 -225 -44 -311 -91 -371 -203 -129 -243 -204 -768 -218 -1528 -6 -332 6 -748 27 -918 9 -72 8 -95 -5 -135 -58 -181 -66 -511 -21 -862 14 -110 27 -189 109 -663 20 -114 36 -223 36 -241 0 -19 4 -46 10 -60 5 -14 16 -105 25 -203 19 -209 27 -252 61 -354 30 -91 77 -173 145 -251 l49 -56 20 -144 c65 -455 185 -1019 321 -1500 l49 -176 -19 -74 c-85 -314 -127 -699 -118 -1088 7 -296 22 -445 93 -919 58 -393 84 -591 84 -660 0 -31 7 -51 25 -73 44 -52 31 -110 -81 -354 -88 -194 -93 -223 -43 -269 126 -115 464 -109 569 12 37 42 39 85 9 210 -20 81 -21 113 -20 408 1 302 3 338 36 605 84 678 115 1030 122 1392 6 288 -3 451 -31 559 -8 30 -9 55 -3 70 50 132 80 416 58 552 -10 60 -9 111 3 268 21 257 52 843 67 1261 7 186 14 337 15 335 7 -8 36 -908 37 -1167 2 -300 0 -320 -23 -430 -23 -108 -25 -133 -24 -400 0 -222 4 -300 16 -355 14 -61 14 -74 2 -97 -8 -15 -24 -83 -37 -150 -21 -117 -22 -148 -22 -643 1 -495 7 -676 44 -1250 9 -140 3 -235 -30 -470 -11 -82 -22 -202 -24 -265 -2 -63 -11 -155 -19 -205 -24 -140 -22 -178 14 -219 43 -49 104 -67 241 -73 95 -4 130 -2 197 15 90 23 186 78 204 116 14 32 -6 94 -77 236 -72 143 -103 223 -111 281 -6 42 -3 50 18 72 21 21 26 37 31 116 11 147 43 332 128 736 44 209 89 427 100 485 91 493 126 957 99 1320 l-9 125 49 175 c139 497 260 1066 326 1535 l17 120 53 58 c82 92 150 234 173 365 6 31 18 134 26 227 9 94 18 176 20 183 3 7 12 61 21 120 8 59 36 197 60 307 114 507 145 687 165 933 12 158 2 322 -28 447 -20 85 -21 115 -5 330 22 296 15 1014 -13 1335 -34 383 -90 656 -160 776 -36 61 -141 153 -237 207 -46 26 -146 75 -223 108 -357 156 -470 215 -548 284 -30 26 -47 70 -47 117 0 33 0 33 130 13 146 -22 135 -27 158 63 92 346 31 959 -128 1288 -99 205 -343 309 -617 263z m-894 -3644 c51 -217 94 -468 126 -740 22 -195 22 -204 -26 -277 -67 -103 -155 -294 -204 -438 -47 -141 -52 -139 -35 15 12 113 14 313 3 343 -6 16 -1 47 19 107 63 188 94 513 85 880 -3 121 -9 229 -13 240 -5 14 -4 17 3 10 6 -5 25 -68 42 -140z m1964 -172 c13 -335 72 -714 138 -879 19 -48 19 -53 4 -110 -14 -52 -33 -272 -35 -409 -1 -48 -3 -46 -35 65 -58 201 -122 357 -200 490 l-44 75 14 110 c8 61 42 260 75 444 33 184 60 342 60 352 0 11 4 19 8 19 5 0 12 -71 15 -157z';

function MaleBody() {
  return (
    <g transform="translate(0,1280) scale(0.1,-0.1)" fill="#1e4025" stroke="none" fillRule="evenodd">
      <path d={MAN_PATH}/>
    </g>
  );
}

function FemaleBody() {
  return (
    <g transform="translate(0,1280) scale(0.1,-0.1)" fill="#1e4025" stroke="none" fillRule="evenodd">
      <path d={WOMAN_PATH}/>
    </g>
  );
}

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────
interface Props {
  location:   string | null;
  problem:    string;
  markers:    string | null;
  text?:      string;
  gender?:    string | null;
  readiness?: string | null;
  size?:      'sm' | 'md' | 'lg';
}

const SIZE_DIMS: Record<'sm'|'md'|'lg', { w: number; h: number }> = {
  sm: { w: 100, h: 200 },
  md: { w: 148, h: 296 },
  lg: { w: 170, h: 340 },
};

export function BodyMap({ location, problem, markers, text, gender, size = 'md' }: Props) {
  const zones = useMemo(
    () => detectZones([location, problem, markers, text]),
    [location, problem, markers, text],
  );

  const isFemale = gender === 'женский';
  const ZONES = isFemale ? ZONES_FEMALE : ZONES_MALE;
  const { w, h } = SIZE_DIMS[size];

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* SVG figure */}
      <motion.div
        className="relative flex items-center justify-center shrink-0"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 35%, rgba(16,185,129,0.1) 0%, transparent 70%)' }}
        />
        <svg
          viewBox="-20 -20 680 1320"
          width={w}
          height={h}
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible relative z-10"
        >
          {isFemale ? <FemaleBody /> : <MaleBody />}

          {zones.map((zone, i) => (
            <motion.g
              key={zone}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 + 0.2, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              {ZONES[zone].map((shape, j) => (
                <ZoneShape key={j} shape={shape} color={ZONE_META[zone].color} glow={ZONE_META[zone].glow} />
              ))}
            </motion.g>
          ))}

          {zones.length === 0 && (
            <motion.ellipse
              cx="320" cy="640" rx="220" ry="500"
              fill="rgba(16,185,129,0.04)"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </svg>

        <div className="absolute bottom-1 right-0 text-[11px] text-emerald-800/60 font-medium select-none pr-1">
          {isFemale ? '♀' : '♂'}
        </div>
      </motion.div>

      {/* Zone labels */}
      <div className="flex flex-col gap-1.5 w-full">
        {zones.length > 0 ? zones.map((zone, i) => (
          <motion.div
            key={zone}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 + 0.3 }}
            className="flex items-center gap-2.5 bg-black/20 rounded-lg px-3 py-1.5 border border-white/[0.04]"
          >
            <motion.span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: ZONE_META[zone].color, boxShadow: `0 0 7px ${ZONE_META[zone].color}` }}
              animate={{ opacity: [1, 0.4, 1], scale: [1, 1.3, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.35 }}
            />
            <span className="text-[11px] text-gray-300 leading-tight">{ZONE_META[zone].label}</span>
          </motion.div>
        )) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[11px] text-gray-600 text-center"
          >
            Зона не определена
          </motion.p>
        )}
      </div>
    </div>
  );
}
