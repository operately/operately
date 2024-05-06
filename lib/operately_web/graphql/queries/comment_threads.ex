defmodule OperatelyWeb.Graphql.Queries.CommentThreads do
  use Absinthe.Schema.Notation

  object :comment_thread_queries do
    field :comment_threads, list_of(:comment_thread) do
      arg :scope_type, non_null(:string)
      arg :scope_id, non_null(:string)

      resolve fn _, args, _ ->
        if args.scope_type == "goal" do
          comment_thread_ids = ids_from_activities(args.scope_id)
          
          {:ok, comment_threads(comment_thread_ids)}
        else
          {:error, "Invalid scope type"}
        end
      end
    end
  end

  import Ecto.Query

  defp comment_threads(ids) do
    Operately.Repo.all(from ct in Operately.Comments.CommentThread, where: ct.id in ^ids, order_by: [desc: ct.inserted_at])
  end

  defp ids_from_activities(goal_id) do
    query = (
      from a in Operately.Activities.Activity,
        where: fragment("? ->>'goal_id' = ?", a.content, ^goal_id),
        where: not is_nil(a.comment_thread_id),
        where: a.action == "goal_timeframe_editing",
        select: a.comment_thread_id
    )
    
    Operately.Repo.all(query)
  end
end
