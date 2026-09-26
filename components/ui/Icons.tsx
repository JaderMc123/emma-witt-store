type P = { className?: string; size?: number; strokeWidth?: number };
const base = (size = 20) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "aria-hidden": true as const });

export const IconBag = ({ className, size, strokeWidth = 1.2 }: P) => (
  <svg {...base(size)} className={className} strokeWidth={strokeWidth}><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6.5a3 3 0 016 0V8" /></svg>
);
export const IconMenu = ({ className, size, strokeWidth = 1.2 }: P) => (
  <svg {...base(size)} className={className} strokeWidth={strokeWidth}><path d="M3 8h18M3 16h12" /></svg>
);
export const IconClose = ({ className, size, strokeWidth = 1.2 }: P) => (
  <svg {...base(size)} className={className} strokeWidth={strokeWidth}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const IconArrow = ({ className, size, strokeWidth = 1.2 }: P) => (
  <svg {...base(size)} className={className} strokeWidth={strokeWidth}><path d="M4 12h16M14 6l6 6-6 6" /></svg>
);
export const IconArrowLeft = ({ className, size, strokeWidth = 1.2 }: P) => (
  <svg {...base(size)} className={className} strokeWidth={strokeWidth}><path d="M20 12H4M10 6l-6 6 6 6" /></svg>
);
export const IconSearch = ({ className, size, strokeWidth = 1.2 }: P) => (
  <svg {...base(size)} className={className} strokeWidth={strokeWidth}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
);
export const IconPlus = ({ className, size, strokeWidth = 1.2 }: P) => (
  <svg {...base(size)} className={className} strokeWidth={strokeWidth}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconMinus = ({ className, size, strokeWidth = 1.2 }: P) => (
  <svg {...base(size)} className={className} strokeWidth={strokeWidth}><path d="M5 12h14" /></svg>
);
export const IconShare = ({ className, size, strokeWidth = 1.2 }: P) => (
  <svg {...base(size)} className={className} strokeWidth={strokeWidth}><path d="M12 3v12M7.5 7.5L12 3l4.5 4.5" /><path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
);
export const IconLink = ({ className, size, strokeWidth = 1.2 }: P) => (
  <svg {...base(size)} className={className} strokeWidth={strokeWidth}><path d="M10 14a4 4 0 005.66 0l3-3a4 4 0 00-5.66-5.66l-1 1" /><path d="M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 005.66 5.66l1-1" /></svg>
);
export const IconCheck = ({ className, size, strokeWidth = 1.4 }: P) => (
  <svg {...base(size)} className={className} strokeWidth={strokeWidth}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const IconFilter = ({ className, size, strokeWidth = 1.2 }: P) => (
  <svg {...base(size)} className={className} strokeWidth={strokeWidth}><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>
);
export const IconTrash = ({ className, size, strokeWidth = 1.2 }: P) => (
  <svg {...base(size)} className={className} strokeWidth={strokeWidth}><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" /></svg>
);
export const IconWhatsApp = ({ className, size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M12.04 2a9.9 9.9 0 00-8.5 15l-1.4 5 5.2-1.36A9.9 9.9 0 1012.04 2zm0 18.1a8.2 8.2 0 01-4.18-1.15l-.3-.18-3.08.8.82-3-.2-.31a8.2 8.2 0 1117.14-4.38 8.2 8.2 0 01-10.2 8.22zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8s-.39-.12-.55.12-.63.8-.78.96-.29.19-.53.06a6.7 6.7 0 01-1.97-1.22 7.4 7.4 0 01-1.37-1.7c-.14-.25 0-.38.11-.5l.37-.43a1.7 1.7 0 00.25-.41.45.45 0 000-.43c-.06-.12-.55-1.33-.76-1.82s-.4-.41-.55-.42h-.47a.9.9 0 00-.65.3 2.74 2.74 0 00-.86 2.04 4.77 4.77 0 001 2.53 10.9 10.9 0 004.18 3.7c.58.25 1.04.4 1.4.51a3.36 3.36 0 001.54.1 2.52 2.52 0 001.65-1.17 2.05 2.05 0 00.14-1.16c-.06-.1-.22-.17-.47-.29z" />
  </svg>
);
export const IconInstagram = ({ className, size, strokeWidth = 1.3 }: P) => (
  <svg {...base(size)} className={className} strokeWidth={strokeWidth}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" /></svg>
);
export const IconFacebook = ({ className, size, strokeWidth = 1.3 }: P) => (
  <svg {...base(size)} className={className} strokeWidth={strokeWidth}><path d="M14 8.5h2.5V5H14a3.5 3.5 0 00-3.5 3.5V11H8v3.5h2.5V21H14v-6.5h2.5L17 11h-3V9a.5.5 0 01.5-.5z" /></svg>
);
export const IconTikTok = ({ className, size, strokeWidth = 1.3 }: P) => (
  <svg {...base(size)} className={className} strokeWidth={strokeWidth}><path d="M14 3v11.5a3.5 3.5 0 11-3.5-3.5" /><path d="M14 3a5 5 0 005 5" /></svg>
);
