defmodule OperatelyWeb.Api.ExternalQueries.Queries.Companies.GetActivity do
  use Operately.Support.ExternalApi.QuerySpec

  import Ecto.Query, only: [from: 2]

  alias Operately.Activities.Activity
  alias Operately.Repo
  alias Operately.Support.Factory

  def query_name, do: "companies/get_activity"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  @impl true
  def inputs(_ctx) do
    activity =
      from(a in Activity,
        where: a.action == "goal_created",
        order_by: [desc: a.inserted_at],
        limit: 1
      )
      |> Repo.one!()

    %{id: OperatelyWeb.Paths.activity_id(activity)}
  end

  @impl true
  def assert(response, _ctx) do
    assert response.activity
    assert is_binary(response.activity.id)
  end
end
