defmodule OperatelyWeb.Api.Mutations.ConvertCompanyMemberToGuestTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_owner(:owner)
    |> Factory.add_company_admin(:admin)
    |> Factory.add_company_member(:member, has_open_invitation: false)
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :convert_company_member_to_guest, %{})
    end
  end

  describe "permissions" do
    test "company members can't convert team members to outside collaborators", ctx do
      ctx = Factory.log_in_person(ctx, :member)

      assert {403, _} = request(ctx, ctx.admin)
    end

    test "company admins can convert team members to outside collaborators", ctx do
      ctx = Factory.log_in_person(ctx, :admin)

      assert {200, _} = request(ctx, ctx.member)
    end

    test "company owners can convert team members to outside collaborators", ctx do
      ctx = Factory.log_in_person(ctx, :owner)

      assert {200, _} = request(ctx, ctx.member)
    end

    test "can't convert team members from other companies", ctx do
      other_ctx =
        %{}
        |> Factory.setup()
        |> Factory.add_company_member(:other_member, has_open_invitation: false)

      ctx = Factory.log_in_person(ctx, :admin)

      assert {404, _} = request(ctx, other_ctx.other_member)
    end
  end

  describe "functionality" do
    test "it converts a team member to outside collaborator", ctx do
      ctx = Factory.log_in_person(ctx, :admin)

      assert {200, res} = request(ctx, ctx.member)

      member = Operately.Repo.reload(ctx.member)
      assert member.type == :guest
      assert res.person.id == Paths.person_id(member)

      company = Operately.Companies.Company.get!(member, id: ctx.company.id, opts: [
        required_access_level: Binding.minimal_access()
      ])
      assert company.request_info.access_level == Binding.minimal_access()
    end

    test "it doesn't allow converting your own account", ctx do
      ctx = Factory.log_in_person(ctx, :admin)

      assert {400, res} = request(ctx, ctx.admin)
      assert res.message == "You can't convert your own account to outside collaborator"
    end
  end

  defp request(ctx, person) do
    mutation(ctx.conn, :convert_company_member_to_guest, %{person_id: Paths.person_id(person)})
  end
end
