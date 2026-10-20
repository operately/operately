defmodule OperatelyWeb.Api.Mutations.AddCompanyOwnersTest do
  use OperatelyWeb.TurboCase

  import Operately.Support.Api.CompanyAccessHelpers

  describe "company member boundaries" do
    test "rejects a mixed-company batch without partial writes", ctx do
      ctx = ctx |> Factory.setup() |> Factory.add_company_member(:member) |> Factory.log_in_person(:creator)
      foreign_person = Factory.setup(%{}).creator
      assert {:error, :not_found} = Operately.Companies.Company.get(foreign_person, id: ctx.company.id)
      before = company_access_snapshot(ctx.company)

      assert {400, _} = mutation(ctx.conn, :add_company_owners, %{people_ids: [ctx.member.id, foreign_person.id]})
      assert company_access_snapshot(ctx.company) == before
    end
  end

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_owner(:owner)
    |> Factory.add_company_admin(:admin)
    |> Factory.add_company_member(:regular_member)
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = request(ctx, "")
    end

    test "regular members can't add owners", ctx do
      ctx = Factory.log_in_person(ctx, :regular_member)

      assert {403, res} = request(ctx, ctx.owner)
      assert res.message == "You don't have permission to perform this action"
    end

    test "admins can't add owners", ctx do
      ctx = Factory.log_in_person(ctx, :admin)

      assert {403, res} = request(ctx, ctx.owner)
      assert res.message == "You don't have permission to perform this action"
    end

    test "company owners can add owners", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      assert {200, _} = request(ctx, ctx.regular_member)
    end
  end

  def request(ctx, %Operately.People.Person{} = person) do
    request(ctx, Paths.person_id(person))
  end

  def request(ctx, person_id) when is_binary(person_id) do
    mutation(ctx.conn, :add_company_owners, %{people_ids: [person_id]})
  end

end
