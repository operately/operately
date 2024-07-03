defmodule OperatelyWeb.Graphql.Mutations.Projects do
  use Absinthe.Schema.Notation

  input_object :create_project_input do
    field :space_id, non_null(:id)
    field :name, non_null(:string)
    field :champion_id, non_null(:id)
    field :reviewer_id, non_null(:id)
    field :visibility, non_null(:string)
    field :creator_is_contributor, non_null(:string)
    field :creator_role, :string
    field :goal_id, :id
  end

  input_object :add_key_resource_input do
    field :project_id, non_null(:id)
    field :title, non_null(:string)
    field :link, non_null(:string)
    field :resource_type, non_null(:string)
  end

  input_object :edit_key_resource_input do
    field :id, non_null(:id)
    field :title, non_null(:string)
    field :link, non_null(:string)
  end

  input_object :milestone_update_input do
    field :id, non_null(:id)
    field :title, non_null(:string)
    field :description, :string
    field :due_time, non_null(:date)
  end

  input_object :new_milestone_input do
    field :title, non_null(:string)
    field :description, :string
    field :due_time, non_null(:date)
  end

  input_object :edit_project_timeline_input do
    field :project_id, non_null(:id)

    field :project_start_date, :date
    field :project_due_date, :date

    field :milestone_updates, list_of(:milestone_update_input)
    field :new_milestones, list_of(:new_milestone_input)
  end

  input_object :edit_project_name_input do
    field :project_id, non_null(:id)
    field :name, non_null(:string)
  end

  input_object :close_project_input do
    field :project_id, non_null(:id)
    field :retrospective, non_null(:string)
  end

  input_object :pause_project_input do
    field :project_id, non_null(:string)
  end

  input_object :resume_project_input do
    field :project_id, non_null(:string)
  end

  object :project_mutations do
    field :resume_project, non_null(:project) do
      arg :input, non_null(:resume_project_input)

      resolve fn %{input: input}, %{context: context} ->
        author = context.current_account.person
        project_id = input.project_id

        Operately.Operations.ProjectResuming.run(author, project_id)
      end
    end

    field :pause_project, non_null(:project) do
      arg :input, non_null(:pause_project_input)

      resolve fn %{input: input}, %{context: context} ->
        author = context.current_account.person
        project_id = input.project_id

        Operately.Operations.ProjectPausing.run(author, project_id)
      end
    end

    field :close_project, non_null(:project) do
      arg :input, non_null(:close_project_input)

      resolve fn args, %{context: context} ->
        author = context.current_account.person
        project = Operately.Projects.get_project!(args.input.project_id)

        Operately.Operations.ProjectClosed.run(author, project, args.input.retrospective)
      end
    end

    field :edit_project_name, non_null(:project) do
      arg :input, non_null(:edit_project_name_input)

      resolve fn args, %{context: context} ->
        author = context.current_account.person
        project = Operately.Projects.get_project!(args.input.project_id)
        Operately.Projects.rename_project(author, project, args.input.name)
      end
    end

    field :edit_project_timeline, non_null(:project) do
      arg :input, non_null(:edit_project_timeline_input)

      resolve fn args, %{context: context} ->
        author = context.current_account.person
        project = Operately.Projects.get_project!(args.input.project_id)

        attrs = %{
          project_id: args.input.project_id,

          project_start_date: parse_date(args.input.project_start_date),
          project_due_date: parse_date(args.input.project_due_date),

          milestone_updates: Enum.map(args.input.milestone_updates, fn update ->
            %{
              milestone_id: update.id,
              title: update.title,
              description: update[:description] && Jason.decode!(update.description),
              due_time: parse_date(update.due_time)
            }
          end),

          new_milestones: Enum.map(args.input.new_milestones, fn milestone ->
            %{
              title: milestone.title,
              description: milestone[:description] && Jason.decode!(milestone.description),
              due_time: parse_date(milestone.due_time)
            }
          end)
        }

        Operately.Projects.EditTimelineOperation.run(author, project, attrs)
      end
    end

    field :create_project, non_null(:project) do
      arg :input, non_null(:create_project_input)

      resolve fn args, %{context: context} ->
        person = context.current_account.person

        %Operately.Operations.ProjectCreation{
          name: args.input.name,
          champion_id: args.input.champion_id,
          reviewer_id: args.input.reviewer_id,
          creator_is_contributor: args.input[:creator_is_contributor],
          creator_role: args.input[:creator_role],
          visibility: args.input.visibility,
          creator_id: person.id,
          company_id: person.company_id,
          group_id: args.input.space_id,
          goal_id: args.input[:goal_id]
        }
        |> Operately.Projects.create_project()
      end
    end

    field :add_key_resource, non_null(:project_key_resource) do
      arg :input, non_null(:add_key_resource_input)

      resolve fn args, _ ->
        Operately.Projects.create_key_resource(args.input)
      end
    end

    field :edit_key_resource, non_null(:project_key_resource) do
      arg :input, non_null(:edit_key_resource_input)

      resolve fn args, _ ->
        resource = Operately.Projects.get_key_resource!(args.input.id)

        Operately.Projects.update_key_resource(resource, args.input)
      end
    end

    field :remove_key_resource, non_null(:project_key_resource) do
      arg :id, non_null(:id)

      resolve fn args, _ ->
        resource = Operately.Projects.get_key_resource!(args.id)
        Operately.Projects.delete_key_resource(resource)
      end
    end

    field :update_project_description, non_null(:project) do
      arg :project_id, non_null(:id)
      arg :description, :string

      resolve fn args, _ ->
        project = Operately.Projects.get_project!(args.project_id)

        Operately.Projects.update_project(project, %{description: Jason.decode!(args.description)})
      end
    end

    field :set_project_start_date, non_null(:project) do
      arg :project_id, non_null(:id)
      arg :start_date, :date

      resolve fn args, %{context: context} ->
        Operately.Repo.transaction(fn ->
          person = context.current_account.person
          project = Operately.Projects.get_project!(args.project_id)
          history = Operately.Projects.find_first_phase_history(args.project_id)
          old_start_date = project.started_at

          {:ok, project} = Operately.Projects.update_project(project, %{started_at: parse_date(args.start_date)})
          {:ok, _} = Operately.Projects.update_phase_history(history, %{start_time: parse_date(args.start_date)})
          {:ok, _} = Operately.Updates.record_project_start_time_changed(
            person, 
            project, 
            old_start_date,
            parse_date(args.start_date)
          )

          project
        end)
      end
    end

    field :set_project_due_date, non_null(:project) do
      arg :project_id, non_null(:id)
      arg :due_date, :date

      resolve fn args, %{context: context} ->
        Operately.Repo.transaction(fn ->
          person = context.current_account.person
          project = Operately.Projects.get_project!(args.project_id)

          {:ok, project} = Operately.Projects.update_project(project, %{deadline: parse_date(args.due_date)})
          old_due_date = project.deadline

          {:ok, _} = Operately.Updates.record_project_end_time_changed(
            person, 
            project, 
            old_due_date,
            parse_date(args.due_date)
          )

          project
        end)
      end
    end

    #
    # Contributors
    #

    field :add_project_contributor, non_null(:project_contributor) do
      arg :project_id, non_null(:id)
      arg :person_id, non_null(:id)
      arg :responsibility, non_null(:string)
      arg :role, non_null(:string)

      resolve fn args, %{context: context} ->
        person = context.current_account.person

        Operately.Operations.ProjectContributorAddition.run(person, %{
          project_id: args.project_id,
          person_id: args.person_id,
          responsibility: args.responsibility,
          role: args.role
        })
      end
    end

    field :update_project_contributor, non_null(:project_contributor) do
      arg :contrib_id, non_null(:id)
      arg :person_id, non_null(:id)
      arg :responsibility, non_null(:string)

      resolve fn args, _ ->
        contrib = Operately.Projects.get_contributor!(args.contrib_id)

        Operately.Projects.update_contributor(contrib, %{
          person_id: args.person_id,
          responsibility: args.responsibility
        })
      end
    end

    field :remove_project_contributor, non_null(:project_contributor) do
      arg :contrib_id, non_null(:id)

      resolve fn args, %{context: context} ->
        person = context.current_account.person

        Operately.Repo.transaction(fn ->
          contrib = Operately.Projects.get_contributor!(args.contrib_id)

          {:ok, contrib} = Operately.Projects.delete_contributor(contrib)

          {:ok, _} = Operately.Updates.record_project_contributor_removed(
            person, 
            contrib.project_id,
            contrib
          )

          contrib
        end)
      end
    end

    field :archive_project, non_null(:project) do
      arg :project_id, non_null(:id)

      resolve fn args, %{context: context} ->
        person = context.current_account.person
        project = Operately.Projects.get_project!(args.project_id)

        Operately.Projects.archive_project(person, project)

        {:ok, project}
      end
    end

    field :connect_goal_to_project, non_null(:project) do
      arg :project_id, non_null(:id)
      arg :goal_id, non_null(:id)

      resolve fn args, %{context: context} ->
        person = context.current_account.person
        project = Operately.Projects.get_project!(args.project_id)
        goal = Operately.Goals.get_goal!(args.goal_id)

        Operately.Operations.ProjectGoalConnection.run(person, project, goal)
      end
    end

    field :disconnect_goal_from_project, non_null(:project) do
      arg :project_id, non_null(:id)
      arg :goal_id, non_null(:id)

      resolve fn args, %{context: context} ->
        person = context.current_account.person
        project = Operately.Projects.get_project!(args.project_id)
        goal = Operately.Goals.get_goal!(args.goal_id)

        Operately.Operations.ProjectGoalDisconnection.run(person, project, goal)
      end
    end

  end

  defp parse_date(date) do
    if date do
      NaiveDateTime.new!(date, ~T[00:00:00])
    else
      nil
    end
  end
end
