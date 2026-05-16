import { useEffect, useMemo, useState } from'react';

function ProgressRing({
 score = 0,
 size = 80,
 strokeWidth = 8,
 color ='#3b82f6',
}) {
 const [animatedScore, setAnimatedScore] = useState(0);
 const normalizedScore = Math.max(0, Math.min(Number(score) || 0, 100));
 const radius = useMemo(() => (size - strokeWidth) / 2, [size, strokeWidth]);
 const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);
 const dashOffset = circumference - (animatedScore / 100) * circumference;

 useEffect(() => {
 const frame = requestAnimationFrame(() => {
 setAnimatedScore(normalizedScore);
 });

 return () => cancelAnimationFrame(frame);
 }, [normalizedScore]);

 return (
 <div
 className="relative inline-flex items-center justify-center"
 style={{ width: size, height: size }}
 >
 <svg
 width={size}
 height={size}
 viewBox={`0 0 ${size} ${size}`}
 className="-rotate-90"
 >
 <circle
 cx={size / 2}
 cy={size / 2}
 r={radius}
 stroke="#e2e8f0"
 strokeWidth={strokeWidth}
 fill="none"
 />
 <circle
 cx={size / 2}
 cy={size / 2}
 r={radius}
 stroke={color}
 strokeWidth={strokeWidth}
 fill="none"
 strokeLinecap="round"
 strokeDasharray={circumference}
 strokeDashoffset={dashOffset}
 style={{ transition:'stroke-dashoffset 700ms ease' }}
 />
 </svg>
 <span className="absolute text-sm font-semibold text-gray-900">
 {Math.round(normalizedScore)}%
 </span>
 </div>
);
}

export default ProgressRing;
