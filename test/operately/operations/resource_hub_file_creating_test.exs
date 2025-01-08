defmodule Operately.Operations.ResourceHubFileCreatingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  alias Operately.Access.Binding
  alias Operately.Support.RichText
  alias Operately.Operations.ResourceHubFileCreating
  alias Operately.Notifications.{SubscriptionList, Subscription}

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator, company_access_level: Binding.no_access())
    |> Factory.add_space_member(:mike, :space)
    |> Factory.add_space_member(:bob, :space)
    |> Factory.add_space_member(:jane, :space)
    |> Factory.add_blob(:blob1)
    |> Factory.add_blob(:blob2)
    |> Factory.add_blob(:blob3)
  end

  describe "functionality" do
    test "creates subscriptions", ctx do
      {:ok, files} = create_files(ctx)

      Enum.each(files, fn f ->
        {:ok, list} = SubscriptionList.get(:system, parent_id: f.id)

        [ctx.creator, ctx.mike, ctx.bob]
        |> Enum.each(fn p ->
          assert {:ok, _} = Subscription.get(:system, subscription_list_id: list.id, person_id: p.id)
        end)
      end)

      file_3 = Enum.find(files, &(&1.node.name == "File 3"))
      {:ok, list} = SubscriptionList.get(:system, parent_id: file_3.id)
      assert {:ok, _} = Subscription.get(:system, subscription_list_id: list.id, person_id: ctx.jane.id)
    end

    test "blobs are marked as uploaded", ctx do
      [ctx.blob1, ctx.blob2, ctx.blob3]
      |> Enum.each(fn blob ->
        assert blob.status == :pending
      end)

      {:ok, _} = create_files(ctx)

      [ctx.blob1, ctx.blob2, ctx.blob3]
      |> Enum.each(fn blob ->
        blob = Repo.reload(blob)
        assert blob.status == :uploaded
      end)
    end
  end

  describe "notifications" do
    @action "resource_hub_file_created"

    test "Creating file sends notifications to everyone", ctx do
      {:ok, file} = Oban.Testing.with_testing_mode(:manual, fn ->
        create_file(ctx, true, [])
      end)

      activity = get_activity(ctx.hub, file, @action)

      assert 0 == notifications_count(action: @action)

      perform_job(activity.id)
      notifications = fetch_notifications(activity.id, action: @action)

      assert 3 == notifications_count(action: @action)

      [ctx.mike, ctx.bob, ctx.jane]
      |> Enum.each(fn p ->
        assert Enum.find(notifications, &(&1.person_id == p.id))
      end)
    end

    test "Creating file sends notifications to selected people", ctx do
      {:ok, file} = Oban.Testing.with_testing_mode(:manual, fn ->
        create_file(ctx, false, [ctx.mike.id, ctx.jane.id])
      end)

      activity = get_activity(ctx.hub, file, @action)

      assert 0 == notifications_count(action: @action)

      perform_job(activity.id)
      notifications = fetch_notifications(activity.id, action: @action)

      assert 2 == notifications_count(action: @action)

      [ctx.mike, ctx.jane]
      |> Enum.each(fn p ->
        assert Enum.find(notifications, &(&1.person_id == p.id))
      end)
    end

    test "Person without permissions is not notified", ctx do
      ctx = Factory.add_company_member(ctx, :person)

      # Without permissions
      content = RichText.rich_text(mentioned_people: [ctx.person]) |> Jason.decode!()

      {:ok, file} = create_file(ctx, false, [], content)

      activity = get_activity(ctx.hub, file, @action)

      assert notifications_count(action: @action) == 0
      assert fetch_notifications(activity.id, action: @action) == []

      # With permissions
      {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [
        %{id: ctx.person.id, access_level: Binding.view_access()}
      ])

      {:ok, file} = create_file(ctx, false, [], content)

      activity = get_activity(ctx.hub, file, @action)
      notifications = fetch_notifications(activity.id, action: @action)

      assert notifications_count(action: @action) == 1
      assert hd(notifications).person_id == ctx.person.id
    end
  end

  #
  # Helpers
  #

  defp create_files(ctx) do
    ResourceHubFileCreating.run(ctx.creator, ctx.hub, %{
      files: [
        %{
          blob_id: ctx.blob1.id,
          name: "Some name",
          description: RichText.rich_text("Content"),
        },
      %{
          blob_id: ctx.blob2.id,
          name: "Some name",
          description: RichText.rich_text("Content"),
        },
        %{
          blob_id: ctx.blob3.id,
          name: "File 3",
          description: RichText.rich_text(mentioned_people: [ctx.jane]) |> Jason.decode!()
        },
      ],
      send_to_everyone: false,
      subscriber_ids: [ctx.mike.id, ctx.bob.id],
    })
  end

  defp create_file(ctx, send_to_everyone, people_list, description \\ nil) do
    {:ok, files} = ResourceHubFileCreating.run(ctx.creator, ctx.hub, %{
      files: [
        %{
          blob_id: ctx.blob1.id,
          name: "Some name",
          description: description || RichText.rich_text("Content"),
        }
      ],
      send_to_everyone: send_to_everyone,
      subscriber_ids: people_list,
    })
    {:ok, hd(files)}
  end

  defp get_activity(hub, file, action) do
    activities =
      from(a in Operately.Activities.Activity,
        where: a.action == ^action and a.content["resource_hub_id"] == ^hub.id
      )
      |> Repo.all()

    Enum.find(activities, fn a ->
      file.id in Enum.map(a.content["files"], &(&1["file_id"]))
    end)
  end
end
