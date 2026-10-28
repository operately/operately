defmodule Operately.Comments.InlineAnchorTest do
  use ExUnit.Case, async: true
  alias Operately.Comments.InlineAnchor
  alias Operately.Support.RichText

  test "builds an attached anchor from the validated selection" do
    assert {:ok, anchor} = InlineAnchor.build(RichText.rich_text("Hello world"), 2, 7, 12, "world")
    assert {anchor.source_version, anchor.source_from, anchor.source_to} == {2, 7, 12}
    assert {anchor.current_version, anchor.current_from, anchor.current_to} == {2, 7, 12}
    assert {anchor.quote, anchor.prefix, anchor.suffix} == {"world", "Hello ", ""}
    assert anchor.status == :attached
  end

  test "rejects mismatched quotes, invalid versions, and invalid selections" do
    content = RichText.rich_text("Hello")

    for {version, from, to, selected_text} <- [{1, 1, 6, "Wrong"}, {0, 1, 6, "Hello"}, {nil, 1, 6, "Hello"}, {1, 1, 100, "Hello"}] do
      assert {:error, :invalid_anchor} = InlineAnchor.build(content, version, from, to, selected_text)
    end
  end

  test "keeps current anchors and detaches outdated ones without losing the source" do
    {:ok, anchor} = InlineAnchor.build(RichText.rich_text("Hello"), 1, 1, 6, "Hello")
    assert InlineAnchor.for_version(anchor, 1) == anchor
    detached = InlineAnchor.for_version(anchor, 2)
    assert detached.status == :unattached
    assert {detached.current_from, detached.current_to} == {nil, nil}
    assert {detached.source_version, detached.source_from, detached.source_to, detached.quote} == {1, 1, 6, "Hello"}
    assert InlineAnchor.for_version(detached, 1) == detached
  end
end
