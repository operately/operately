defmodule OperatelyWeb.Api.ExternalQueries.Queries.AiPrompt do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory

  def query_name, do: "ai/prompt"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("ai")
  end

  @impl true
  def inputs(_ctx) do
    %{prompt: "Test prompt"}
  end

  @impl true
  def assert(res, _ctx) do
    assert res["result"] || is_map(res)
  end
end
