defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetFlatWorkMap do
  use Operately.Support.ExternalApi.QueryDefinition

  import ExUnit.Assertions

  alias Operately.Support.Factory

  query :get_flat_work_map do
    setup &Factory.setup/1
    assert &assert_get_flat_work_map/2
  end

  def assert_get_flat_work_map(response, _ctx) do
    assert response.work_map == []
  end
end
