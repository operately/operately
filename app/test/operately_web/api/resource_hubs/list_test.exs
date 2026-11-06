defmodule OperatelyWeb.Api.ResourceHubs.ListTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding

  test "is exposed for external discovery and internal configuration" do
    assert Map.has_key?(OperatelyWeb.Api.External.__queries__(), "documents/list_hubs")
    assert Map.has_key?(OperatelyWeb.Api.Internal.__queries__(), "resource_hubs/list")
  end

  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:person)
      |> Factory.add_api_token(:api_token, :person, read_only: true)
    end

    @table [
      %{company: :no_access, space: :no_access, expected: 404},
      %{company: :no_access, space: :view_access, expected: 200},
      %{company: :view_access, space: :no_access, expected: 200}
    ]

    tabletest @table do
      test "company=#{@test.company} and space=#{@test.space} returns #{@test.expected}", ctx do
        ctx = Factory.add_space(ctx, :space, company_permissions: Binding.from_atom(@test.company))

        if @test.space != :no_access do
          {:ok, _} =
            Operately.Groups.add_members(ctx.creator, ctx.space.id, [
              %{
                id: ctx.person.id,
                access_level: Binding.from_atom(@test.space)
              }
            ])
        end

        assert {status, response} = list_hubs(ctx)
        assert status == @test.expected

        if status == 200 do
          assert [%{id: id, is_default: true}] = response.hubs
          assert id == Paths.resource_hub_id(ctx.space.default_resource_hub_id)
        end
      end
    end

    test "does not expose hubs from another company", ctx do
      other = Factory.setup(%{}) |> Factory.add_space(:space)
      assert {404, _} = list_hubs(Map.put(ctx, :space, other.space))
    end
  end

  describe "discovery" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_api_token(:api_token, :creator, read_only: true)
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_resource_hub(:other, :space, :creator, name: "Alpha")
    end

    test "returns ordered summaries for only the space's own hubs", ctx do
      ctx =
        ctx
        |> Factory.add_document(:document, :hub)
        |> Factory.add_space(:other_space)
        |> Factory.add_project(:project, :space)
        |> Factory.add_goal(:goal, :space)

      assert {200, response} = list_hubs(ctx)

      assert Enum.sort_by(response.hubs, & &1.name) == [
               %{__typename: "resource_hub_summary", id: Paths.resource_hub_id(ctx.other.id), name: ctx.other.name, is_default: false, position: 0},
               %{__typename: "resource_hub_summary", id: Paths.resource_hub_id(ctx.hub.id), name: ctx.hub.name, is_default: true, position: 0}
             ]
    end

    test "honors saved positions", ctx do
      ctx.other |> Ecto.Changeset.change(position: 4) |> Repo.update!()
      ctx.hub |> Ecto.Changeset.change(position: 7) |> Repo.update!()
      assert {200, response} = list_hubs(ctx)
      assert Enum.map(response.hubs, & &1.position) == [4, 7]
    end

    test "identifies the persisted default rather than the oldest hub", ctx do
      ctx.space |> Ecto.Changeset.change(default_resource_hub_id: ctx.other.id) |> Repo.update!()

      assert {200, response} = list_hubs(ctx)
      assert [%{id: id}] = Enum.filter(response.hubs, & &1.is_default)
      assert id == Paths.resource_hub_id(ctx.other.id)
    end

    test "keeps hubs discoverable when no default is configured", ctx do
      ctx.space |> Ecto.Changeset.change(default_resource_hub_id: nil) |> Repo.update!()

      assert {200, response} = list_hubs(ctx)
      assert length(response.hubs) == 2
      refute Enum.any?(response.hubs, & &1.is_default)
    end

    test "returns an empty list without creating a hub", ctx do
      Repo.delete!(ctx.hub)
      Repo.delete!(ctx.other)

      assert {200, %{hubs: []}} = list_hubs(ctx)
      assert Operately.ResourceHubs.list_resource_hubs(ctx.space) == []
    end

    test "disabled tool visibility does not hide hubs from discovery", ctx do
      ctx = Factory.set_space_tools(ctx, :space, resource_hub_enabled: false)

      assert {200, response} = list_hubs(ctx)
      assert length(response.hubs) == 2
    end

    test "uses creation dates before IDs when positions are tied", ctx do
      [newer, older] = Enum.sort_by([ctx.hub, ctx.other], & &1.id)
      newer |> Ecto.Changeset.change(inserted_at: ~N[2021-01-01 00:00:00]) |> Repo.update!()
      older |> Ecto.Changeset.change(inserted_at: ~N[2020-01-01 00:00:00]) |> Repo.update!()

      assert {200, response} = list_hubs(ctx)
      assert Enum.map(response.hubs, & &1.id) == Enum.map([older, newer], &Paths.resource_hub_id(&1.id))
    end

    test "uses IDs when positions and creation dates are tied", ctx do
      for hub <- [ctx.hub, ctx.other] do
        hub |> Ecto.Changeset.change(inserted_at: ~N[2020-01-01 00:00:00]) |> Repo.update!()
      end

      assert {200, response} = list_hubs(ctx)
      expected = Enum.sort([ctx.hub.id, ctx.other.id]) |> Enum.map(&Paths.resource_hub_id/1)
      assert Enum.map(response.hubs, & &1.id) == expected
    end

    test "requires a space identifier", ctx do
      assert {400, _} = external_query(ctx.conn, ctx.api_token, "documents/list_hubs", %{})
    end

    test "returns not found for malformed or nonexistent space identifiers", ctx do
      for id <- ["@invalid!", Paths.space_id(Ecto.UUID.generate())] do
        assert {404, _} = external_query(ctx.conn, ctx.api_token, "documents/list_hubs", %{space_id: id})
      end
    end

    test "returns not found for a deleted space", ctx do
      Repo.soft_delete!(ctx.space)
      assert {404, _} = list_hubs(ctx)
    end
  end

  defp list_hubs(ctx) do
    external_query(ctx.conn, ctx.api_token, "documents/list_hubs", %{space_id: Paths.space_id(ctx.space)})
  end
end
