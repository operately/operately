defmodule OperatelyWeb.Api.ExternalQueries.Queries.AiListAgentRuns do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "ai/list_agent_runs"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("ai")
    |> Factory.add_company_agent(:agent, title: "Test Agent", full_name: "Test Agent Name")
  end

  @impl true
  def inputs(ctx) do
    %{agent_id: Paths.person_id(ctx.agent)}
  end

  @impl true
  def assert(res, _ctx) do
    assert res["runs"]
  end
end
