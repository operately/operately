defmodule Operately.Operations.ProjectCreation do
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Access
  alias Operately.Access.{Binding, Context}
  alias Operately.Projects.{Project, Contributor}
  alias Ecto.Multi

  defstruct [
    :company_id,
    :name,
    :champion_id,
    :reviewer_id,
    :creator_id,
    :creator_role,
    :creator_is_contributor,
    :visibility,
    :group_id,
    :goal_id,
    :anonymous_access_level,
    :company_access_level,
    :space_access_level
  ]

  def run(%__MODULE__{} = params) do
    Multi.new()
    |> insert_project(params)
    |> insert_access_context(params)
    |> insert_champion_as_contributor(params)
    |> insert_reviewer_as_contributor(params)
    |> insert_creator_as_contributor(params)
    |> insert_bindings(params)
    |> insert_activity(params)
    |> Repo.transaction()
    |> Repo.extract_result(:project)
  end

  defp insert_project(multi, params) do
    Multi.insert(multi, :project, fn _changes ->
      Project.changeset(%{
        :company_id => params.company_id,
        :group_id => params.group_id,
        :goal_id => params.goal_id,
        :name => params.name,
        :private => is_private(params.visibility),
        :creator_id => params.creator_id,
        :started_at => DateTime.utc_now(),
        :next_check_in_scheduled_at => Operately.Time.first_friday_from_today(),
        :health => :on_track,
      })
    end)
  end

  defp insert_access_context(multi, _params) do
    Multi.insert(multi, :context, fn changes ->
      Context.changeset(%{project_id: changes.project.id})
    end)
  end

  defp insert_champion_as_contributor(multi, params) do
    Multi.insert(multi, :champion, fn changes ->
      Contributor.changeset(%{
        project_id: changes.project.id,
        person_id: params.champion_id,
        responsibility: " ",
        role: :champion
      })
    end)
  end

  defp insert_reviewer_as_contributor(multi, params) do
    if params.reviewer_id do
      Multi.insert(multi, :reviewer, fn changes ->
        Contributor.changeset(%{
          project_id: changes.project.id,
          person_id: params.reviewer_id,
          responsibility: " ",
          role: :reviewer
        })
      end)
    else
      multi
    end
  end

  defp insert_creator_as_contributor(multi, params) do
    if is_creator_a_contributor?(params) do
      Multi.insert(multi, :creator, fn changes ->
        Contributor.changeset(%{
          project_id: changes.project.id,
          person_id: params.creator_id,
          responsibility: params.creator_role,
          role: :contributor
        })
      end)
    else
      multi
    end
  end

  defp insert_bindings(multi, params) do
    full_access = Access.get_group!(company_id: params.company_id, tag: :full_access)
    standard = Access.get_group!(company_id: params.company_id, tag: :standard)
    space_full_access = Access.get_group!(group_id: params.group_id, tag: :full_access)
    space_standard = Access.get_group!(group_id: params.group_id, tag: :standard)
    champion_group = Access.get_group!(person_id: params.champion_id)

    multi
    |> Access.maybe_insert_anonymous_binding(params.company_id, params.anonymous_access_level)
    |> Access.insert_binding(:company_full_access_binding, full_access, Binding.full_access())
    |> Access.insert_binding(:company_members_binding, standard, params.company_access_level)
    |> Access.insert_binding(:space_full_access_binding, space_full_access, Binding.full_access())
    |> Access.insert_binding(:space_members_binding, space_standard, params.space_access_level)
    |> Access.insert_binding(:champion_binding, champion_group, Binding.full_access(), :champion)
    |> insert_binding_for_reviewer(params)
    |> insert_binding_for_creator(params)
  end

  defp insert_binding_for_creator(multi, params) do
    if is_creator_a_contributor?(params) do
      group = Access.get_group!(person_id: params.creator_id)
      Access.insert_binding(multi, :creator_binding, group, Binding.full_access())
    else
      multi
    end
  end

  defp insert_binding_for_reviewer(multi, params) do
    if params.reviewer_id do
      group = Access.get_group!(person_id: params.reviewer_id)
      Access.insert_binding(multi, :reviewer_binding, group, Binding.full_access(), :reviewer)
    else
      multi
    end
  end

  defp insert_activity(multi, params) do
    Activities.insert_sync(multi, params.creator_id, :project_created, fn changes ->
      %{
        company_id: changes.project.company_id,
        project_id: changes.project.id
      }
    end)
  end

  defp is_creator_a_contributor?(%__MODULE__{} = params) do
    cond do
      params.champion_id == params.creator_id -> false
      params.reviewer_id == params.creator_id -> false
      params.creator_is_contributor == "no" -> false
      params.creator_is_contributor == "yes" -> true
      true -> false
    end
  end

  defp is_private(visibility) do
    visibility != "everyone"
  end
end
