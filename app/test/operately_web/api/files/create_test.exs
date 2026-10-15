defmodule OperatelyWeb.Api.Files.CreateTest do
  use OperatelyWeb.TurboCase

  alias Operately.ResourceHubs
  alias Operately.Access.Binding
  alias Operately.Support.RichText
  alias Operately.Notifications.SubscriptionList

  import Operately.GroupsFixtures
  import Operately.ResourceHubsFixtures
  import Operately.BlobsFixtures

  setup ctx do
    ctx |> Factory.setup()
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:files, :create], %{})
    end
  end

  describe "blob authorization" do
    setup ctx do
      ctx
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_company_member(:other)
      |> Factory.add_blob(:blob)
      |> Factory.add_blob(:preview)
      |> Factory.log_in_person(:creator)
    end

    for field <- [:blob_id, :preview_blob_id], kind <- [:foreign, :another_author, :deleted, :import_artifact, :missing] do
      @blob_field field
      @invalid_kind kind

      test "rejects #{@invalid_kind} #{@blob_field} without changing any file in the batch", ctx do
        invalid_id = invalid_blob_id(ctx, @invalid_kind)
        valid_file = %{blob_id: ctx.blob.id, name: "File", description: RichText.rich_text("description", :as_string)}
        invalid_file = Map.put(valid_file, @blob_field, invalid_id)
        schemas = [ResourceHubs.Node, ResourceHubs.File, SubscriptionList, Operately.Notifications.Subscription, Operately.Activities.Activity, Oban.Job]
        counts = Enum.map(schemas, &Repo.aggregate(&1, :count))
        blobs = Repo.all(Operately.Blobs.Blob)

        assert {404, _} =
                 mutation(ctx.conn, [:files, :create], %{
                   resource_hub_id: Paths.resource_hub_id(ctx.hub),
                   files: [Map.put(valid_file, :preview_blob_id, ctx.preview.id), invalid_file]
                 })

        assert ResourceHubs.list_files(ctx.hub) == []
        assert Enum.map(schemas, &Repo.aggregate(&1, :count)) == counts
        Enum.each(blobs, fn blob -> assert Repo.reload(blob) == blob end)
      end
    end

    test "external API enforces blob ownership and read-only tokens", ctx do
      ctx = ctx |> Factory.add_api_token(:token, :creator, read_only: false) |> Factory.add_api_token(:read_token, :creator)

      inputs = %{
        resource_hub_id: Paths.resource_hub_id(ctx.hub),
        files: [%{blob_id: invalid_blob_id(ctx, :foreign), name: "File", description: RichText.rich_text("description", :as_string)}]
      }

      assert {404, _} = external_mutation(ctx.conn, ctx.token, "files/create", inputs)
      assert ResourceHubs.list_files(ctx.hub) == []

      inputs = put_in(inputs, [:files], [%{hd(inputs.files) | blob_id: ctx.blob.id}])
      assert {403, _} = external_mutation(ctx.conn, ctx.read_token, "files/create", inputs)
      assert Repo.reload(ctx.blob).status == :pending
      assert {200, _} = external_mutation(ctx.conn, ctx.token, "files/create", inputs)
    end

    test "accepts owned uploaded files and pending previews", ctx do
      {:ok, _} = Operately.Blobs.update_blob(ctx.blob, %{status: :uploaded})

      assert {200, _} =
               mutation(ctx.conn, [:files, :create], %{
                 resource_hub_id: Paths.resource_hub_id(ctx.hub),
                 files: [%{blob_id: ctx.blob.id, preview_blob_id: ctx.preview.id, name: "File", description: RichText.rich_text("description", :as_string)}]
               })

      assert Repo.reload(ctx.preview).status == :uploaded
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
        blob = blob_fixture(%{author_id: ctx.person.id, company_id: ctx.company.id})

        assert {code, res} = mutation(ctx.conn, [:files, :create], %{
          resource_hub_id: Paths.resource_hub_id(resource_hub),
          send_notifications_to_everyone: true,
          subscriber_ids: [],
          files: [
            %{
              blob_id: blob.id,
              name: "My file",
              description: RichText.rich_text("description", :as_string),
            }
          ]
        })
        assert code == @test.expected

        case @test.expected do
          200 ->
            files = ResourceHubs.list_files(resource_hub)
            assert hd(res.files).id == Paths.document_id(hd(files))
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
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_blob(:blob1, :person)
      |> Factory.add_blob(:blob2, :person)
      |> Factory.add_blob(:blob3, :person)
    end

    test "creates a single file within hub", ctx do
      assert ResourceHubs.list_files(ctx.hub) == []

      assert {200, res} = mutation(ctx.conn, [:files, :create], %{
        resource_hub_id: Paths.resource_hub_id(ctx.hub),
        send_notifications_to_everyone: true,
        subscriber_ids: [],
        files: [
          %{
            blob_id: ctx.blob1.id,
            name: "My file",
            description: RichText.rich_text("description", :as_string),
          }
        ]
      })
      assert length(res.files) == 1

      files = ResourceHubs.list_files(ctx.hub)

      assert length(files) == 1
      assert hd(res.files).id == Paths.file_id(hd(files))
    end

    test "creates multiple files", ctx do
      assert ResourceHubs.list_files(ctx.hub) == []

      assert {200, res} = mutation(ctx.conn, [:files, :create], %{
        resource_hub_id: Paths.resource_hub_id(ctx.hub),
        send_notifications_to_everyone: true,
        subscriber_ids: [],
        files: [
          %{
            blob_id: ctx.blob1.id,
            name: "My file",
            description: RichText.rich_text("description", :as_string),
          },
          %{
            blob_id: ctx.blob2.id,
            name: "My file",
            description: RichText.rich_text("description", :as_string),
          },
          %{
            blob_id: ctx.blob3.id,
            name: "My file",
            description: RichText.rich_text("description", :as_string),
          },
        ]
      })
      assert length(res.files) == 3

      files = ResourceHubs.list_files(ctx.hub)

      assert length(files) == 3
      Enum.each(files, fn f ->
        assert Enum.find(res.files, &(&1.id == Paths.file_id(f)))
      end)
    end

    test "requires resource_hub_id", ctx do
      assert {400, _} =
               mutation(ctx.conn, [:files, :create], %{
                 files: [
                   %{
                     blob_id: ctx.blob1.id,
                     name: "My file",
                     description: RichText.rich_text("description", :as_string),
                   }
                 ]
               })
    end
  end

  describe "subscriptions to notifications" do
    setup ctx do
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:p1, :space)
      |> Factory.add_space_member(:p2, :space)
      |> Factory.add_space_member(:p3, :space)
      |> Factory.log_in_person(:creator)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_blob(:blob1)
    end

    test "uses defaults for omitted optional inputs", ctx do
      assert {200, res} = mutation(ctx.conn, [:files, :create], %{
        resource_hub_id: Paths.resource_hub_id(ctx.hub),
        files: [
          %{
            blob_id: ctx.blob1.id,
            name: "My file",
            description: RichText.rich_text("description", :as_string),
          }
        ]
      })

      file = hd(res.files)
      {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(file.id)
      {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

      refute list.send_to_everyone
      assert length(list.subscriptions) == 1
      assert hd(list.subscriptions).person_id == ctx.creator.id
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

  defp invalid_blob_id(ctx, kind) do
    case kind do
      :foreign ->
        foreign = %{} |> Factory.setup() |> Factory.add_blob(:blob)
        foreign.blob.id

      :another_author ->
        Factory.add_blob(ctx, :other_blob, :other).other_blob.id

      :deleted ->
        blob_fixture(%{company_id: ctx.company.id, author_id: ctx.creator.id, status: :deleted}).id

      :import_artifact ->
        blob_fixture(%{purpose: :company_transfer_import_artifact, account_id: ctx.account.id}).id

      :missing ->
        Ecto.UUID.generate()
    end
  end
end
