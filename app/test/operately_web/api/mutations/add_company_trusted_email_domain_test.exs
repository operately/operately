defmodule OperatelyWeb.Api.Mutations.AssCompanyTrustedEmailDomainTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access
  alias Operately.Access.GroupMembership

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :add_company_trusted_email_domain, %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :comment_access, expected: 403},
      %{company: :edit_access,    expected: 403},
      %{company: :full_access,    expected: 200},
    ]

    setup :register_and_log_in_account

    tabletest @table do
      test "if caller has levels company=#{@test.company}, then expect code=#{@test.expected}", ctx do
        set_caller_access_level(ctx, @test.company)

        assert {code, res} = mutation(ctx.conn, :add_company_trusted_email_domain, %{
          company_id: Paths.company_id(ctx.company),
          domain: "@example.com"
        })

        assert code == @test.expected

        case @test.expected do
          200 -> assert res == %{company: Serializer.serialize(ctx.company, level: :essential)}
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  defp set_caller_access_level(ctx, access_level) do
    if access_level == :full_access do
      group = Access.get_group!(company_id: ctx.company.id, tag: :full_access)
      cs = GroupMembership.changeset(%{group_id: group.id, person_id: ctx.person.id})
      Operately.Repo.insert(cs)
    end
  end
end 
