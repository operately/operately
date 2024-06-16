defmodule OperatelyWeb.Api.Queries.GetActivities do
  use TurboConnect.Query

  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Activities.Preloader

  import Ecto.Query, only: [from: 2, limit: 2, preload: 2]

  inputs do
    field :scope_id, :string
    field :scope_type, :string
    field :actions, list_of(:string)
  end

  outputs do
    field :activities, list_of(:activity)
  end

  def call(conn, inputs) do
    company_id = conn.assigns.current_account.person.company_id
    scope_id = inputs[:scope_id]
    scope_type = inputs[:scope_type]
    actions = inputs[:actions] || []
    activities = load_activities(company_id, scope_type, scope_id, actions)

    {:ok, %{activities: OperatelyWeb.Api.Serializers.Activity.serialize(activities)}}
  end

  #
  # Loading data
  #

  def load_activities(company_id, scope_type, scope_id, actions) do
    Activity
    |> limit_search_to_current_company(company_id)
    |> scope_query(scope_type, scope_id)
    |> filter_by_action(actions)
    |> order_desc()
    |> limit(100)
    |> preload([:comment_thread, :author])
    |> Repo.all()
    |> Enum.map(&Operately.Activities.cast_content/1)
    |> Preloader.preload(:project)
    |> Preloader.preload(:goal)
    |> Preloader.preload(:group)
    |> Preloader.preload(:update)
    |> Preloader.preload(:person)
    |> Preloader.preload(:project_check_in)
  end

  def limit_search_to_current_company(query, company_id) do
    from a in query, where: fragment("? ->> ? = ?", a.content, "company_id", ^company_id)
  end

  def scope_query(query, "person", scope_id) do
    from a in query, where: a.author_id == ^scope_id
  end

  def scope_query(query, scope_type, scope_id) do
    from a in query, where: fragment("? ->> ? = ?", a.content, ^"#{scope_type}_id", ^scope_id)
  end

  def order_desc(query) do
    from a in query, order_by: [desc: a.inserted_at]
  end

  def filter_by_action(query, []) do
    from a in query, where: a.action not in ^Activity.deprecated_actions()
  end

  def filter_by_action(query, actions) do
    from a in query, where: a.action in ^actions and a.action not in ^Activity.deprecated_actions()
  end

end
