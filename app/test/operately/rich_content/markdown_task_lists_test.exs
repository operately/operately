defmodule Operately.RichContent.MarkdownTaskListsTest do
  use ExUnit.Case, async: true
  alias Operately.RichContent.MarkdownTaskLists

  test "preserves mixed and nested list kinds" do
    inline = fn text -> [%{"type" => "text", "text" => text}] end
    [tasks, ordinary, final] = MarkdownTaskLists.parse("- [x] Done\n  - [ ] Nested\n- Ordinary\n- [ ] Pending", inline)
    assert tasks["type"] == "taskList"
    assert ordinary["type"] == "bulletList"
    assert final["type"] == "taskList"
    [item] = tasks["content"]
    assert item["attrs"]["checked"]
    assert Enum.at(item["content"], 1)["type"] == "taskList"
  end
end
