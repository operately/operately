defmodule Operately.RichContent.ResourceLinkResolver do
  @moduledoc """
  Resolves resource titles for authenticated rich-text rendering.
  Missing, inaccessible, deleted, and unsupported resources are omitted.
  """

  alias Operately.Goals.Goal
  alias Operately.Groups.Group
  alias Operately.Messages.Message
  alias Operately.People.Person
  alias Operately.Projects.{Milestone, Project}
  alias Operately.ResourceHubs.{Document, File, Folder, Link}
  alias Operately.Tasks.Task
  alias OperatelyWeb.Api.Helpers

  @supported_types Operately.RichContent.ResourceLinks.types()
  @max_unique_refs 100

  def max_unique_refs, do: @max_unique_refs

  def resolve(person, company, resources) when is_list(resources) do
    resources
    |> Enum.flat_map(&normalize_ref/1)
    |> Enum.uniq_by(&{&1.type, &1.decoded_id})
    |> Enum.take(@max_unique_refs)
    |> resolve_batches(person, company)
  end

  def resolve(_person, _company, _resources), do: []

  defp normalize_ref(%{type: type, id: id}) when type in @supported_types and is_binary(id) and id != "" do
    case decode_id(id) do
      {:ok, decoded_id} -> [%{type: type, id: id, decoded_id: decoded_id}]
      :error -> []
    end
  end

  defp normalize_ref(_), do: []

  defp resolve_batches(refs, person, company) do
    titles =
      refs
      |> Enum.group_by(& &1.type)
      |> Enum.flat_map(fn {type, refs} ->
        ids = Enum.map(refs, & &1.decoded_id)
        {schema, field, matchers} = resource_schema(type, company)

        schema.list(person, matchers ++ [opts: [ids: ids]])
        |> Enum.filter(&visible?(&1, person))
        |> Enum.flat_map(fn resource ->
          case Map.get(resource, field) do
            title when is_binary(title) and title != "" -> [{{type, resource.id}, title}]
            _ -> []
          end
        end)
      end)
      |> Map.new()

    Enum.flat_map(refs, fn ref ->
      case Map.fetch(titles, {ref.type, ref.decoded_id}) do
        {:ok, title} -> [%{type: ref.type, id: ref.id, title: title}]
        :error -> []
      end
    end)
  end

  defp decode_id(id) do
    try do
      case Helpers.decode_id(id) do
        {:ok, decoded} when is_binary(decoded) -> {:ok, decoded}
        _ -> :error
      end
    rescue
      ArgumentError -> :error
    end
  end

  defp resource_schema(:project, company), do: {Project, :name, [company_id: company.id]}
  defp resource_schema(:goal, company), do: {Goal, :name, [company_id: company.id]}
  defp resource_schema(:space, company), do: {Group, :name, [company_id: company.id]}
  defp resource_schema(:person, company), do: {Person, :full_name, [company_id: company.id]}
  defp resource_schema(:task, _company), do: {Task, :name, []}
  defp resource_schema(:milestone, _company), do: {Milestone, :title, []}
  defp resource_schema(:document, _company), do: {Document, :name, []}
  defp resource_schema(:file, _company), do: {File, :name, []}
  defp resource_schema(:link, _company), do: {Link, :name, []}
  defp resource_schema(:folder, _company), do: {Folder, :name, []}
  defp resource_schema(:discussion, _company), do: {Message, :title, []}

  defp visible?(%Message{} = message, person), do: Helpers.check_draft_access(message, person) == {:ok, :allowed}
  defp visible?(_resource, _person), do: true
end
