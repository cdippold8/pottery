import Image from "next/image";

export default function Logo() {
  return (
    <Image
      src="/brand/logo.png"
      alt="Studio"
      width={2808}
      height={1112}
      priority
      className="h-7 w-auto"
    />
  );
}
