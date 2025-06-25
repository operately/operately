defmodule Operately.Data.Change063SetProjectSuccessStatus do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Projects.Project

  def run do
    from(p in Project, where: not is_nil(p.closed_at), where: is_nil(p.success_status))
    |> Repo.update_all(set: [success_status: "achieved"])
  end
end
