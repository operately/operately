defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetAssignmentsCount do
  use Operately.Support.ExternalApi.QueryDefinition

  import ExUnit.Assertions

  alias Operately.Support.Factory

  query :get_assignments_count do
    setup &Factory.setup/1
    assert &assert_get_assignments_count/2
  end

  def assert_get_assignments_count(response, _ctx) do
    assert is_integer(response.count)
  end
end
