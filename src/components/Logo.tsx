import Link from "next/link";

interface LogoProps {
  variant?: "dark" | "light";
  size?: number;
}

export default function Logo({ variant = "dark", size = 42 }: LogoProps) {
  const isDark = variant === "dark";

  return (
    <Link
      href="/"
      style={{
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      <img
        src="/logo.png"
        alt="Ciao Sole"
        style={{
          height: `${size}px`,
          width: "auto",
          objectFit: "contain",
          filter: isDark
            ? "invert(1) hue-rotate(180deg) brightness(1.2)"
            : "none",
        }}
      />
    </Link>
  );
}
