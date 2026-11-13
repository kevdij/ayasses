export default function Logo({ size = 40 }) {
  return (
    <img
      src="/images/logo.png"
      width={size}
      height={size}
      alt=""
      className="logo"
    />
  );
}
