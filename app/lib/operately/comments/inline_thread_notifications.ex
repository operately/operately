defmodule Operately.Comments.InlineThreadNotifications do
  import Ecto.Query
  alias Operately.{Repo, ResourceHubs}
  alias Operately.Comments.InlineThread
  alias Operately.Updates.Comment

  def recipients(activity) do
    thread_id = activity.content["inline_thread_id"]

    with {:ok, thread} <- InlineThread.get(:system, id: thread_id),
         true <- Repo.exists?(from c in Comment, where: c.id == ^activity.content["comment_id"] and c.entity_id == ^thread.id and c.entity_type == :inline_thread) do
      ResourceHubs.Notifications.get_document_subscribers(thread.resource_id)
      |> Enum.uniq()
      |> Enum.reject(&(&1 == activity.author_id))
      |> Enum.filter(&match?({:ok, _}, InlineThread.get(&1, id: thread.id)))
    else
      _ -> []
    end
  end
end
