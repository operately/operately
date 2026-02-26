Code.require_file("spec_definition.ex", __DIR__)

defmodule OperatelyWeb.Api.ExternalQueries.Specs do
  use OperatelyWeb.Api.ExternalQueries.SpecDefinition

  import ExUnit.Assertions
  import Ecto.Query, only: [from: 2]

  alias Operately.Activities.Activity
  alias Operately.Repo
  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  query :get_account do
    setup &Factory.setup/1
    assert &assert_get_account/2
  end

  query :get_activities do
    setup &setup_activity/1
    inputs &get_activities_inputs/1
    assert &assert_get_activities/2
  end

  query :get_activity do
    setup &setup_activity/1
    inputs &get_activity_inputs/1
    assert &assert_get_activity/2
  end

  query :get_assignments_count do
    setup &Factory.setup/1
    assert &assert_get_assignments_count/2
  end

  def setup_activity(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  def get_activities_inputs(ctx) do
    %{
      scope_type: :company,
      scope_id: Paths.company_id(ctx.company),
      actions: []
    }
  end

  def get_activity_inputs(_ctx) do
    activity =
      from(a in Activity,
        where: a.action == "goal_created",
        order_by: [desc: a.inserted_at],
        limit: 1
      )
      |> Repo.one!()

    %{id: activity.id}
  end

  def assert_get_account(response, ctx) do
    account = Operately.People.get_account!(ctx.creator.account_id)

    assert response == %{
      account: %{
        full_name: account.full_name,
        site_admin: account.site_admin
      }
    }
  end

  def assert_get_activities(response, _ctx) do
    assert is_list(response.activities)
  end

  def assert_get_activity(response, _ctx) do
    assert response.activity
    assert is_binary(response.activity.id)
  end

  def assert_get_assignments_count(response, _ctx) do
    assert is_integer(response.count)
  end
end
