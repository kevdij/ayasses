export default function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="logo">
      <circle cx="24" cy="24" r="22" fill="var(--night-2)" />
      <circle cx="30" cy="17" r="8" fill="var(--moon)" />
      <path d="M2 36 L14 24 L22 31 L31 20 L46 36 A22 22 0 0 1 2 36 Z" fill="var(--mountain-1)" />
      <path d="M12 15 Q19 9 26 15" stroke="var(--accent)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M14 15.5 L19 21 M24 15.5 L19 21" stroke="var(--snow)" strokeWidth="0.8" />
    </svg>
  );
}
