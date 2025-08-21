defmodule OperatelyWeb.Api.Queries.GetActivities do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Activities.Preloader
  alias Operately.Companies.ShortId

  import Operately.Access.Filters, only: [filter_by_view_access: 2]
  import Ecto.Query, only: [from: 2, limit: 2, preload: 2]

  inputs do
    field :scope_id, :string, null: false
    field :scope_type, :activity_scope_type, null: false
    field :actions, list_of(:string), null: false
  end

  outputs do
    field :activities, list_of(:activity), null: false
  end

  def call(conn, inputs) do
    actions = inputs[:actions] || []
    {:ok, scope_id} = decode_scope_id(inputs)

    activities = load_activities(me(conn), inputs.scope_type, scope_id, actions)

    {:ok, %{activities: OperatelyWeb.Api.Serializers.Activity.serialize(activities)}}
  end

  def decode_scope_id(inputs) do
    case inputs[:scope_type] do
      :company ->
        scope_id = id_without_comments(inputs[:scope_id])
        {:ok, id} = ShortId.decode(scope_id)
        company = Operately.Repo.get_by(Operately.Companies.Company, short_id: id)
        {:ok, company.id}

      _ ->
        {:ok, scope_id} = decode_id(inputs.scope_id)
        {:ok, scope_id}
    end
  end

  #
  # Loading data
  #

  def load_activities(person, scope_type, scope_id, actions) do
    Activity
    |> limit_search_to_current_company(person.company_id)
    |> scope_query(scope_type, scope_id)
    |> filter_by_action(actions)
    |> filter_by_view_access(person.id)
    |> order_desc()
    |> limit(100)
    |> preload([:comment_thread, :author])
    |> Repo.all()
    |> Enum.map(&Operately.Activities.cast_content/1)
    |> Preloader.preload()
  end

  def limit_search_to_current_company(query, company_id) do
    from a in query, where: fragment("? ->> ? = ?", a.content, "company_id", ^company_id)
  end

  def scope_query(query, :person, scope_id) do
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
