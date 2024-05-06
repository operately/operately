defmodule OperatelyWeb.Graphql.Queries.CommentThreads do
  use Absinthe.Schema.Notation

  object :comment_thread_queries do
    field :comment_threads, list_of(:comment_thread) do
      arg :scope_type, non_null(:string)
      arg :scope_id, non_null(:string)

      resolve fn _, args, _ ->
        if args.scope_type == "goal" do
          comment_thread_ids = ids_from_activities(args.scope_id)
        else
          {:error, "Invalid scope type"}
        end
      end
    end
  end

  defp ids_from_activities(goal_id) do
    import Ecto.Query

    query = from a in Operately.Activities.Activity
    query = from a in query, where: fragment("a.content->>'goal_id' == ?", ^goal_id)
    query = from a in query, where: not is_nil(a.comment_thread_id)
    query = from a in query, select: a.action == "goal_timeframe_editing"
    query = from a in query, select: a.comment_thread_id
    
    Operately.Repo.all(query)
  end
end
