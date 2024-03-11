defmodule OperatelyWeb.Graphql.Types.Projects do
  use Absinthe.Schema.Notation
  import OperatelyWeb.Graphql.TypeHelpers
  
  alias Operately.Projects

  object :project_contributor do
    field :id, non_null(:id)
    field :responsibility, :string
    field :role, non_null(:string)

    assoc_field :person, non_null(:person)
  end

  object :project_key_resource do
    field :id, non_null(:id)
    field :title, non_null(:string)
    field :link, non_null(:string)
    field :resource_type, non_null(:string)
  end

  object :project do
    field :id, non_null(:id)
    field :name, non_null(:string)

    field :inserted_at, non_null(:date)
    field :updated_at, non_null(:date)

    field :started_at, :date
    field :deadline, :date
    field :next_update_scheduled_at, :date
    field :next_check_in_scheduled_at, :date
    field :private, non_null(:boolean)

    field :status, :string
    field :closed_at, :date

    json_field :retrospective, :string
    json_field :description, :string

    assoc_field :goal, :goal
    assoc_field :last_check_in, :project_check_in
    assoc_field :milestones, list_of(:milestone)
    assoc_field :contributors, list_of(:project_contributor)
    assoc_field :key_resources, list_of(:project_key_resource)

    field :is_outdated, non_null(:boolean) do
      resolve fn project, _, _ ->
        {:ok, Operately.Projects.outdated?(project)}
      end
    end

    field :space_id, non_null(:id) do
      resolve fn project, _, _ ->
        {:ok, project.group_id}
      end
    end

    field :space, non_null(:group) do
      resolve fn project, _, _ ->
        {:ok, Operately.Groups.get_group!(project.group_id)}
      end
    end

    field :my_role, :string do
      resolve fn project, _, %{context: context} ->
        person = context.current_account.person

        {:ok, Operately.Projects.get_contributor_role!(project, person.id)}
      end
    end

    field :permissions, non_null(:project_permissions) do
      resolve fn project, _, %{context: context} ->
        person = context.current_account.person

        {:ok, Operately.Projects.get_permissions(project, person)}
      end
    end

    field :next_milestone, :milestone do
      resolve fn project, _, _ ->
        {:ok, Operately.Projects.get_next_milestone(project)}
      end
    end

    field :is_pinned, non_null(:boolean) do
      resolve fn project, _, %{context: context} ->
        person = context.current_account.person

        if person.home_dashboard_id do
          pinned = Operately.Dashboards.has_panel?(person.home_dashboard_id, "pinned-project", project.id)
          {:ok, pinned}
        else
          {:ok, false}
        end
      end
    end

    field :is_archived, non_null(:boolean) do
      resolve fn project, _, _ ->
        {:ok, project.deleted_at != nil}
      end
    end

    field :archived_at, :date do
      resolve fn project, _, _ ->
        {:ok, project.deleted_at}
      end
    end

    field :champion, :person do
      resolve fn project, _, _ ->
        {:ok, Projects.get_person_by_role(project, :champion)}
      end
    end

    field :reviewer, :person do
      resolve fn project, _, _ ->
        {:ok, Projects.get_person_by_role(project, :reviewer)}
      end
    end
  end
end
