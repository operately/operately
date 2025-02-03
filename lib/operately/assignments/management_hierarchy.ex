defmodule Operately.Assignments.ManagementHierarchy do
  alias Operately.Goals.{Goal, Update}
  alias Operately.Projects.{CheckIn, Project}

  def find(assignment, reports) do
    reviewer_id = reviewer_id(assignment)
    get_hierarchy(reviewer_id, reports)
  end

  defp get_hierarchy(person_id, reports) do
    people = Enum.map(reports, fn {person, _depth} -> person end)
    get_hierarchy(person_id, people, [])
  end

  defp get_hierarchy(person_id, people, acc) do
    case Enum.find(people, &(&1.id == person_id)) do
      nil -> acc
      person -> get_hierarchy(person.manager_id, people, [person | acc])
    end
  end

  defp reviewer_id(resource = %Project{}), do: resource.reviewer.id
  defp reviewer_id(resource = %Goal{}), do: resource.reviewer_id
  defp reviewer_id(resource = %CheckIn{}), do: resource.project.reviewer.id
  defp reviewer_id(resource = %Update{}), do: resource.goal.reviewer_id
end
