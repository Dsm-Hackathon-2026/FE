type CloseIconProps = {
  testId?: string;
};

export function CloseIcon({ testId }: CloseIconProps) {
  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      data-testid={testId}
    >
      <path
        d="M5 5L19 19M19 5L5 19"
        stroke="#E3E3E3"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  );
}
