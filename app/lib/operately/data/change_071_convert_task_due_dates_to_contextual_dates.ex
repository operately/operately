defmodule Operately.Data.Change071ConvertTaskDueDatesToContextualDates do
  import Ecto.Query, only: [from: 2]
  alias Operately.Repo
  alias Operately.Tasks.Task

  def run do
    Repo.transaction(fn ->
      from(t in Task,
        where: not is_nil(t.deprecated_due_date)
      )
      |> Repo.all()
      |> Enum.each(&update_task/1)
    end)
  end

  defp update_task(task) do
    contextual_due_date = create_contextual_date_from_naive_datetime(task.deprecated_due_date)

    Repo.update_all(
      from(t in Task, where: t.id == ^task.id),
      set: [due_date: contextual_due_date]
    )
  end

  defp create_contextual_date_from_naive_datetime(naive_datetime) do
    naive_datetime
    |> NaiveDateTime.to_date()
    |> Operately.ContextualDates.ContextualDate.create_day_date()
  end
end
