defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetAssignments do
  use Operately.Support.ExternalApi.QueryDefinition

  import ExUnit.Assertions

  alias Operately.Support.Factory

  query :get_assignments do
    setup &Factory.setup/1
    assert &assert_get_assignments/2
  end

  def assert_get_assignments(response, _ctx) do
    assert is_list(response.assignments)
  end
end
