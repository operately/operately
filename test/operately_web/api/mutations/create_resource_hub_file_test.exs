defmodule OperatelyWeb.Api.Mutations.CreateResourceHubFileTest do
  use OperatelyWeb.TurboCase

  alias Operately.ResourceHubs
  alias Operately.Access.Binding
  alias Operately.Support.RichText

  import Operately.GroupsFixtures
  import Operately.ResourceHubsFixtures
  import Operately.BlobsFixtures

  setup ctx do
    ctx |> Factory.setup()
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :create_resource_hub_file, %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access,      space: :no_access,      expected: 404},

      %{company: :no_access,      space: :comment_access, expected: 403},
      %{company: :no_access,      space: :edit_access,    expected: 200},
      %{company: :no_access,      space: :full_access,    expected: 200},

      %{company: :comment_access, space: :no_access,      expected: 403},
      %{company: :edit_access,    space: :no_access,      expected: 200},
      %{company: :full_access,    space: :no_access,      expected: 200},
    ]

    setup ctx do
      ctx
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
    end

    tabletest @table do
      test "if caller has levels company=#{@test.company} and space=#{@test.space}, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx, @test.company, @test.space)
        resource_hub = resource_hub_fixture(ctx.creator, space)
        blob = blob_fixture(%{author_id: ctx.creator.id, company_id: ctx.company.id})

        assert {code, res} = mutation(ctx.conn, :create_resource_hub_file, %{
          resource_hub_id: Paths.resource_hub_id(resource_hub),
          blob_id: blob.id,
          name: "My file",
          description: RichText.rich_text("description", :as_string),
          send_notifications_to_everyone: true,
          subscriber_ids: [],
        })
        assert code == @test.expected

        case @test.expected do
          200 ->
            files = ResourceHubs.list_files(resource_hub)
            assert res.file.id == Paths.document_id(hd(files))
          403 ->
            assert ResourceHubs.list_files(resource_hub) == []
            assert res.message == "You don't have permission to perform this action"
          404 ->
            assert ResourceHubs.list_files(resource_hub) == []
            assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "functionality" do
    setup ctx do
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:person, :space)
      |> Factory.log_in_person(:person)
      |> Factory.add_resource_hub(:hub, :space, :person)
      |> Factory.add_blob(:blob)
    end

    test "creates file within hub", ctx do
      assert ResourceHubs.list_files(ctx.hub) == []

      assert {200, res} = mutation(ctx.conn, :create_resource_hub_file, %{
        resource_hub_id: Paths.resource_hub_id(ctx.hub),
        blob_id: ctx.blob.id,
        name: "My file",
        description: RichText.rich_text("description", :as_string),
        send_notifications_to_everyone: true,
        subscriber_ids: [],
      })

      files = ResourceHubs.list_files(ctx.hub)

      assert length(files) == 1
      assert res.file.id == Paths.file_id(hd(files))
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
