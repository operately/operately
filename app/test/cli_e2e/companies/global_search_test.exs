defmodule Operately.CliE2E.Companies.GlobalSearchTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.Companies.GlobalSearchSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  test "keeps the global search command while returning quick search results", ctx do
    ctx
    |> Steps.search("Roadmap")
    |> Steps.assert_quick_search_response()
  end
end
