defmodule OperatelyEmail.RichTextExcerptTest do
  use ExUnit.Case, async: true

  alias OperatelyEmail.RichTextExcerpt
  alias Operately.Support.RichText

  @table_fixtures "test/fixtures/rich_text/tables.json" |> File.read!() |> Jason.decode!()

  for fixture <- @table_fixtures do
    @fixture fixture
    test "flattens tables before shortening excerpts: #{fixture["name"]}" do
      table = Enum.at(@fixture["document"]["content"], 1)
      source = %{"type" => "doc", "content" => [table]}
      expected = @fixture["tableText"] |> String.replace("\n", " / ")
      full = RichTextExcerpt.excerpt(source, limit: 10_000)
      assert full.text == String.trim(expected)
      refute full.html =~ "<table"
      refute full.html =~ "<td"

      shortened = RichTextExcerpt.excerpt(Jason.encode!(source), limit: 12)
      if String.length(expected) > 12 do
        assert shortened.text == String.slice(expected, 0, 12) <> "..."
      end
      refute shortened.html =~ "<table"
      assert Enum.at(@fixture["document"]["content"], 1) == table
    end
  end

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
