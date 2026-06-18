defmodule OperatelyWeb.Api.Documents.GetTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.ResourceHubsFixtures

  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:documents, :get], %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
    end

    @table [
      %{company: :no_access,      space: :no_access,      expected: 404},

      %{company: :no_access,      space: :view_access,    expected: 200},
      %{company: :no_access,      space: :comment_access, expected: 200},
      %{company: :no_access,      space: :edit_access,    expected: 200},
      %{company: :no_access,      space: :full_access,    expected: 200},

      %{company: :view_access,    space: :no_access,      expected: 200},
      %{company: :comment_access, space: :no_access,      expected: 200},
      %{company: :edit_access,    space: :no_access,      expected: 200},
      %{company: :full_access,    space: :no_access,      expected: 200},
    ]

    tabletest @table do
      test "if caller has levels company=#{@test.company} and space=#{@test.space}, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx, @test.company, @test.space)
        resource_hub = resource_hub_fixture(ctx.creator, space)
        doc = document_fixture(resource_hub.id, ctx.creator.id)

        assert {code, res} = query(ctx.conn, [:documents, :get], %{id: Paths.document_id(doc)})

        assert code == @test.expected

        case @test.expected do
          404 ->
            assert res.message == "The requested resource was not found"
          200 ->
            assert res.document.id == Paths.document_id(doc)
        end
      end
    end
  end

  describe "get_resource_hub_document functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_resource_hub(:project_hub, :project, :creator)
      |> Factory.add_resource_hub(:goal_hub, :goal, :creator)
      |> Factory.add_folder(:folder, :hub)
      |> Factory.add_document(:doc, :hub, folder: :folder)
      |> Factory.add_document(:project_doc, :project_hub)
      |> Factory.add_document(:goal_doc, :goal_hub)
    end

    test "get document", ctx do
      assert {200, res} = query(ctx.conn, [:documents, :get], %{id: Paths.document_id(ctx.doc)})

      assert res.document.id == Paths.document_id(ctx.doc)
    end

    test "include_author", ctx do
      assert {200, res} = query(ctx.conn, [:documents, :get], %{id: Paths.document_id(ctx.doc)})

      refute res.document.author

      assert {200, res} = query(ctx.conn, [:documents, :get], %{
        id: Paths.document_id(ctx.doc),
        include_author: true
      })

      assert res.document.author == Serializer.serialize(ctx.creator)
    end

    test "include_resource_hub", ctx do
      assert {200, res} = query(ctx.conn, [:documents, :get], %{id: Paths.document_id(ctx.doc)})

      refute res.document.resource_hub

      assert {200, res} = query(ctx.conn, [:documents, :get], %{
        id: Paths.document_id(ctx.doc),
        include_resource_hub: true,
      })

      assert res.document.resource_hub == Serializer.serialize(ctx.hub)
    end

    test "include_space", ctx do
      assert {200, res} = query(ctx.conn, [:documents, :get], %{id: Paths.document_id(ctx.doc)})

      refute res.document.space

      assert {200, res} = query(ctx.conn, [:documents, :get], %{
        id: Paths.document_id(ctx.doc),
        include_space: true,
      })

      assert res.document.space == Serializer.serialize(ctx.space, level: :essential)
    end

    test "include_parent_folder", ctx do
      assert {200, res} = query(ctx.conn, [:documents, :get], %{id: Paths.document_id(ctx.doc)})

      refute res.document.parent_folder

      assert {200, res} = query(ctx.conn, [:documents, :get], %{
        id: Paths.document_id(ctx.doc),
        include_parent_folder: true,
      })

      assert res.document.parent_folder == Repo.preload(ctx.folder, :node) |> Serializer.serialize()
    end

    test "include_potential_subscribers preserves included space", ctx do
      assert {200, res} = query(ctx.conn, [:documents, :get], %{
        id: Paths.document_id(ctx.doc),
        include_resource_hub: true,
        include_space: true,
        include_potential_subscribers: true,
      })

      assert res.document.resource_hub.id == Paths.resource_hub_id(ctx.hub)
      assert res.document.space == Serializer.serialize(ctx.space, level: :essential)
      assert length(res.document.potential_subscribers) == 1
    end

    test "include_potential_subscribers preserves parent_folder", ctx do
      assert {200, res} = query(ctx.conn, [:documents, :get], %{
        id: Paths.document_id(ctx.doc),
        include_parent_folder: true,
        include_potential_subscribers: true,
      })

      assert res.document.parent_folder == Repo.preload(ctx.folder, :node) |> Serializer.serialize()
      assert length(res.document.potential_subscribers) == 1
    end

    test "include_project returns the project-backed hub parent", ctx do
      assert {200, res} =
               query(ctx.conn, [:documents, :get], %{
                 id: Paths.document_id(ctx.project_doc),
                 include_project: true
               })

      refute res.document.resource_hub
      assert res.document.project == Serializer.serialize(ctx.project, level: :essential)
    end

    test "include_resource_hub and include_project keep the project-backed hub data", ctx do
      assert {200, res} =
               query(ctx.conn, [:documents, :get], %{
                 id: Paths.document_id(ctx.project_doc),
                 include_resource_hub: true,
                 include_project: true
               })

      assert res.document.resource_hub.id == Paths.resource_hub_id(ctx.project_hub)
      assert res.document.project == Serializer.serialize(ctx.project, level: :essential)
    end

    test "include_goal returns the goal-backed hub data", ctx do
      assert {200, res} =
               query(ctx.conn, [:documents, :get], %{
                 id: Paths.document_id(ctx.goal_doc),
                 include_goal: true
               })

      assert res.document.resource_hub.id == Paths.resource_hub_id(ctx.goal_hub)
      assert res.document.resource_hub.goal == Serializer.serialize(ctx.goal, level: :essential)
    end
  end

  #
  # Helpers
  #

  defp create_space(ctx, company_members_level, space_members_level) do
    space = group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.from_atom(company_members_level)})

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_members_level)
      }])
    end

    space
  end
end
