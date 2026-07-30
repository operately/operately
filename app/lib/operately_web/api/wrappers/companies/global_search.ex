defmodule OperatelyWeb.Api.Wrappers.Companies.GlobalSearch do
  @moduledoc """
  Preserves the global-search route while delegating to quick search.
  """

  use TurboConnect.Query
  alias OperatelyWeb.Api.Companies.QuickSearch

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

  def call(conn, inputs), do: QuickSearch.call(conn, inputs)
end
