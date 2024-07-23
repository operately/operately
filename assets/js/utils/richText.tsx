export function countCharacters(jsonContent: string, opts?: { skipParse?: boolean }) {
  const content = opts?.skipParse ? jsonContent : JSON.parse(jsonContent);
  let count = 0;

  if(content.content) {
    for(let child of content.content) {
      count += countCharacters(child, { skipParse: true });
    }
  }

  if(content.text) {
    count += content.text.length;
  }

  if(content.attrs?.label) {
    count += content.attrs.label.length;
  }

  return count;
}

export function truncate(jsonContent: string, limit: number, opts?: { skipParse?: boolean, suffix?: string }) {
  const content = opts?.skipParse ? jsonContent : JSON.parse(jsonContent);

  const helper = (content, count) => {
    if(content.text) {
      const total = content.text.length + count;
      
      if (total > limit) {
        content.text = content.text.slice(0, (limit - count));

        if(opts?.suffix) {
          content.text += opts.suffix;
        }
      }

      count = total;
    }

    if(content.attrs?.label) {
      count += content.attrs.label.length;

      if (count > limit) {
        if(opts?.suffix) {
          content.attrs.label += opts.suffix;
        }
      }
    }

    if(content.content) {
      let included = 1;

      content.content.forEach(child => {
        count = helper(child, count);

        if(count < limit) {
          included++;
        }
      })

      content.content = content.content.slice(0, included);
    }

    return count;
  }

  helper(content, 0);

  return JSON.stringify(content);
}
