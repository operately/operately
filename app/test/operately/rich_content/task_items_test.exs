defmodule Operately.RichContent.TaskItemsTest do
  use ExUnit.Case, async: true
  alias Operately.RichContent.TaskItems

  defp document do
    %{
      "type" => "doc",
      "content" => [
        %{
          "type" => "taskList",
          "content" => [
            %{
              "type" => "taskItem",
              "attrs" => %{"checked" => false},
              "content" => [
                %{"type" => "paragraph", "content" => [%{"type" => "text", "text" => "Ship it"}]}
              ]
            }
          ]
        }
      ]
    }
  end

  test "changes only checked state and treats a repeated request as a no-op" do
    source = document()
    assert {:ok, updated} = TaskItems.set_checked(source, source, [0, 0], true)
    assert get_in(updated, ["content", Access.at(0), "content", Access.at(0), "attrs", "checked"])
    assert {:ok, ^updated} = TaskItems.set_checked(updated, source, [0, 0], true)
    assert {:ok, ^source} = TaskItems.set_checked(updated, updated, [0, 0], false)
  end

  test "restores enriched link labels before comparing and retains the stored source" do
    href = "https://example.com/project"
    link = %{"type" => "text", "text" => href, "marks" => [%{"type" => "link", "attrs" => %{"href" => href}}]}
    path = ["content", Access.at(0), "content", Access.at(0), "content", Access.at(0), "content", Access.at(0)]
    source = put_in(document(), path, link)
    enriched_link = %{link | "text" => "Project", "marks" => [%{"type" => "link", "attrs" => %{"href" => href, "operatelyResourceLink" => %{"originalText" => href, "resolvedText" => "Project"}}}]}
    enriched = put_in(source, path, enriched_link)
    assert {:ok, updated} = TaskItems.set_checked(source, enriched, [0, 0], true)
    assert get_in(updated, path) == link
  end

  test "rejects stale content even when the desired state matches" do
    source = document()
    changed = put_in(source, ["content", Access.at(0), "content", Access.at(0), "content", Access.at(0), "content", Access.at(0), "text"], "New text")
    assert {:error, :content_conflict} = TaskItems.set_checked(changed, source, [0, 0], false)
  end

  test "rejects non-task nodes and invalid paths" do
    for path <- [[], [0], [-1], [0, 99], [0, 0, 0]] do
      assert {:error, :invalid_task_item} = TaskItems.set_checked(document(), document(), path, true)
    end
  end
end
