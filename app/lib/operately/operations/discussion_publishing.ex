defmodule Operately.Operations.DiscussionPublishing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Messages.Message

  def run(creator, discussion) do
    Multi.new()
    |> Multi.update(:message, Message.changeset(discussion, %{state: :published, scheduled_at: nil}))
    |> maybe_cancel_oban_job(discussion)
    |> Activities.insert_sync(creator.id, :discussion_posting, fn _changes -> %{
      company_id: creator.company_id,
      space_id: discussion.space.id,
      discussion_id: discussion.id,
      title: discussion.title,
    } end)
    |> Repo.transaction()
    |> Repo.extract_result(:message)
  end

  defp maybe_cancel_oban_job(multi, discussion) do
    if discussion.state == :scheduled do
      Multi.delete_all(multi, :delete_oban_job, fn _ ->
        import Ecto.Query

        from j in Oban.Job,
          where: j.worker == "Operately.AsyncPublishing.Worker",
          where: fragment("args->>'type' = ?", "message"),
          where: fragment("args->>'id' = ?", ^discussion.id)
      end)
    else
      multi
    end
  end
end
