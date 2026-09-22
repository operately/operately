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

  def resolve(person, company, resources) when is_list(resources) do
    resources
    |> Enum.flat_map(&normalize_ref/1)
    |> Enum.uniq_by(&{&1.type, id_key(&1.id)})
    |> Enum.flat_map(&resolve_one(person, company, &1))
  end

  def resolve(_person, _company, _resources), do: []

  defp normalize_ref(%{type: type, id: id}) when is_atom(type) and is_binary(id) and id != "" do
    [%{type: type, id: id}]
  end

  defp normalize_ref(_), do: []

  defp resolve_one(person, company, %{type: type, id: requested_id}) do
    with {:ok, decoded_id} <- decode_id(requested_id),
         {:ok, title} <- load_title(person, company, type, decoded_id) do
      [%{type: type, id: requested_id, title: title}]
    else
      _ -> []
    end
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

  defp load_title(person, company, :project, id), do: fetch_title(Project, person, id, company_id: company.id, field: :name)
  defp load_title(person, company, :goal, id), do: fetch_title(Goal, person, id, company_id: company.id, field: :name)
  defp load_title(person, company, :space, id), do: fetch_title(Group, person, id, company_id: company.id, field: :name)
  defp load_title(person, company, :person, id), do: fetch_title(Person, person, id, company_id: company.id, field: :full_name)
  defp load_title(person, _company, :task, id), do: fetch_title(Task, person, id, field: :name)
  defp load_title(person, _company, :milestone, id), do: fetch_title(Milestone, person, id, field: :title)
  defp load_title(person, _company, :document, id), do: fetch_title(Document, person, id, field: :name)
  defp load_title(person, _company, :file, id), do: fetch_title(File, person, id, field: :name)
  defp load_title(person, _company, :link, id), do: fetch_title(Link, person, id, field: :name)
  defp load_title(person, _company, :folder, id), do: fetch_title(Folder, person, id, field: :name)
  defp load_title(person, _company, :discussion, id), do: fetch_discussion_title(person, id)
  defp load_title(_person, _company, _type, _id), do: :error

  defp fetch_title(schema, person, id, opts) do
    {field, matchers} = Keyword.pop(opts, :field)
    args = Keyword.merge(matchers, id: id)

    case schema.get(person, args) do
      {:ok, resource} -> title_from(resource, field)
      _ -> :error
    end
  end

  defp fetch_discussion_title(person, id) do
    with {:ok, message} <- Message.get(person, id: id),
         true <- discussion_visible?(message, person),
         {:ok, title} <- title_from(message, :title) do
      {:ok, title}
    else
      _ -> :error
    end
  end

  defp discussion_visible?(%{state: state, author_id: author_id}, %{id: person_id})
       when state in [:draft, :scheduled] and author_id != person_id,
       do: false

  defp discussion_visible?(_message, _person), do: true

  defp title_from(resource, field) do
    case Map.get(resource, field) do
      title when is_binary(title) and title != "" -> {:ok, title}
      _ -> :error
    end
  end

  defp id_key(id) do
    id
    |> String.split("-")
    |> List.last()
  end
end
