import logoImg from "@/assets/logo.jpg";

export function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={logoImg}
      alt="BrasilLojas"
      width={size}
      height={size}
      className={`rounded-full object-cover bg-white ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
