import * as RichText from "./richText";


describe("RichText.countCharacters", () => {
  it("single word", () => {
    const input = `{"content":[{"content":[{"text":"Content","type":"text"}],"type":"paragraph"}],"type":"doc"}`;
    
    expect(RichText.countCharacters(input)).toEqual(7);
  });
  
  it("single word in several lines", () => {
    const input = `{"content":[{"content":[{"text":"Ano","type":"text"}],"type":"paragraph"},{"type":"paragraph"},{"content":[{"text":"th","type":"text"}],"type":"paragraph"},{"type":"paragraph"},{"content":[{"text":"er","type":"text"}],"type":"paragraph"}],"type":"doc"}`;
    
    expect(RichText.countCharacters(input)).toEqual(7);
  });
  
  it("short text", () => {
    const input = `{"content":[{"content":[{"text":"Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old.","type":"text"}],"type":"paragraph"}],"type":"doc"}`;
    
    expect(RichText.countCharacters(input)).toEqual(163);
  });
  
  it("short text in several lines", () => {
    const input = `{"content":[{"content":[{"text":"Contrary to popular belief, ","type":"text"}],"type":"paragraph"},{"type":"paragraph"},{"content":[{"text":"Lorem Ipsum is not simply random text. ","type":"text"}],"type":"paragraph"},{"type":"paragraph"},{"content":[{"text":"It has roots in a piece of classical Latin literature from 45 BC, ","type":"text"}],"type":"paragraph"},{"type":"paragraph"},{"content":[{"text":"making it over 2000 years old.","type":"text"}],"type":"paragraph"}],"type":"doc"}`;
    
    expect(RichText.countCharacters(input)).toEqual(163);
  });

  it("counts person name", () => {
    const input = `{"content":[{"content":[{"text":"Some very long text ","type":"text"},{"attrs":{"id":"fred-williams-H8bQVAffZB6ddLrgofhWL","label":"Fred Williams"},"type":"mention"},{"text":" more text.","type":"text"}],"type":"paragraph"},{"content":[{"text":"Contrary to popular belief, Lorem Ipsum is not simply random text.","type":"text"}],"type":"paragraph"}],"type":"doc"}`;

    expect(RichText.countCharacters(input)).toEqual(110);
  });
});

describe("RichText.trucateText", () => {
  it("few words in a single line", () => {
    const input = `{"content":[{"content":[{"text":"Contrary to popular belief, Lorem Ipsum is not simply random text.","type":"text"}],"type":"paragraph"}],"type":"doc"}`;
    const expected = `{"content":[{"content":[{"text":"Contrary to pop","type":"text"}],"type":"paragraph"}],"type":"doc"}`;

    expect(RichText.truncate(input, 15)).toEqual(expected);
  });
  
  it("few words in several single lines", () => {
    const input = `{"content":[{"content":[{"text":"Contrary","type":"text"}],"type":"paragraph"},{"type":"paragraph"},{"content":[{"text":"to","type":"text"}],"type":"paragraph"},{"type":"paragraph"},{"content":[{"text":"popular","type":"text"}],"type":"paragraph"},{"type":"paragraph"},{"content":[{"text":"belief, Lorem Ipsum is not simply random text.","type":"text"}],"type":"paragraph"}],"type":"doc"}`;
    const expected = `{"content":[{"content":[{"text":"Contrary","type":"text"}],"type":"paragraph"},{"type":"paragraph"},{"content":[{"text":"to","type":"text"}],"type":"paragraph"},{"type":"paragraph"},{"content":[{"text":"popular","type":"text"}],"type":"paragraph"},{"type":"paragraph"},{"content":[{"text":"bel...","type":"text"}],"type":"paragraph"}],"type":"doc"}`;

    expect(RichText.truncate(input, 20, { suffix: "..." })).toEqual(expected);
  });
  
  it("long text in a single line", () => {
    const input = `{"content":[{"content":[{"text":"Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source.","type":"text"}],"type":"paragraph"}],"type":"doc"}`;
    const expected = `{"content":[{"content":[{"text":"Contrary to popular belief, Lorem Ipsum is not sim","type":"text"}],"type":"paragraph"}],"type":"doc"}`;

    expect(RichText.truncate(input, 50)).toEqual(expected);
  });
 
  it("long text in several single lines", () => {
    const input = `{"content":[{"content":[{"text":"Contrary to popular belief, ","type":"text"}],"type":"paragraph"},{"type":"paragraph"},{"content":[{"text":"Lorem Ipsum is not simply random text. ","type":"text"}],"type":"paragraph"},{"type":"paragraph"},{"content":[{"text":"It has roots in a piece of classical Latin literature from 45 BC, ","type":"text"}],"type":"paragraph"},{"type":"paragraph"},{"content":[{"text":"making it over 2000 years old. Richard McClintock, ","type":"text"}],"type":"paragraph"},{"type":"paragraph"},{"content":[{"text":"a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, ","type":"text"}],"type":"paragraph"},{"type":"paragraph"},{"content":[{"text":"and going through the cites of the word in classical literature, ","type":"text"}],"type":"paragraph"},{"type":"paragraph"},{"type":"paragraph"},{"content":[{"text":"discovered the undoubtable source.","type":"text"}],"type":"paragraph"}],"type":"doc"}`;
    const expected = `{"content":[{"content":[{"text":"Contrary to popular belief, ","type":"text"}],"type":"paragraph"},{"type":"paragraph"},{"content":[{"text":"Lorem Ipsum is not simply random text. ","type":"text"}],"type":"paragraph"},{"type":"paragraph"},{"content":[{"text":"It has r...","type":"text"}],"type":"paragraph"}],"type":"doc"}`;

    expect(RichText.truncate(input, 75, { suffix: "..." })).toEqual(expected);
  });

  it("text that mentions person", () => {
    const input = `{"content":[{"content":[{"text":"Some very long text ","type":"text"},{"attrs":{"id":"fred-williams-H8bQVAffZB6ddLrgofhWL","label":"Fred Williams"},"type":"mention"},{"text":"more text.","type":"text"}],"type":"paragraph"},{"content":[{"text":"Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old.","type":"text"}],"type":"paragraph"}],"type":"doc"}`;
    const expected = `{"content":[{"content":[{"text":"Some very long text ","type":"text"},{"attrs":{"id":"fred-williams-H8bQVAffZB6ddLrgofhWL","label":"Fred Williams"},"type":"mention"},{"text":"more te...","type":"text"}],"type":"paragraph"}],"type":"doc"}`;

    expect(RichText.truncate(input, 40, { suffix: "..." })).toEqual(expected);
  });

  it("person name isn't truncated", () => {
    const input = `{"content":[{"content":[{"text":"Some very long text ","type":"text"},{"attrs":{"id":"fred-williams-H8bQVAffZB6ddLrgofhWL","label":"Fred Williams"},"type":"mention"},{"text":" more text.","type":"text"}],"type":"paragraph"},{"content":[{"text":"Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old.","type":"text"}],"type":"paragraph"}],"type":"doc"}`;
    const expected = `{"content":[{"content":[{"text":"Some very long text ","type":"text"},{"attrs":{"id":"fred-williams-H8bQVAffZB6ddLrgofhWL","label":"Fred Williams..."},"type":"mention"}],"type":"paragraph"}],"type":"doc"}`;

    expect(RichText.truncate(input, 28, { suffix: "..." })).toEqual(expected);
  });
});
