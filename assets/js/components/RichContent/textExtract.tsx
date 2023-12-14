//
// Takes a ProseMirror node and returns an array of strings and mentions
// Paragraphs are separated by a space
//

interface Mention {
  id: string;
  label: string;
}

type ExtractResult = string | Mention;

export function extract(node: any): ExtractResult[] {
  let result: ExtractResult[] = [];

  if (node.type.name === "text") {
    result.push(node.text);
  } else if (node.type.name === "mention") {
    const mention = { id: node.attrs.id, label: node.attrs.label } as Mention;

    result.push(mention);
  } else if (node.content) {
    node.content.forEach((child: any) => {
      result.push(...extract(child));
    });

    if (node.type.name === "paragraph") {
      result.push(" ");
    }
  }

  return result;
}
