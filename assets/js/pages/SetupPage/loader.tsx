export async function loader(): Promise<null> {
  if (window.appConfig.configured) {
    window.location.href = "/";
  }

  return null;
}
