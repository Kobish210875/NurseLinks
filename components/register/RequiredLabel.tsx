type RequiredLabelProps = {
  children: React.ReactNode;
};

export default function RequiredLabel({ children }: RequiredLabelProps) {
  return (
    <span className="text-sm font-medium text-foreground">
      {children}
      <span className="text-red-600" aria-hidden="true">
        {" "}
        *
      </span>
    </span>
  );
}
