defmodule OperatelyEmail.DigestSubject do
  use Gettext, backend: OperatelyWeb.Gettext

  def build(items, parent_groups) do
    items
    |> summarize(parent_groups)
    |> String.replace(~r/[\r\n]+/, " ")
  end

  defp summarize([], _groups), do: gettext("You have 0 new updates")

  defp summarize([%{summary: {:document_comment, _id, title}, actor_name: author}], _groups) do
    gettext("%{author} commented on “%{document_title}”", author: author, document_title: title)
  end

  defp summarize([item], _groups) do
    gettext("%{place}: %{author} %{headline}", place: item.parent_name, author: item.actor_name, headline: item.headline)
  end

  defp summarize([%{summary: {:document_comment, document_id, title}} | rest] = items, groups) do
    count = length(items)

    if Enum.all?(rest, &match?(%{summary: {:document_comment, ^document_id, _}}, &1)) do
      ngettext("%{count} new comment on “%{document_title}”", "%{count} new comments on “%{document_title}”", count, document_title: title)
    else
      summarize_places(groups, count)
    end
  end

  defp summarize([%{summary: :task_created} | rest] = items, [place] = groups) do
    count = length(items)

    if Enum.all?(rest, &match?(%{summary: :task_created}, &1)) do
      ngettext("%{count} task created in %{place}", "%{count} tasks created in %{place}", count, place: place.parent_name)
    else
      summarize_places(groups, count)
    end
  end

  defp summarize(items, groups), do: summarize_places(groups, length(items))

  defp summarize_places([place], count) do
    ngettext("%{count} update in %{place}", "%{count} updates in %{place}", count, place: place.parent_name)
  end

  defp summarize_places(groups, count) do
    [first, second | rest] = Enum.sort_by(groups, &{-&1.update_count, &1.parent_name})
    updates_across_places(count, first.parent_name, second.parent_name, length(rest))
  end

  defp updates_across_places(count, first, second, 0) do
    ngettext("%{count} update across %{first_place} and %{second_place}", "%{count} updates across %{first_place} and %{second_place}", count, first_place: first, second_place: second)
  end

  defp updates_across_places(count, first, second, 1) do
    ngettext("%{count} update across %{first_place}, %{second_place}, and 1 other", "%{count} updates across %{first_place}, %{second_place}, and 1 other", count,
      first_place: first,
      second_place: second
    )
  end

  defp updates_across_places(count, first, second, remaining) do
    ngettext("%{count} update across %{first_place}, %{second_place}, and %{remaining_places} others", "%{count} updates across %{first_place}, %{second_place}, and %{remaining_places} others", count,
      first_place: first,
      second_place: second,
      remaining_places: remaining
    )
  end
end
