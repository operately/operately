defmodule OperatelyWeb.Api.Mutations.EditGoalDiscussion do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Ecto.Query, only: [from: 2, preload: 2]
  import Operately.Access.Filters, only: [filter_by_edit_access: 2, forbidden_or_not_found: 2]

  inputs do
    field :activity_id, :string
    field :title, :string
    field :message, :string
  end

  def call(conn, inputs) do
    author = me(conn)
    {:ok, activity_id} = decode_id(inputs.activity_id)

    case load_activity(author, activity_id) do
      nil ->
        query(activity_id)
        |> forbidden_or_not_found(author.id)

      activity ->
        {:ok, _} = Operately.Operations.GoalDiscussionEditing.run(author, activity, inputs)
        {:ok, %{}}
    end
  end

  defp load_activity(author, activity_id) do
    query(activity_id)
    |> preload(:comment_thread)
    |> filter_by_edit_access(author.id)
    |> Repo.one()
  end

  defp query(activity_id) do
    from(a in Operately.Activities.Activity, where: a.id == ^activity_id)
  end
end
