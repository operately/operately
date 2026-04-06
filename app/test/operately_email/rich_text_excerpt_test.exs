defmodule OperatelyEmail.RichTextExcerptTest do
  use ExUnit.Case, async: true

  alias OperatelyEmail.RichTextExcerpt
  alias Operately.Support.RichText

  test "excerpt/2 truncates plain text content" do
    content = RichText.rich_text("abcdefghijklmnopqrstuvwxyz")

    excerpt = RichTextExcerpt.excerpt(content, limit: 10)

    assert excerpt.text == "abcdefghij..."
    assert excerpt.html =~ "abcdefghij..."
  end

  test "excerpt/2 accepts json string content" do
    content = RichText.rich_text("short", :as_string)

    excerpt = RichTextExcerpt.excerpt(content, limit: 20)

    assert excerpt.text == "short"
    assert excerpt.html =~ "short"
  end

  test "excerpt/2 returns nil values for invalid content" do
    excerpt = RichTextExcerpt.excerpt("not-json")

    assert excerpt == %{html: nil, text: nil}
  end

  test "shorten_content/3 counts mention labels toward the limit" do
    content = %{
      "type" => "doc",
      "content" => [
        %{
          "type" => "paragraph",
          "content" => [
            %{
              "type" => "mention",
              "attrs" => %{
                "id" => "some-id",
                "label" => "Adriano"
              }
            }
          ]
        }
      ]
    }

    excerpt = RichTextExcerpt.excerpt(content, limit: 3)

    assert excerpt.text == "Adriano..."
    assert excerpt.html =~ "Adriano..."
  end

  test "shorten_content/3 keeps only content until the limit is reached" do
    content = %{
      "type" => "doc",
      "content" => [
        %{
          "type" => "paragraph",
          "content" => [%{"type" => "text", "text" => "abcd"}]
        },
        %{
          "type" => "paragraph",
          "content" => [%{"type" => "text", "text" => "efgh"}]
        }
      ]
    }

    excerpt = RichTextExcerpt.excerpt(content, limit: 4)

    assert excerpt.text == "abcd"
    refute excerpt.text =~ "efgh"
  end
end
