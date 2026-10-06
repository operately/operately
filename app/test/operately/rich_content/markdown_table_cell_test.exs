defmodule Operately.RichContent.MarkdownTableCellTest do
  use ExUnit.Case, async: true

  alias Operately.RichContent.MarkdownTableCell

  test "escaped break tags stay literal while unescaped tags create breaks" do
    for tag <- ["<br>", "<br/>", "<BR />"] do
      assert MarkdownTableCell.parse("\\" <> tag, []) == [%{"type" => "text", "text" => tag}]
      assert MarkdownTableCell.parse("\\\\" <> tag, []) == [%{"type" => "text", "text" => "\\"}, %{"type" => "hardBreak"}]
      assert MarkdownTableCell.parse("\\\\\\" <> tag, []) == [%{"type" => "text", "text" => "\\" <> tag}]
    end
  end

  test "escaped breaks retain formatting, links, and literal code" do
    assert MarkdownTableCell.parse("**\\<br>**", []) == [%{"type" => "text", "text" => "<br>", "marks" => [%{"type" => "bold"}]}]
    assert [link] = MarkdownTableCell.parse("[\\<br>](https://example.com)", [])
    assert link["text"] == "<br>"
    assert hd(link["marks"])["type"] == "link"
    assert MarkdownTableCell.parse("`\\<br>`", []) == [%{"type" => "text", "text" => "\\<br>", "marks" => [%{"type" => "code"}]}]
  end

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

  test "only unnamed image labels use the creation locale" do
    url = "https://example.com/image.png"

    Gettext.with_locale(OperatelyWeb.Gettext, "pt_BR", fn ->
      assert [unnamed] = MarkdownTableCell.parse("![](#{url})", [])
      assert unnamed["text"] == "Imagem"
      assert hd(unnamed["marks"])["attrs"]["href"] == url

      assert [named] = MarkdownTableCell.parse("![Literal name](#{url})", [])
      assert named["text"] == "Literal name"
    end)
  end

  test "code-like syntax in link destinations and titles stays literal" do
    assert [node] = MarkdownTableCell.parse("[Link](https://example.com/`abc` \"A ` title `\")", [])
    assert hd(node["marks"])["attrs"] == %{"href" => "https://example.com/`abc`", "title" => "A ` title `"}
  end
end
