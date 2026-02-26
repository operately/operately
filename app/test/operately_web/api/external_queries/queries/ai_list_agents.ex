defmodule OperatelyWeb.Api.ExternalQueries.Queries.AiListAgents do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory

  def query_name, do: "ai/list_agents"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("ai")
    |> Factory.add_company_agent(:agent, title: "Test Agent", full_name: "Test Agent Name")
  end

  @impl true
  def assert(res, _ctx) do
    assert is_list(res["agents"])
  end
end
