defmodule Operately.RichContent.MarkdownTableCellTest do
  use ExUnit.Case, async: true

  alias Operately.RichContent.MarkdownTableCell

  test "cell syntax never creates blocks or interprets escaped breaks as real breaks" do
    assert MarkdownTableCell.parse("# Title &lt;br&gt;<br/>next", []) == [
             %{"type" => "text", "text" => "# Title <br>"},
             %{"type" => "hardBreak"},
             %{"type" => "text", "text" => "next"}
           ]

    assert MarkdownTableCell.parse("", []) == []
  end

  test "keeps code whitespace, entities, literal breaks, and surrounding marks" do
    assert MarkdownTableCell.parse("**`   a  &amp; <br>   `**", []) == [
             %{"type" => "text", "text" => "  a  &amp; <br>  ", "marks" => [%{"type" => "bold"}, %{"type" => "code"}]}
           ]
  end

  test "retains image labels and destinations without introducing attachments" do
    assert MarkdownTableCell.parse("![Diagram](https://example.com/image.png)", []) == [
             %{"type" => "text", "text" => "Diagram", "marks" => [%{"type" => "link", "attrs" => %{"href" => "https://example.com/image.png", "title" => nil}}]}
           ]
  end

  test "code-like syntax in link destinations and titles stays literal" do
    assert [node] = MarkdownTableCell.parse("[Link](https://example.com/`abc` \"A ` title `\")", [])
    assert hd(node["marks"])["attrs"] == %{"href" => "https://example.com/`abc`", "title" => "A ` title `"}
  end
end
