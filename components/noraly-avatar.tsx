import Image from "next/image";

/** Avatar rond de Noraly, cerclé d'un filet glacier discret. */
export function NoralyAvatar({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/noraly-logo.png.jpg"
      alt="Noraly"
      width={size}
      height={size}
      sizes={`${size}px`}
      className={`shrink-0 rounded-full border border-ice/20 object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
