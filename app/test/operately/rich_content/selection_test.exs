defmodule Operately.RichContent.SelectionTest do
  use ExUnit.Case, async: true
  alias Operately.RichContent.Selection
  alias Operately.Support.RichText

  @fixtures_path Path.expand("../../fixtures/rich_text/selections.json", __DIR__)
  @external_resource @fixtures_path

  for fixture <- @fixtures_path |> File.read!() |> Jason.decode!() do
    @fixture fixture
    test "matches editor selections: #{@fixture["name"]}" do
      for %{"from" => from, "to" => to, "quote" => selected_text} <- @fixture["selections"] do
        assert {:ok, %{quote: ^selected_text}} = Selection.extract(@fixture["content"], {from, to})
      end
    end
  end

  test "extracts selected text and surrounding context" do
    assert {:ok, selection} = Selection.extract(RichText.rich_text("Hello world"), {7, 12})
    assert selection == %{quote: "world", prefix: "Hello ", suffix: ""}
  end

  test "uses UTF-16 positions and rejects splitting surrogate pairs" do
    content = RichText.rich_text("a😀b")
    assert {:ok, %{quote: "😀"}} = Selection.extract(content, {2, 4})
    assert {:ok, %{quote: "b"}} = Selection.extract(content, {4, 5})
    assert {:error, :invalid_selection} = Selection.extract(content, {2, 3})
  end

  test "counts nested structure and inline atoms" do
    content = %{
      "type" => "doc",
      "content" => [
        %{
          "type" => "bulletList",
          "content" => [
            %{
              "type" => "listItem",
              "content" => [
                %{
                  "type" => "paragraph",
                  "content" => [
                    %{"type" => "text", "text" => "A"},
                    %{"type" => "mention", "attrs" => %{"id" => "person"}},
                    %{"type" => "text", "text" => "B"}
                  ]
                }
              ]
            }
          ]
        }
      ]
    }

    assert {:ok, %{quote: "B"}} = Selection.extract(content, {5, 6})
    assert {:ok, %{quote: "A\uFFFCB"}} = Selection.extract(content, {3, 6})
  end

  test "separates text blocks and rejects empty or out-of-bounds selections" do
    content = %{"type" => "doc", "content" => [paragraph("one"), paragraph("two")]}
    assert {:ok, %{quote: "one\ntwo"}} = Selection.extract(content, {1, 9})

    for range <- [{1, 1}, {-1, 2}, {1, 100}, {nil, 2}, {1, "2"}] do
      assert {:error, :invalid_selection} = Selection.extract(content, range)
    end
  end

  test "fails closed on unsupported document nodes" do
    content = %{"type" => "doc", "content" => [%{"type" => "unknown", "content" => []}]}
    assert {:error, :invalid_selection} = Selection.extract(content, {0, 1})
  end

  test "preserves empty text blocks, hard breaks, and block leaves in quotes" do
    content = %{"type" => "doc", "content" => [paragraph("one"), %{"type" => "paragraph"}, paragraph("two")]}
    assert {:ok, %{quote: "one\n\ntwo"}} = Selection.extract(content, {1, 11})
    content = %{"type" => "doc", "content" => [paragraph("one"), %{"type" => "horizontalRule"}, paragraph("two")]}
    assert {:ok, %{quote: "one\n\uFFFC\ntwo"}} = Selection.extract(content, {1, 10})
    content = %{"type" => "doc", "content" => [%{"type" => "paragraph", "content" => [%{"type" => "text", "text" => "a"}, %{"type" => "hardBreak"}, %{"type" => "text", "text" => "b"}]}]}
    assert {:ok, %{quote: "a\nb"}} = Selection.extract(content, {1, 4})
  end

  test "table cells include structural positions and separate their text" do
    cell = fn text -> %{"type" => "tableCell", "content" => [paragraph(text)]} end
    content = %{"type" => "doc", "content" => [%{"type" => "table", "content" => [%{"type" => "tableRow", "content" => [cell.("A"), cell.("B")]}]}]}
    assert {:ok, %{quote: "A\nB"}} = Selection.extract(content, {4, 10})
  end

  defp paragraph(text), do: %{"type" => "paragraph", "content" => [%{"type" => "text", "text" => text}]}
end
