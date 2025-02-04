defmodule Operately.Assignments.ManagementHierarchy do
  alias Operately.Assignments.Reviewable

  def find(assignment, reports) do
    reviewer_id = Reviewable.reviewer_id(assignment)
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
end
