defmodule OperatelyWeb.Api.Companies.DeleteOwnerTest do
  use OperatelyWeb.TurboCase

  import Operately.Support.Api.CompanyAccessHelpers

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_owner(:owner)
    |> Factory.add_company_admin(:admin)
    |> Factory.add_company_member(:regular_member)
  end

  describe "company member boundaries" do
    test "rejects a foreign person without granting company membership", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      foreign_person = Factory.setup(%{}).creator
      before = company_access_snapshot(ctx.company)

      assert {404, _} = request(ctx, foreign_person)
      assert company_access_snapshot(ctx.company) == before
    end

    test "rejects a company member who is not an owner without changing access", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      before = company_access_snapshot(ctx.company)

      assert {404, _} = request(ctx, ctx.regular_member)
      assert company_access_snapshot(ctx.company) == before
    end

    test "can remove a suspended owner", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx.owner |> Ecto.Changeset.change(suspended: true, suspended_at: DateTime.utc_now() |> DateTime.truncate(:second)) |> Repo.update!()

      assert {200, _} = request(ctx, ctx.owner)
      refute Operately.Companies.Company.is_owner?(ctx.company, ctx.owner)
      assert Repo.reload(ctx.owner).suspended
    end
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = request(ctx, ctx.owner)
    end

    test "regular members can't remove admins", ctx do
      ctx = Factory.log_in_person(ctx, :regular_member)

      assert {403, res} = request(ctx, ctx.owner)
      assert res.message == "You don't have permission to perform this action"
    end

    test "admins can't remove owners", ctx do
      ctx = Factory.log_in_person(ctx, :admin)

      assert {403, res} = request(ctx, ctx.owner)
      assert res.message == "You don't have permission to perform this action"
    end

    test "company owners can remove owners", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      assert {200, _} = request(ctx, ctx.owner)
    end
  end

  def request(ctx, person_id) when is_binary(person_id) do
    mutation(ctx.conn, [:companies, :delete_owner], %{person_id: person_id})
  end

  def request(ctx, person) do
    mutation(ctx.conn, [:companies, :delete_owner], %{person_id: Paths.person_id(person)})
  end
end
