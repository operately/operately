defmodule Operately.Activities.PreloaderTest do
  use Operately.DataCase

  alias Operately.Activities
  alias Operately.Activities.{Activity, Preloader}
  alias OperatelyWeb.Api.Serializers.Activity, as: ActivitySerializer
  alias OperatelyWeb.Api.Serializer

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_member(:assignee)
    |> Factory.add_company_member(:deleted_assignee)
    |> Factory.add_space(:space)
    |> Factory.preload(:space, :access_context)
    |> Factory.create_space_task(:task, :space)
  end

  test "changed assignee queries stay bounded as the collection grows", ctx do
    activities =
      for _ <- 1..4 do
        insert_activity(ctx, %{
          added_assignee_ids: [ctx.creator.id, ctx.assignee.id, ctx.creator.id],
          removed_assignee_ids: [ctx.assignee.id, ctx.creator.id],
          new_assignee_id: ctx.creator.id
        })
      end

    activities = Repo.preload(activities, [:author, :comment_thread])

    {single, single_queries} = measure_people_queries(fn -> load_and_serialize([hd(activities)]) end)
    {collection, collection_queries} = measure_people_queries(fn -> load_and_serialize(activities) end)

    assert length(single) == 1
    assert length(collection) == 4
    assert {length(single_queries), length(collection_queries)} == {1, 1}

    [person_query] = collection_queries
    [ids] = person_query.cast_params
    assert length(ids) == length(Enum.uniq(ids))
    ids = Enum.reject(ids, &is_nil/1)
    assert length(ids) == 2
    assert MapSet.new(ids) == MapSet.new([ctx.creator.id, ctx.assignee.id])
  end

  test "preloaded serialization preserves changed and legacy assignees without querying", ctx do
    ctx = Factory.suspend_company_member(ctx, :deleted_assignee)
    # People are suspended rather than soft-deleted; their accounts support soft deletion.
    {:ok, _} = Repo.soft_delete(Repo.get!(Operately.People.Account, ctx.deleted_assignee.account_id))
    missing_id = Ecto.UUID.generate()

    arrays =
      insert_activity(ctx, %{
        added_assignee_ids: [ctx.assignee.id, ctx.deleted_assignee.id, ctx.assignee.id, missing_id, ctx.creator.id],
        removed_assignee_ids: [ctx.deleted_assignee.id, missing_id, ctx.creator.id, ctx.deleted_assignee.id]
      })

    legacy = insert_activity(ctx, %{old_assignee_id: ctx.deleted_assignee.id, new_assignee_id: ctx.assignee.id})
    empty = insert_activity(ctx, %{added_assignee_ids: [], removed_assignee_ids: []})
    null = insert_activity(ctx, %{added_assignee_ids: nil, removed_assignee_ids: nil})
    activities = [arrays, legacy, empty, null]
    loaded = load_activities(activities)

    {serialized, queries} = measure_people_queries(fn -> ActivitySerializer.serialize(loaded) end)
    assert queries == []

    [arrays_output, legacy_output, empty_output, null_output] = Enum.map(serialized, & &1.content)
    assert arrays_output.added_assignees == Enum.map([ctx.assignee, ctx.deleted_assignee, ctx.assignee, ctx.creator], &Serializer.serialize/1)
    assert arrays_output.removed_assignees == Enum.map([ctx.deleted_assignee, ctx.creator, ctx.deleted_assignee], &Serializer.serialize/1)
    assert legacy_output.old_assignee == Serializer.serialize(ctx.deleted_assignee)
    assert legacy_output.new_assignee == Serializer.serialize(ctx.assignee)

    for output <- [legacy_output, empty_output, null_output] do
      assert output.added_assignees == []
      assert output.removed_assignees == []
    end

    for activity <- activities do
      assert Repo.get!(Activity, activity.id).content == activity.content
    end
  end

  test "loaded assignee lists are excluded from built activity payloads", ctx do
    content =
      Activities.build_content!("task_assignee_updating", %{
        company_id: ctx.company.id,
        space_id: ctx.space.id,
        task_id: ctx.task.id,
        added_assignee_ids: [ctx.assignee.id],
        removed_assignee_ids: [],
        added_assignees: [ctx.assignee],
        removed_assignees: [ctx.creator]
      })

    assert content.added_assignee_ids == [ctx.assignee.id]
    assert content.removed_assignee_ids == []
    refute Map.has_key?(content, :added_assignees)
    refute Map.has_key?(content, :removed_assignees)
  end

  defp insert_activity(ctx, changes) do
    content = Map.merge(%{company_id: ctx.company.id, space_id: ctx.space.id, task_id: ctx.task.id}, changes)

    Repo.insert!(%Activity{
      action: "task_assignee_updating",
      author_id: ctx.creator.id,
      access_context_id: ctx.space.access_context.id,
      content: content
    })
    |> then(&Repo.get!(Activity, &1.id))
  end

  defp load_activities(activities) do
    activities
    |> Repo.preload([:author, :comment_thread])
    |> Enum.map(&Activities.cast_content/1)
    |> Preloader.preload()
  end

  defp load_and_serialize(activities), do: activities |> load_activities() |> ActivitySerializer.serialize()

  defp measure_people_queries(fun) do
    handler_id = {__MODULE__, make_ref()}
    caller = self()

    :telemetry.attach(
      handler_id,
      [:operately, :repo, :query],
      fn _, _, metadata, _ ->
        if self() == caller && metadata.source == "people" do
          send(caller, {:person_query, handler_id, Map.take(metadata, [:cast_params])})
        end
      end,
      nil
    )

    try do
      result = fun.()
      {result, collect_people_queries(handler_id)}
    after
      :telemetry.detach(handler_id)
    end
  end

  defp collect_people_queries(handler_id) do
    receive do
      {:person_query, ^handler_id, metadata} -> [metadata | collect_people_queries(handler_id)]
    after
      0 -> []
    end
  end
end
