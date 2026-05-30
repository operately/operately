defmodule OperatelyWeb.Api.Companies.DeleteActivityTest do
  use OperatelyWeb.TurboCase

  import Operately.ActivitiesFixtures
  import Ecto.Query, only: [from: 2]

  alias Operately.Access.{Binding, Context}
  alias Operately.Activities.Activity
  alias Operately.Operations.ProjectCreation

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:companies, :delete_activity], %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx =
        ctx
        |> register_and_log_in_account()
        |> Factory.add_company_admin(:admin)
        |> Factory.add_company_owner(:owner)
        |> Factory.add_company_member(:member)

      company_context = Repo.get_by!(Context, company_id: ctx.company.id)

      activity =
        activity_fixture(
          author_id: ctx.company_creator.id,
          access_context_id: company_context.id,
          content: %{company_id: ctx.company.id}
        )

      Map.put(ctx, :activity, activity)
    end

    test "company members cannot delete feed activities", ctx do
      ctx = log_in_account(ctx, ctx.member)

      assert {403, res} = request(ctx.conn, ctx.activity)
      assert res.message == "You don't have permission to perform this action"
      assert Repo.get(Activity, ctx.activity.id)
    end

    test "company admins can delete feed activities", ctx do
      ctx = log_in_account(ctx, ctx.admin)

      assert {200, res} = request(ctx.conn, ctx.activity)
      assert res.success
      refute Repo.get(Activity, ctx.activity.id)
    end

    test "company owners can delete feed activities", ctx do
      ctx = log_in_account(ctx, ctx.owner)

      assert {200, res} = request(ctx.conn, ctx.activity)
      assert res.success
      refute Repo.get(Activity, ctx.activity.id)
    end

    test "company admins cannot delete activities they cannot see in the feed", ctx do
      ctx =
        ctx
        |> Map.put(:creator, ctx.company_creator)
        |> Factory.add_space(:private_space)

      activity = create_private_project_activity(ctx)

      ctx = log_in_account(ctx, ctx.admin)

      assert {404, _res} = request(ctx.conn, activity)
      assert Repo.get(Activity, activity.id)
    end
  end

  defp request(conn, activity) do
    mutation(conn, [:companies, :delete_activity], %{activity_id: Paths.activity_id(activity)})
  end

  defp create_private_project_activity(ctx) do
    {:ok, project} =
      ProjectCreation.run(%ProjectCreation{
        company_id: ctx.company.id,
        name: "Private project",
        creator_id: ctx.company_creator.id,
        creator_role: "Contributor",
        visibility: "people_with_access",
        group_id: ctx.private_space.id,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access()
      })

    from(a in Activity,
      where: a.action == "project_created",
      where: fragment("? ->> ? = ?", a.content, "project_id", ^project.id)
    )
    |> Repo.one!()
  end
end
