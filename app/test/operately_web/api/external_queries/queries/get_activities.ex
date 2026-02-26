defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetActivities do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  @impl true
  def inputs(ctx) do
    %{
      scope_type: :company,
      scope_id: Paths.company_id(ctx.company),
      actions: []
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert is_list(response.activities)
  end
end
