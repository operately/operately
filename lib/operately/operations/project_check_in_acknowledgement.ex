defmodule Operately.Operations.ProjectCheckInAcknowledgement do
  alias Ecto.Multi

  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Projects.CheckIn

  def run(author, check_in_id) do
    check_in = Operately.Projects.get_check_in!(check_in_id)

    changeset = CheckIn.changeset(check_in, %{
      acknowledged_at: NaiveDateTime.utc_now(),
      acknowledged_by_id: author.id
    })

    Multi.new()
    |> Multi.update(:check_in, changeset)
    |> Activities.insert_sync(author.id, :project_check_in_acknowledged, fn _changes ->
      %{
        company_id: author.company_id,
        project_id: check_in.project_id,
        check_in_id: check_in.id
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:check_in)
    |> case do
      {:ok, check_in} ->
        OperatelyWeb.ApiSocket.broadcast!("api:assignments_count:#{author.id}")
        {:ok, check_in}

      error -> error
    end
  end
end
