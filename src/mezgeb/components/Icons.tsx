// Simple inline stroke icons (24×24, stroke 1.8) taken from the design reference.
import type { ReactNode, SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children" | "stroke"> & { size?: number; weight?: number };

function Icon({ size = 22, weight = 1.8, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4Z" />
  </Icon>
);

export const AccountsIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="6" width="18" height="13" rx="3" />
    <path d="M3 10h18M16 15h2" />
  </Icon>
);

export const PlusIcon = (p: IconProps) => (
  <Icon size={26} weight={2.4} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const TradingIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" />
    <circle cx="7" cy="17.5" r="1.6" />
    <circle cx="17" cy="17.5" r="1.6" />
  </Icon>
);

export const PlanIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="0.8" fill="currentColor" />
  </Icon>
);

export const SettingsIcon = (p: IconProps) => (
  <Icon size={20} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </Icon>
);

export const CloseIcon = (p: IconProps) => (
  <Icon size={18} weight={2.2} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

export const BackIcon = (p: IconProps) => (
  <Icon size={18} weight={2.2} {...p}>
    <path d="M15 5 8 12l7 7" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon size={14} weight={3} {...p}>
    <path d="M5 12.5 10 17 19 7" />
  </Icon>
);

export const ClockIcon = (p: IconProps) => (
  <Icon size={18} weight={2} {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l2.5 2" />
  </Icon>
);

export const BackspaceIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 6h11v12H9l-6-6Z" />
    <path d="m13 10 4 4M17 10l-4 4" />
  </Icon>
);

export const AlertIcon = (p: IconProps) => (
  <Icon size={18} weight={2} {...p}>
    <path d="M12 4 2.5 20h19Z" />
    <path d="M12 10v4M12 17h.01" />
  </Icon>
);

export const LockIcon = (p: IconProps) => (
  <Icon size={20} {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Icon>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Icon size={14} weight={2} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

export const SunIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
  </Icon>
);

export const MoonIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </Icon>
);

export const HelpIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.6" />
    <path d="M12 17.2h.01" />
  </Icon>
);
