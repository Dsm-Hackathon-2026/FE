import Image from "next/image";
import Link from "next/link";

type SearchHeaderProps = {
  backHref?: string;
};

export function SearchHeader({ backHref = "/" }: SearchHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <Link
        href={backHref}
        aria-label="뒤로가기"
        className="-ml-2.5 flex size-11 items-center justify-center"
      >
        <Image
          src="/back-icon.svg"
          alt=""
          width={24}
          height={24}
          data-testid="back-icon"
        />
      </Link>

      <Link href="/" aria-label="홈으로 이동">
        <Image
          src="/header-logo.svg"
          alt=""
          width={93}
          height={32}
          data-testid="search-header-logo"
          priority
        />
      </Link>
    </header>
  );
}
