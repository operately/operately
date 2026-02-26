defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetActivities do
  use Operately.Support.ExternalApi.QueryDefinition

  import ExUnit.Assertions

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  query :get_activities do
    setup &setup_activity/1
    inputs &get_activities_inputs/1
    assert &assert_get_activities/2
  end

  def setup_activity(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  def get_activities_inputs(ctx) do
    %{
      scope_type: :company,
      scope_id: Paths.company_id(ctx.company),
      actions: []
    }
  end

  def assert_get_activities(response, _ctx) do
    assert is_list(response.activities)
  end
end
