defmodule OperatelyWeb.Api.Companies.QuickSearch do
  @moduledoc """
  Searches visible company resources by their canonical title or name.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Messages.Message
  alias Operately.Search.QuickSearch
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :query, :string, null: false
  end

  outputs do
    field :spaces, list_of(:space), null: false
    field :projects, list_of(:project), null: false
    field :goals, list_of(:goal), null: false
    field :milestones, list_of(:milestone), null: false
    field :tasks, list_of(:task), null: false
    field :people, list_of(:person), null: false
    field :discussions, list_of(:quick_search_discussion), null: false
    field :folders, list_of(:quick_search_resource), null: false
    field :documents, list_of(:quick_search_resource), null: false
    field :files, list_of(:quick_search_resource), null: false
    field :links, list_of(:quick_search_resource), null: false
  end

  def call(conn, inputs) do
    results =
      conn
      |> me()
      |> QuickSearch.search(inputs.query)
      |> serialize()

    {:ok, results}
  end

  defp serialize(results) do
    %{
      spaces: Serializer.serialize(results.spaces, level: :essential),
      projects: Serializer.serialize(results.projects, level: :full),
      goals: Serializer.serialize(results.goals, level: :essential),
      milestones: Serializer.serialize(results.milestones, level: :essential),
      tasks: Serializer.serialize(results.tasks, level: :full),
      people: Serializer.serialize(results.people, level: :essential),
      discussions: Enum.map(results.discussions, &serialize_discussion/1),
      folders: Enum.map(results.folders, &serialize_resource/1),
      documents: Enum.map(results.documents, &serialize_resource/1),
      files: Enum.map(results.files, &serialize_resource/1),
      links: Enum.map(results.links, &serialize_resource/1)
    }
  end

  defp serialize_discussion(discussion) do
    %{
      id: OperatelyWeb.Paths.message_id(%Message{id: discussion.id, title: discussion.title}),
      title: discussion.title,
      context: discussion.context
    }
  end

  defp serialize_resource(resource) do
    %{
      id: Operately.ShortUuid.encode!(resource.id),
      name: resource.name,
      context: resource.context
    }
  end
end
