defmodule OperatelyWeb.Api.Queries.GetAssignments do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo

  # def call() do

  # end

  def get_due_projects(person) do
    from(p in Operately.Projects.Project,
      join: a in assoc(p, :contributors),
      where: a.person_id == ^person.id and a.role == :champion,
      where: p.next_check_in_scheduled_at <= ^DateTime.utc_now(),
      where: p.status == "active",
      select: p
    )
    |> Repo.all()
  end
end
