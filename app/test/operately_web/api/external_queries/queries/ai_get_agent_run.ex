defmodule OperatelyWeb.Api.ExternalQueries.Queries.AiGetAgentRun do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory

  def query_name, do: "ai/get_agent_run"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("ai")
  end

  @impl true
  def inputs(_ctx) do
    %{id: Ecto.UUID.generate()}
  end

  @impl true
  def assert(res, _ctx) do
    assert res["run"]
  end
end
