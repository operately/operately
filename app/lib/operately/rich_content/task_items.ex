defmodule Operately.RichContent.TaskItems do
  alias Operately.RichContent.LinkEnrichment

  @doc "Changes a single checkbox, rejecting stale content without replacing any other source data."
  def set_checked(source, expected, path, checked) when is_list(path) and is_boolean(checked) do
    with {:ok, updated} <- replace_checked(source, path, checked),
         {:ok, expected_updated} <- replace_checked(LinkEnrichment.restore_source(expected), path, checked) do
      if source == LinkEnrichment.restore_source(expected) or source == expected_updated do
        {:ok, updated}
      else
        {:error, :content_conflict}
      end
    end
  end

  def set_checked(_, _, _, _), do: {:error, :invalid_task_item}

  defp replace_checked(%{"type" => "taskItem"} = node, [], checked) do
    {:ok, Map.update(node, "attrs", %{"checked" => checked}, &Map.put(&1, "checked", checked))}
  end

  defp replace_checked(%{"content" => children} = node, [index | rest], checked)
       when is_list(children) and is_integer(index) and index >= 0 do
    with child when not is_nil(child) <- Enum.at(children, index),
         {:ok, updated} <- replace_checked(child, rest, checked) do
      {:ok, Map.put(node, "content", List.replace_at(children, index, updated))}
    else
      _ -> {:error, :invalid_task_item}
    end
  end

  defp replace_checked(_, _, _), do: {:error, :invalid_task_item}
end
