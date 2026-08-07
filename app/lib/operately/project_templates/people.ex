defmodule Operately.ProjectTemplates.People do
  @moduledoc """
  Builds the people-related read model for project templates.

  It determines whether copied template people still reference active people in
  the template's company and attaches aggregate inactive-person, affected-role,
  and affected-task counts to templates after callers apply visibility filters.
  It does not mutate template people or grant access.
  """

  import Ecto.Query, only: [from: 2]

  alias Operately.ProjectTemplates.{Person, TaskAssignment}
  alias Operately.Repo

  @empty_summary %{person_count: 0, role_count: 0, task_count: 0}

  def put_inactive_summaries([]), do: []

  def put_inactive_summaries(templates) do
    template_ids = Enum.map(templates, & &1.id)
    summaries = inactive_summaries(template_ids)

    Enum.map(templates, fn template ->
      %{template | inactive_people_summary: Map.get(summaries, template.id, @empty_summary)}
    end)
  end

  def active?(%Person{person: person}, company_id), do: active_person?(person, company_id)

  def active_person?(nil, _company_id), do: false

  def active_person?(person, company_id) do
    person.company_id == company_id and person.suspended != true and is_nil(person.suspended_at)
  end

  defp inactive_summaries(template_ids) do
    from(template_person in Person,
      join: template in assoc(template_person, :project_template),
      left_join: person in assoc(template_person, :person),
      left_join: assignment in TaskAssignment,
      on: assignment.project_template_person_id == template_person.id,
      where: template_person.project_template_id in ^template_ids,
      where:
        is_nil(person.id) or person.company_id != template.company_id or person.suspended == true or
          not is_nil(person.suspended_at),
      group_by: template_person.project_template_id,
      select: {
        template_person.project_template_id,
        %{
          person_count: count(template_person.id, :distinct),
          role_count: count(template_person.id, :distinct),
          task_count: count(assignment.project_template_task_id, :distinct)
        }
      }
    )
    |> Repo.all()
    |> Map.new()
  end
end
