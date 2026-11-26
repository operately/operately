defmodule OperatelyWeb.Api.Documents.UpdateTest do
  use OperatelyWeb.TurboCase

  alias Operately.ResourceHubs.Document
  alias Operately.Notifications.{Subscription, SubscriptionList}
  alias Operately.Access.Binding
  alias Operately.Support.RichText

  import Operately.GroupsFixtures
  import Operately.ResourceHubsFixtures

  setup ctx do
    ctx |> Factory.setup()
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:documents, :update], %{})
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
        document = document_fixture(resource_hub.id, ctx.creator.id)

        assert {code, res} = mutation(ctx.conn, [:documents, :update], %{
          document_id: Paths.document_id(document),
          name: "Edited name",
          content: RichText.rich_text("Edited content", :as_string)
        })
        assert code == @test.expected

        {:ok, document} = Document.get(:system, id: document.id)

        case @test.expected do
          200 ->
            assert document.content == RichText.rich_text("Edited content")
            assert res.document.id == Paths.document_id(document)
          403 ->
            assert document.content == RichText.rich_text("Content")
            assert res.message == "You don't have permission to perform this action"
          404 ->
            assert document.content == RichText.rich_text("Content")
            assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "functionality" do
    setup ctx do
      ctx
      |> Factory.add_space(:space)
      |> Factory.log_in_person(:creator)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub)
      |> Factory.preload(:document, :node)
    end

    test "edits document", ctx do
      assert ctx.document.name == "Document"
      assert ctx.document.content == RichText.rich_text("Content")

      assert {200, _} = mutation(ctx.conn, [:documents, :update], %{
        document_id: Paths.document_id(ctx.document),
        name: "Brand new name",
        content: RichText.rich_text("Edited content", :as_string)
      })

      {:ok, document} = Document.get(:system, id: ctx.document.id, opts: [preload: :node])

      assert document.name == "Brand new name"
      assert document.content == RichText.rich_text("Edited content")
    end

    test "table edits create a version and preserve previous content", ctx do
      content = "test/fixtures/rich_text/tables.json" |> File.read!() |> Jason.decode!() |> Enum.at(1) |> Map.fetch!("document")

      assert {200, _} =
               mutation(ctx.conn, [:documents, :update], %{
                 document_id: Paths.document_id(ctx.document),
                 name: ctx.document.name,
                 content: Jason.encode!(content)
               })

      document = Repo.reload!(ctx.document)
      assert document.content == content
      assert document.current_version == 2
      [version, previous] = Operately.ResourceHubs.DocumentVersion.list_for_document(document.id)
      assert version.editor_id == ctx.creator.id
      assert version.content == content
      assert previous.content == ctx.document.content
    end

    test "draft table edits update in place without creating a version", ctx do
      ctx = Factory.add_document(ctx, :draft, :hub, state: :draft)
      content = "test/fixtures/rich_text/tables.json" |> File.read!() |> Jason.decode!() |> Enum.at(1) |> Map.fetch!("document")
      versions = Operately.ResourceHubs.DocumentVersion.list_for_document(ctx.draft.id)

      assert {200, _} =
               mutation(ctx.conn, [:documents, :update], %{
                 document_id: Paths.document_id(ctx.draft),
                 name: ctx.draft.name,
                 content: Jason.encode!(content)
               })

      draft = Repo.reload!(ctx.draft)
      assert draft.content == content
      assert draft.state == :draft
      assert draft.current_version == ctx.draft.current_version
      assert Operately.ResourceHubs.DocumentVersion.list_for_document(draft.id) == versions
    end

    test "stale expected_version conflicts without writes", ctx do
      assert {200, _} =
               mutation(ctx.conn, [:documents, :update], %{
                 document_id: Paths.document_id(ctx.document),
                 name: "First edit",
                 content: RichText.rich_text("First", :as_string)
               })

      assert {400, res} =
               mutation(ctx.conn, [:documents, :update], %{
                 document_id: Paths.document_id(ctx.document),
                 name: "Conflict",
                 content: RichText.rich_text("Conflict", :as_string),
                 expected_version: 1
               })

      assert res.details["reason"] == "version_conflict" or res.details[:reason] == "version_conflict"

      {:ok, document} = Document.get(:system, id: ctx.document.id)
      assert document.name == "First edit"
      assert document.current_version == 2
    end
  end

  describe "subscriptions" do
    setup ctx do
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:subscriber, :space)
      |> Factory.add_space_member(:unsubscribed, :space)
      |> Factory.log_in_person(:creator)
      |> Factory.add_resource_hub(:hub, :space, :creator)
    end

    test "an edit without subscription inputs preserves selected and canceled subscriptions", ctx do
      document = create_document(ctx, false)
      list = subscription_list!(document.id)
      canceled = Enum.find(list.subscriptions, &(&1.person_id == ctx.unsubscribed.id))
      {:ok, _} = canceled |> Subscription.changeset(%{canceled: true}) |> Repo.update()

      assert {200, _} =
               mutation(ctx.conn, [:documents, :update], %{
                 document_id: Paths.document_id(document),
                 name: "Edited name",
                 content: RichText.rich_text("Edited content", :as_string)
               })

      assert Repo.reload!(document).current_version == 2
      assert_subscription_state(document.id, false, %{ctx.creator.id => false, ctx.subscriber.id => false, ctx.unsubscribed.id => true})
    end

    test "null subscription inputs preserve send-to-everyone and subscribers", ctx do
      document = create_document(ctx, true)

      assert {200, _} =
               mutation(ctx.conn, [:documents, :update], %{
                 document_id: Paths.document_id(document),
                 name: "Edited name",
                 content: RichText.rich_text("Edited content", :as_string),
                 send_notifications_to_everyone: nil,
                 subscriber_ids: nil
               })

      assert_subscription_state(document.id, true, %{ctx.creator.id => false, ctx.subscriber.id => false, ctx.unsubscribed.id => false})
    end

    test "an explicit empty list with notifications disabled clears subscribers", ctx do
      document = create_document(ctx, true)

      assert {200, _} =
               mutation(ctx.conn, [:documents, :update], %{
                 document_id: Paths.document_id(document),
                 name: "Edited name",
                 content: RichText.rich_text("Edited content", :as_string),
                 send_notifications_to_everyone: false,
                 subscriber_ids: []
               })

      assert_subscription_state(document.id, false, %{ctx.creator.id => true, ctx.subscriber.id => true, ctx.unsubscribed.id => true})
    end
  end

  test "mutation responses enrich titles while storing source content", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub)
      |> Factory.log_in_person(:creator)

    source = Operately.Support.RichText.resource_link(Paths.space_path(ctx.company, ctx.space))
    assert {200, %{document: document}} = mutation(ctx.conn, [:documents, :update], %{document_id: Paths.document_id(ctx.document), name: ctx.document.name, content: Jason.encode!(source)})
    assert get_in(Jason.decode!(document.content), ["content", Access.at(0), "content", Access.at(0), "text"]) == ctx.space.name
    assert Repo.reload!(ctx.document).content == source
  end

  test "document updates reconcile inline anchors", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub, content: RichText.rich_text("Hello world"))
      |> Factory.add_inline_thread(:thread, :document, from: 1, to: 6, quote: "Hello")
      |> Factory.log_in_person(:creator)

    assert {200, _} = mutation(ctx.conn, [:documents, :update], %{document_id: Paths.document_id(ctx.document), name: ctx.document.name, content: RichText.rich_text("Say Hello world", :as_string)})
    assert %{status: :attached, current_from: 5, current_to: 10, current_version: 2} = Repo.reload!(ctx.thread).anchor
  end

  #
  # Helpers
  #

  defp create_document(ctx, send_to_everyone) do
    assert {200, response} =
             mutation(ctx.conn, [:documents, :create], %{
               resource_hub_id: Paths.resource_hub_id(ctx.hub),
               name: "Document",
               content: RichText.rich_text("Content", :as_string),
               send_notifications_to_everyone: send_to_everyone,
               subscriber_ids: Enum.map([ctx.subscriber, ctx.unsubscribed], &Paths.person_id/1)
             })

    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(response.document.id)
    Repo.get!(Document, id)
  end

  defp subscription_list!(document_id) do
    {:ok, list} = SubscriptionList.get(:system, parent_id: document_id, opts: [preload: :subscriptions])
    list
  end

  defp assert_subscription_state(document_id, send_to_everyone, canceled_by_person) do
    list = subscription_list!(document_id)
    assert list.send_to_everyone == send_to_everyone
    assert Map.new(list.subscriptions, &{&1.person_id, &1.canceled}) == canceled_by_person
  end

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
