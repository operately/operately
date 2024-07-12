defmodule Operately.Data.Change023AddTagToReviewersAndChampionsBindings do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Goals.Goal
  alias Operately.Projects.Project

  def run do
    Repo.transaction(fn ->
      from(g in Goal, preload: [:reviewer, :champion])
      |> Repo.all()
      |> update_tags()

      from(p in Project, preload: [:reviewer, :champion])
      |> Repo.all()
      |> update_tags()
    end)
  end

  defp update_tags(resources) do
    Enum.each(resources, fn resource ->
      context = get_context(resource)

      update_tag(context, resource.reviewer, :reviewer)
      update_tag(context, resource.champion, :champion)
    end)
  end

  defp update_tag(context, person, tag) do
    binding = get_binding(context, person, tag)

    case binding.tag do
      nil -> Access.update_binding(binding, %{tag: tag})
      _ -> :ok
    end
  end

  defp get_binding(context, person, tag) do
    group = Access.get_group!(person_id: person.id)

    case Access.get_binding(context_id: context.id, group_id: group.id) do
      nil ->
        {:ok, binding} = Access.create_binding(%{
          context_id: context.id,
          group_id: group.id,
          access_level: Binding.full_access(),
          tag: tag,
        })
        binding
      binding ->
        binding
    end
  end

  defp get_context(%Goal{} = resource), do: Access.get_context!(goal_id: resource.id)
  defp get_context(%Project{} = resource), do: Access.get_context!(project_id: resource.id)
end
