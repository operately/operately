export function storyPath(category: string, name: string): string {
  const formattedCategory = category.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const formattedName = name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

  return `/?path=/story/${formattedCategory}--${formattedName}`;
}
