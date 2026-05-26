defmodule OperatelyWeb.Api.Companies.DeleteActivityTest do
  use OperatelyWeb.TurboCase

  import Operately.ActivitiesFixtures

  alias Operately.Activities.Activity

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

      activity = activity_fixture(author_id: ctx.company_creator.id, content: %{company_id: ctx.company.id})

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
  end

  defp request(conn, activity) do
    mutation(conn, [:companies, :delete_activity], %{activity_id: Paths.activity_id(activity)})
  end
end
