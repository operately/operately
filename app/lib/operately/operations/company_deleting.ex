defmodule Operately.Operations.CompanyDeleting do
  alias Operately.Repo
  alias Operately.Companies.Company
  alias Operately.Messages.{Message, MessagesBoard}
  import Ecto.Query

  def run(%Company{} = company) do
    Repo.transaction(fn ->
      delete_project_tasks(company)
      delete_space_discussions(company)

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

  # Extra step to delete tasks necessary to avoid cascade deletion constraint errors
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

  # Extra step to delete discussions necessary to avoid cascade deletion constraint errors
  defp delete_space_discussions(company) do
    board_ids =
      from(b in MessagesBoard,
        join: s in Operately.Groups.Group,
        on: s.id == b.space_id,
        where: s.company_id == ^company.id,
        select: b.id
      )
      |> Repo.all()

    message_ids =
      from(m in Message,
        where: m.messages_board_id in ^board_ids,
        select: m.id
      )
      |> Repo.all()

    {_count, comment_ids} = Operately.Updates.delete_comments(message_ids)
    {_count, _reaction_ids} = Operately.Updates.delete_reactions(message_ids ++ comment_ids)

    from(b in MessagesBoard, where: b.id in ^board_ids)
    |> Repo.delete_all()
  end
end
