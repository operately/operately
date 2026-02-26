defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetBindedPeople do
  use Operately.Support.ExternalApi.QueryDefinition

  import ExUnit.Assertions

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  query :get_binded_people do
    setup &setup_project/1
    inputs &get_binded_people_inputs/1
    assert &assert_get_binded_people/2
  end

  def setup_project(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
  end

  def get_binded_people_inputs(ctx) do
    %{
      resourse_type: "project",
      resourse_id: Paths.project_id(ctx.project)
    }
  end

  def assert_get_binded_people(response, ctx) do
    assert is_list(response.people)
    assert Enum.any?(response.people, fn person -> person.id == Paths.person_id(ctx.creator) end)
  end
end
