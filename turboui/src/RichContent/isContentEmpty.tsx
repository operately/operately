export function isContentEmpty(input: any | string | null | undefined): boolean {
  if (input === null || input === undefined) return true;

  let content: any = null;

  if (typeof input === "string") {
    content = JSON.parse(input);
  } else {
    content = input;
  }

  const innerContent = content["content"];
  if (!innerContent) return true;
  if (innerContent.length === 0) return true;

  if (innerContent.length === 1 && innerContent[0]!["type"] === "paragraph") {
    const firstElement = innerContent[0];
    if (!firstElement) return true;
    if (!firstElement["content"]) return true;

    if (firstElement["content"].length === 0) return true;
    if (firstElement["content"][0]!.text?.trim() === "") return true;
  }

  return false;
}
