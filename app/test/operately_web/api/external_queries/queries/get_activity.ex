defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetActivity do
  use Operately.Support.ExternalApi.QueryDefinition

  import ExUnit.Assertions
  import Ecto.Query, only: [from: 2]

  alias Operately.Activities.Activity
  alias Operately.Repo
  alias Operately.Support.Factory

  query :get_activity do
    setup &setup_activity/1
    inputs &get_activity_inputs/1
    assert &assert_get_activity/2
  end

  def setup_activity(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  def get_activity_inputs(_ctx) do
    activity =
      from(a in Activity,
        where: a.action == "goal_created",
        order_by: [desc: a.inserted_at],
        limit: 1
      )
      |> Repo.one!()

    %{id: activity.id}
  end

  def assert_get_activity(response, _ctx) do
    assert response.activity
    assert is_binary(response.activity.id)
  end
end
