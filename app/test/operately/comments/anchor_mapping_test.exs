defmodule Operately.Comments.AnchorMappingTest do
  use ExUnit.Case, async: true
  alias Operately.Comments.{AnchorMapping, InlineAnchor}
  alias Operately.Support.RichText

  test "moves ranges, includes interior insertions, and excludes boundary insertions" do
    old = doc("Hello world")
    anchor = anchor(old, 1, 6, "Hello")
    assert %{status: :attached, current_from: 5, current_to: 10} = remap(anchor, old, doc("Say Hello world"))
    assert %{status: :attached, current_from: 1, current_to: 8} = remap(anchor, old, doc("HelXXlo world"))
    assert %{status: :attached, current_from: 3, current_to: 8} = remap(anchor, old, doc("XXHelloYY world"))
  end

  test "shrinks partial deletions and detaches complete deletions" do
    old = doc("abc def ghi")
    anchor = anchor(old, 5, 8, "def")
    assert %{status: :attached, current_from: 5, current_to: 7} = remap(anchor, old, doc("abc df ghi"))
    assert %{status: :unattached, current_from: nil, current_to: nil} = remap(anchor, old, doc("abc  ghi"))
    assert %{status: :unattached} = remap(anchor, old, doc("abc XYZ ghi"))
  end

  test "shared letters in an otherwise replaced passage are not sufficient evidence" do
    old = doc("Hello world")
    assert %{status: :unattached} = remap(anchor(old, 1, 6, "Hello"), old, doc("Changed"))
  end

  test "surviving edges allow simultaneous edits inside and outside the passage" do
    old = doc("Hello world")
    assert %{status: :attached, current_from: 3, current_to: 10} = remap(anchor(old, 1, 6, "Hello"), old, doc("XXHelYYloZZ world"))
  end

  test "does not pick an occurrence when identical passages are deleted" do
    old = doc("same same")
    assert %{status: :unattached} = remap(anchor(old, 1, 5, "same"), old, doc("same"))
    assert %{status: :unattached} = remap(anchor(old, 6, 10, "same"), old, doc("same"))
  end

  test "distinguishes repeated text through unchanged surrounding context" do
    old = doc("one same two same three")
    assert %{status: :attached, current_from: 9, current_to: 13} = remap(anchor(old, 5, 9, "same"), old, doc("new one same two same three"))
  end

  test "keeps UTF-16 positions and original source fields" do
    old = doc("Hi 😀 friend")
    original = anchor(old, 4, 6, "😀")
    moved = remap(original, old, doc("👋 Hi 😀 friend"))
    assert moved.current_from == 7
    assert moved.current_to == 9
    assert moved.current_version == 2

    assert Map.take(moved, [:source_version, :source_from, :source_to, :quote, :prefix, :suffix]) ==
             Map.take(original, [:source_version, :source_from, :source_to, :quote, :prefix, :suffix])
  end

  test "formatting and checkbox attributes do not move ranges" do
    old = doc("Hello")
    formatted = put_in(old, ["content", Access.at(0), "content", Access.at(0), "marks"], [%{"type" => "bold"}])
    assert %{status: :attached, current_from: 1, current_to: 6} = remap(anchor(old, 1, 6, "Hello"), old, formatted)
  end

  test "atom identity matters even when its displayed quote is unchanged" do
    old = %{"type" => "doc", "content" => [%{"type" => "paragraph", "content" => [%{"type" => "mention", "attrs" => %{"id" => "one"}}]}]}
    new = put_in(old, ["content", Access.at(0), "content", Access.at(0), "attrs", "id"], "two")
    assert %{status: :unattached} = remap(anchor(old, 1, 2, "\uFFFC"), old, new)
  end

  test "unsupported content detaches rather than preventing a save" do
    old = doc("Hello")
    assert %{status: :unattached} = remap(anchor(old, 1, 6, "Hello"), old, %{"type" => "unknown"})
  end

  for fixture <- Jason.decode!(File.read!("test/fixtures/rich_text/selections.json")) do
    @fixture fixture
    test "maps structural positions in #{fixture["name"]}" do
      old = @fixture["content"]
      new = Map.update!(old, "content", &[hd(doc("👋")["content"]) | &1])

      for selection <- @fixture["selections"] do
        original = anchor(old, selection["from"], selection["to"], selection["quote"])
        mapped = remap(original, old, new)
        assert mapped.status == :attached
        assert mapped.current_from == selection["from"] + 4
        assert mapped.current_to == selection["to"] + 4
      end
    end
  end

  test "checkbox state changes keep the same range" do
    old = %{"type" => "doc", "content" => [%{"type" => "taskList", "content" => [%{"type" => "taskItem", "attrs" => %{"checked" => false}, "content" => doc("Task")["content"]}]}]}
    new = put_in(old, ["content", Access.at(0), "content", Access.at(0), "attrs", "checked"], true)
    assert %{status: :attached, current_from: 3, current_to: 7} = remap(anchor(old, 3, 7, "Task"), old, new)
  end

  defp doc(text), do: RichText.rich_text(text)

  defp anchor(content, from, to, selected_text) do
    {:ok, anchor} = InlineAnchor.build(content, 1, from, to, selected_text)
    anchor
  end

  defp remap(anchor, old, new), do: AnchorMapping.remap(anchor, AnchorMapping.prepare(old, new), 2)
end
