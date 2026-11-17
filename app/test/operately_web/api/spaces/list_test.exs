defmodule OperatelyWeb.Api.Spaces.ListTest do
  use OperatelyWeb.TurboCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.Repo
  alias Operately.Groups
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:spaces, :list], %{})
    end

    test "it returns bad request when the company header is missing", ctx do
      ctx = ctx |> Factory.setup() |> Factory.log_in_person(:creator)
      conn = delete_req_header(ctx.conn, "x-company-id")

      assert {400, %{code: "missing_company_context"}} = query(conn, [:spaces, :list], %{include_access_levels: true})
    end

    test "it returns not found when the account is not a company member", ctx do
      ctx = ctx |> Factory.setup() |> Factory.log_in_person(:creator)
      other_company = company_fixture()
      conn = put_req_header(ctx.conn, "x-company-id", Paths.company_id(other_company))

      assert {404, _} = query(conn, [:spaces, :list], %{})
    end

    test "it returns only spaces from the user's company", ctx do
      ctx = register_and_log_in_account(ctx)

      company = ctx.company
      space = group_fixture(ctx.person, company_id: company.id)

      other_company = company_fixture()
      other_space = group_fixture(person_fixture(company_id: other_company.id), company_id: other_company.id)

      assert {200, res} = query(ctx.conn, [:spaces, :list], %{include_access_levels: true})
      assert Enum.find(res.spaces, fn s -> s.id == Paths.space_id(space) end) != nil
      assert Enum.find(res.spaces, fn s -> s.id == Paths.space_id(other_space) end) == nil
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator})
    end

    test "members have access to company space only", ctx do
      Enum.each(1..3, fn _ ->
        group_fixture(ctx.creator, company_id: ctx.company.id)
      end)
      spaces = Groups.list_groups_for_company(ctx.company.id)

      company_space = Groups.get_group!(ctx.company.company_space_id) |> Repo.preload(:company)

      assert {200, res} = query(ctx.conn, [:spaces, :list], %{include_access_levels: true})
      assert length(spaces) == 4
      assert_spaces(res, [company_space], 1)
    end

    test "members have access to spaces they are part of", ctx do
      spaces = Enum.map(1..3, fn _ ->
        space = group_fixture(ctx.creator, company_id: ctx.company.id)
        add_person_to_space(ctx, space)
        Repo.preload(space, :company)
      end)
      Enum.each(1..3, fn _ ->
        group_fixture(ctx.creator, company_id: ctx.company.id)
      end)

      assert {200, res} = query(ctx.conn, [:spaces, :list], %{})
      assert_spaces(res, spaces, 4)
    end

    test "members have access to spaces they are NOT part of", ctx do
      Enum.each(1..2, fn _ ->
        group_fixture(ctx.creator, company_id: ctx.company.id)
      end)
      spaces = Enum.map(1..2, fn _ ->
        space = group_fixture(ctx.creator, [
          company_id: ctx.company.id,
          company_permissions: Binding.view_access(),
        ])
        Repo.preload(space, :company)
      end)

      assert {200, res} = query(ctx.conn, [:spaces, :list], %{})
      assert_spaces(res, spaces, 3)
    end
  end

  describe "spaces/list functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
    end

    test "get_spaces", ctx do
      ctx =
        ctx
        |> Factory.add_space(:space1, name: "Space 1")
        |> Factory.add_space(:space2, name: "Space 2")

      assert {200, res} = query(ctx.conn, [:spaces, :list], %{})

      company_space = Operately.Groups.get_group!(ctx.company.company_space_id)

      [ctx.space1, ctx.space2, company_space]
      |> Enum.map(fn s -> Operately.Repo.preload(s, :company) end)
      |> Enum.sort_by(& &1.name)
      |> Enum.with_index()
      |> Enum.each(fn {space, i} ->
        assert Enum.at(res.spaces, i).id == Paths.space_id(space)
      end)
    end

    test "includes guests in members", ctx do
      ctx =
        ctx
        |> Factory.add_space(:space)
        |> Factory.add_space_member(:human, :space, person_type: :human)
        |> Factory.add_space_member(:guest, :space, person_type: :guest)

      assert {200, res} = query(ctx.conn, [:spaces, :list], %{include_members: true})

      assert space_res = Enum.find(res.spaces, &(&1.id == Paths.space_id(ctx.space)))
      assert length(space_res.members) == 3 # 1 creator (ctx.person) + 1 added human + 1 guest
      assert Enum.find(space_res.members, &(&1.id == Paths.person_id(ctx.human)))
      assert Enum.find(space_res.members, &(&1.id == Paths.person_id(ctx.guest)))
    end

    test "returns all 15 created spaces", ctx do
      ctx =
        Enum.reduce(1..15, ctx, fn i, acc ->
          Factory.add_space(acc, String.to_atom("space#{i}"), name: "Space #{i}")
        end)

      assert {200, res} = query(ctx.conn, [:spaces, :list], %{})

      assert length(res.spaces) == 16 # 15 created spaces + 1 company space

      created_space_ids = Enum.map(1..15, fn i ->
        space = Map.get(ctx, String.to_atom("space#{i}"))
        Paths.space_id(space)
      end)

      Enum.each(created_space_ids, fn space_id ->
        assert Enum.find(res.spaces, &(&1.id == space_id)) != nil
      end)
    end
  end

  describe "access_level filtering" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:member)
      |> Factory.add_space(:view_space, name: "View Space", company_permissions: Binding.view_access())
      |> Factory.add_space(:edit_space, name: "Edit Space", company_permissions: Binding.edit_access())
      |> Factory.add_space(:full_space, name: "Full Space", company_permissions: Binding.full_access())
      |> Factory.log_in_person(:member)
    end

    test "filters by view_access - shows all accessible spaces", ctx do
      assert {200, res} = query(ctx.conn, [:spaces, :list], %{access_level: :view_access})
      assert length(res.spaces) == 4
      assert Enum.map(res.spaces, & &1.name) |> Enum.sort() == ["Edit Space", "Full Space", "General", "View Space"]
    end

    test "filters by edit_access - shows only edit and full spaces", ctx do
      assert {200, res} = query(ctx.conn, [:spaces, :list], %{access_level: :edit_access, include_access_levels: true})
      assert length(res.spaces) == 3
      assert Enum.map(res.spaces, & &1.name) |> Enum.sort() == ["Edit Space", "Full Space", "General"]
    end

    test "filters by full_access - shows only full access spaces", ctx do
      assert {200, res} = query(ctx.conn, [:spaces, :list], %{access_level: :full_access})
      assert length(res.spaces) == 1
      assert Enum.map(res.spaces, & &1.name) |> Enum.sort() == ["Full Space"]
    end
  end

  describe "included access levels" do
    setup ctx do
      ctx |> Factory.setup() |> Factory.log_in_person(:creator)
    end

    test "enrichment query count stays bounded as the collection grows", ctx do
      ctx = Enum.reduce(1..2, ctx, &Factory.add_space(&2, :"space#{&1}", name: "Space #{&1}"))
      {small_disabled, small_count} = measured_list(ctx.conn, %{include_access_levels: false})
      {small_enabled, small_enriched_count} = measured_list(ctx.conn, %{include_access_levels: true})

      ctx = Enum.reduce(3..20, ctx, &Factory.add_space(&2, :"space#{&1}", name: "Space #{&1}"))
      {large_disabled, large_count} = measured_list(ctx.conn, %{include_access_levels: false})
      {large_enabled, large_enriched_count} = measured_list(ctx.conn, %{include_access_levels: true})
      {omitted, omitted_count} = measured_list(ctx.conn, %{})

      assert length(small_enabled.spaces) == 3
      assert length(large_enabled.spaces) == 21
      assert Enum.map(small_enabled.spaces, & &1.id) == Enum.map(small_disabled.spaces, & &1.id)
      assert Enum.map(large_enabled.spaces, & &1.id) == Enum.map(large_disabled.spaces, & &1.id)
      assert Enum.all?(small_enabled.spaces ++ large_enabled.spaces, &is_map(&1.access_levels))
      assert Enum.all?(small_disabled.spaces ++ large_disabled.spaces ++ omitted.spaces, &is_nil(&1.access_levels))
      assert omitted_count == large_count
      assert small_enriched_count - small_count in 1..2
      assert large_enriched_count - large_count == small_enriched_count - small_count
    end

    test "preserves access levels, defaults, ordering, and derived privacy", ctx do
      ctx =
        ctx
        |> Factory.add_space(:public, name: "Public", public_permissions: Binding.view_access(), company_permissions: Binding.comment_access())
        |> Factory.add_space(:internal, name: "Internal", company_permissions: Binding.edit_access())
        |> Factory.add_space(:confidential, name: "Confidential")
        |> Factory.add_space(:secret, name: "Secret")
        |> Factory.add_space(:deleted, name: "Deleted", public_permissions: Binding.view_access())

      confidential_context = Operately.Access.get_context!(group_id: ctx.confidential.id)
      confidential_group = Operately.Access.get_group!(group_id: ctx.confidential.id, tag: :standard)
      Binding.changeset(%{context_id: confidential_context.id, group_id: confidential_group.id, access_level: Binding.comment_access()}) |> Repo.insert!()

      secret_context = Operately.Access.get_context!(group_id: ctx.secret.id)
      company_group = Operately.Access.get_group!(company_id: ctx.company.id, tag: :standard)
      Operately.Access.get_binding!(context_id: secret_context.id, group_id: company_group.id) |> Repo.delete!()

      # A different space's standard group must not grant space access here.
      Binding.changeset(%{context_id: secret_context.id, group_id: confidential_group.id, access_level: Binding.full_access()}) |> Repo.insert!()
      other_company = company_fixture()
      other_company_group = Operately.Access.get_group!(company_id: other_company.id, tag: :standard)
      Binding.changeset(%{context_id: secret_context.id, group_id: other_company_group.id, access_level: Binding.full_access()}) |> Repo.insert!()
      Repo.soft_delete!(ctx.deleted)

      assert {200, response} = query(ctx.conn, [:spaces, :list], %{include_access_levels: true})
      assert Enum.map(response.spaces, & &1.name) == ["Confidential", "General", "Internal", "Public", "Secret"]

      for {key, public, company, space, private} <- [
            {:public, Binding.view_access(), Binding.comment_access(), Binding.no_access(), false},
            {:internal, Binding.no_access(), Binding.edit_access(), Binding.no_access(), false},
            {:confidential, Binding.no_access(), Binding.no_access(), Binding.comment_access(), true},
            {:secret, Binding.no_access(), Binding.no_access(), Binding.no_access(), true}
          ] do
        serialized = Enum.find(response.spaces, &(&1.id == Paths.space_id(Map.fetch!(ctx, key))))
        assert serialized.access_levels == %{public: public, company: company, space: space, __typename: "access_levels"}
        assert serialized.private_space == private
      end
    end

    test "empty results do not fetch enrichment data", ctx do
      ctx = ctx |> Factory.add_company_member(:member) |> Factory.log_in_person(:member)
      inputs = %{access_level: :full_access}
      {disabled, disabled_count} = measured_list(ctx.conn, Map.put(inputs, :include_access_levels, false))
      {enabled, enabled_count} = measured_list(ctx.conn, Map.put(inputs, :include_access_levels, true))

      assert disabled.spaces == []
      assert enabled.spaces == []
      assert enabled_count == disabled_count
    end
  end

  describe "included permissions" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.log_in_person(:creator)
    end

    test "includes effective permissions when requested", ctx do
      assert {200, res} = query(ctx.conn, [:spaces, :list], %{include_permissions: true})

      space = Enum.find(res.spaces, &(&1.id == Paths.space_id(ctx.space)))
      assert space.permissions.can_edit
    end

    test "omits effective permissions by default", ctx do
      assert {200, res} = query(ctx.conn, [:spaces, :list], %{})

      space = Enum.find(res.spaces, &(&1.id == Paths.space_id(ctx.space)))
      assert space.permissions == nil
    end

    test "removes edit permission in company read-only mode", ctx do
      %{company_id: ctx.company.id, access_state: :read_only}
      |> Operately.Billing.CompanyBillingAccount.changeset()
      |> Repo.insert!()

      assert {200, res} = query(ctx.conn, [:spaces, :list], %{include_permissions: true})

      space = Enum.find(res.spaces, &(&1.id == Paths.space_id(ctx.space)))
      assert space.permissions.can_view
      refute space.permissions.can_edit
    end
  end

  #
  # Helpers
  #

  defp measured_list(conn, inputs) do
    handler_id = {__MODULE__, make_ref()}
    caller = self()

    :telemetry.attach(
      handler_id,
      [:operately, :repo, :query],
      fn _, _, _, _ ->
        if self() == caller, do: send(caller, {:space_list_query, handler_id})
      end,
      nil
    )

    try do
      assert {200, response} = query(conn, [:spaces, :list], inputs)
      {response, count_queries(handler_id)}
    after
      :telemetry.detach(handler_id)
    end
  end

  defp count_queries(handler_id, count \\ 0) do
    receive do
      {:space_list_query, ^handler_id} -> count_queries(handler_id, count + 1)
    after
      0 -> count
    end
  end

  defp assert_spaces(res, spaces, count) do
    assert length(res.spaces) == count
    Enum.each(spaces, fn s ->
      assert Enum.find(res.spaces, fn r -> r.id == Paths.space_id(s) end) != nil
    end)
  end

  defp add_person_to_space(ctx, space) do
    Operately.Groups.add_members(ctx.person, space.id, [%{
      id: ctx.person.id,
      access_level: Binding.view_access(),
    }])
  end
end
