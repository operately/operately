defmodule Operately.Data.Change030CreateSubscriptionsListForProjectRetrospectivesTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Notifications.{Subscription, SubscriptionList}

  setup ctx do
    ctx =
      Factory.setup(ctx)
      |> Factory.add_space(:space)

    Enum.reduce(1..3, ctx, fn num, ctx ->
      project_name = resource_name("project", num)
      retrospective_name = resource_name("retrospective", num)

      ctx =
        Factory.add_project(ctx, project_name, :space)
        |> Factory.add_project_retrospective(retrospective_name, project_name, :creator)

      Enum.reduce(1..3, ctx, fn member_num, ctx ->
        member_name = resource_name("member", "#{num}_#{member_num}")
        Factory.add_project_contributor(ctx, member_name, project_name, :as_person)
      end)
    end)
  end

  test "creates subscriptions list for existing project retrospective", ctx do
    retrospectives = [ctx.retrospective_1, ctx.retrospective_2, ctx.retrospective_3]

    Enum.each(retrospectives, fn r ->
      refute r.subscription_list_id
      assert {:error, :not_found} = SubscriptionList.get(:system, parent_id: r.id)
    end)

    Operately.Data.Change030CreateSubscriptionsListForProjectRetrospectives.run()

    Enum.each(retrospectives, fn r ->
      r = Repo.reload(r)

      list_contributors(r)
      |> Enum.each(fn person ->
        assert {:ok, _} = Subscription.get(:system, subscription_list_id: r.subscription_list_id, person_id: person.id)
      end)
    end)
  end

  #
  # Helpers
  #

  defp resource_name(name, num) do
    String.to_atom("#{name}_#{num}")
  end

  defp list_contributors(retrospective) do
    from(c in Operately.Projects.Contributor,
      join: p in assoc(c, :person),
      where: c.project_id == ^retrospective.project_id,
      select: p
    )
    |> Repo.all()
  end
end
