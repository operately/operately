defmodule Operately.Operations.CompanyDeleting do
  alias Operately.Repo
  alias Operately.Companies.Company
  import Ecto.Query

  def run(%Company{} = company) do
    Repo.transaction(fn ->
      delete_project_tasks(company)

      case Repo.delete(company) do
        {:ok, res} -> res
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
  end

  def run(company_id) do
    case Operately.Repo.get(Company, company_id) do
      nil -> {:error, :not_found}
      company -> run(company)
    end
  end

  # The extra step to delete tasks is necessary to avoid cascade deletion constraint errors
  defp delete_project_tasks(company) do
    Operately.Tasks.Task
    |> join(:left, [t], p in Operately.Projects.Project, on: p.id == t.project_id, as: :project)
    |> join(:left, [t], s in Operately.Groups.Group, on: s.id == t.space_id, as: :space)
    |> where([project: p, space: s], p.company_id == ^company.id or s.company_id == ^company.id)
    |> Repo.all()
    |> Enum.each(fn t ->
      {:ok, _} = Repo.delete(t)
    end)
  end
end
