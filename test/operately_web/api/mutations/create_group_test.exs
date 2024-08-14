defmodule OperatelyWeb.Api.Mutations.CreateGroupTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :create_group, %{})
    end
  end

  describe "permissions" do
    setup :register_and_log_in_account

    test "company members without full access can't create space", ctx do
      assert {403, res} = request(ctx.conn)
      assert res.message == "You don't have permission to perform this action"
    end

    test "company members with full access can create space", ctx do
      give_person_full_access(ctx)

      assert {200, res} = request(ctx.conn)
      assert_space_created(res)
    end

    test "company admins can create space", ctx do
      # Not admin
      assert {403, _} = request(ctx.conn)

      # Admin
      {:ok, _} = Operately.Companies.add_admin(ctx.company_creator, ctx.person.id)

      assert {200, res} = request(ctx.conn)
      assert_space_created(res)
    end
  end

  describe "create_group functionality" do
    setup :register_and_log_in_account

    test "creates space", ctx do
      Operately.Companies.add_admin(ctx.company_creator, ctx.person.id)

      assert {200, res} = request(ctx.conn)
      assert_space_created(res)
    end
  end

  #
  # Steps
  #

  defp request(conn) do
    mutation(conn, :create_group, %{
      name: "some name",
      mission: "some mission",
      icon: "IconBuildingEstate",
      color: "text-cyan-500",
      company_permissions: Binding.view_access(),
      public_permissions: Binding.no_access(),
    })
  end

  defp assert_space_created(res) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.group.id)
    assert Operately.Groups.get_group(id)
  end

  #
  # Helpers
  #

  defp give_person_full_access(ctx) do
    group = Access.get_group!(company_id: ctx.company.id, tag: :standard)
    context = Access.get_context!(company_id: ctx.company.id)

    Access.get_binding!(group_id: group.id, context_id: context.id)
    |> Access.update_binding(%{access_level: Binding.full_access()})
  end
end
