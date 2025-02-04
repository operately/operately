defmodule Operately.Assignments.Assignment do
  @enforce_keys [:resource_id, :name, :due, :type, :path]
  defstruct [
    :resource_id,
    :name,
    :due,
    :type,
    :path,
    :url,
    :author_id,
    :author_name,
    :management_hierarchy
  ]

  def build(assignments, company, reports \\ [])

  def build(assingments, company, reports) when is_list(assingments) do
    Enum.map(assingments, fn a -> build(a, company, reports) end)
  end

  def build(assignment, company, reports) do
    Operately.Assignments.Reviewable.to_assignment(assignment, company, reports)
  end
end
