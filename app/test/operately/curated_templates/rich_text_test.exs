defmodule Operately.CuratedTemplates.RichTextTest do
  use ExUnit.Case, async: true
  alias Operately.CuratedTemplates.RichText

  test "accepts shared editor highlights and checklists" do
    assert RichText.valid?(Operately.Support.RichText.curated_template_content())
  end

  test "validates highlight and checklist attribute types" do
    content = Operately.Support.RichText.curated_template_content()

    for invalid <- [false, 123, %{}, []] do
      refute RichText.valid?(put_in(content, ["content", Access.at(0), "content", Access.at(0), "marks", Access.at(0), "attrs", "highlight"], invalid))
    end

    for invalid <- [nil, "true", 1, %{}, []] do
      refute RichText.valid?(put_in(content, ["content", Access.at(1), "content", Access.at(0), "attrs", "checked"], invalid))
    end
  end

  test "still rejects uploads, mentions and unsafe links inside a checklist" do
    for node <- [
          %{"type" => "mention", "attrs" => %{"id" => "person"}},
          %{"type" => "blob", "attrs" => %{"src" => "https://example.com/file"}},
          %{"type" => "text", "text" => "Unsafe", "marks" => [%{"type" => "link", "attrs" => %{"href" => "javascript:alert(1)"}}]}
        ] do
      content = put_in(Operately.Support.RichText.curated_template_content(), ["content", Access.at(1), "content", Access.at(0), "content", Access.at(0), "content"], [node])
      refute RichText.valid?(content)
    end
  end
end
