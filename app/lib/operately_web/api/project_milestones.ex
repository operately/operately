defmodule OperatelyWeb.Api.ProjectMilestones do
  alias __MODULE__.SharedMultiSteps, as: Steps
  alias OperatelyWeb.Api.Serializer

   defmodule ListTasks do
    use TurboConnect.Query

    inputs do
      field :milestone_id, :id, null: false
    end

    outputs do
      field :tasks, list_of(:task), null: false
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_milestone(inputs.milestone_id)
      |> Steps.check_permissions(:can_view)
      |> Steps.get_milestone_tasks()
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{tasks: Serializer.serialize(changes.tasks, level: :full)}
      end)
    end
  end

  defmodule UpdateTitle do
    use TurboConnect.Mutation

    inputs do
      field :milestone_id, :id, null: false
      field :title, :string, null: false
    end

    outputs do
      field :milestone, :milestone
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_milestone(inputs.milestone_id)
      |> Steps.check_permissions(:can_edit_timeline)
      |> Steps.update_milestone_title(inputs.title)
      |> Steps.save_activity(:milestone_title_updating, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          milestone_id: changes.milestone.id,
          old_title: changes.milestone.title,
          new_title: changes.updated_milestone.title,
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{milestone: Serializer.serialize(changes.updated_milestone)}
      end)
    end
  end

  defmodule UpdateDescription do
    use TurboConnect.Mutation

    inputs do
      field :milestone_id, :id, null: false
      field :description, :json, null: false
    end

    outputs do
      field :milestone, :milestone
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_milestone(inputs.milestone_id)
      |> Steps.check_permissions(:can_edit_timeline)
      |> Steps.update_milestone_description(inputs.description)
      |> Steps.save_activity(:milestone_description_updating, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          milestone_id: changes.milestone.id,
          milestone_name: changes.milestone.title,
          has_description: Operately.RichContent.empty?(inputs.description)
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{milestone: Serializer.serialize(changes.updated_milestone)}
      end)
    end
  end

  defmodule UpdateDueDate do
    use TurboConnect.Mutation

    inputs do
      field :milestone_id, :id, null: false
      field :due_date, :contextual_date, null: true
    end

    outputs do
      field :milestone, :milestone
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_milestone(inputs.milestone_id)
      |> Steps.check_permissions(:can_edit_timeline)
      |> Steps.update_milestone_due_date(inputs.due_date)
      |> Steps.save_activity(:milestone_due_date_updating, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          milestone_id: changes.milestone.id,
          milestone_name: changes.milestone.title,
          old_due_date: changes.milestone.timeframe && changes.milestone.timeframe.contextual_end_date,
          new_due_date: inputs.due_date,
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{milestone: Serializer.serialize(changes.updated_milestone)}
      end)
    end
  end

  defmodule Delete do
    use TurboConnect.Mutation

    inputs do
      field :milestone_id, :id, null: false
    end

    outputs do
      field :success, :boolean
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_milestone(inputs.milestone_id)
      |> Steps.check_permissions(:can_edit_timeline)
      |> Steps.save_activity(:milestone_deleting, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          milestone_id: changes.milestone.id,
          milestone_name: changes.milestone.title,
        }
      end)
      |> Steps.delete_milestone()
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule SharedMultiSteps do
    import Ecto.Query, only: [from: 2]
    require Logger

    def start_transaction(conn) do
      Ecto.Multi.new()
      |> Ecto.Multi.put(:conn, conn)
      |> Ecto.Multi.run(:me, fn _repo, %{conn: conn} ->
        {:ok, conn.assigns.current_person}
      end)
    end

    def find_milestone(multi, milestone_id) do
      Ecto.Multi.run(multi, :milestone, fn _repo, %{me: me} ->
        case Operately.Projects.Milestone.get(me, id: milestone_id, opts: [preload: [:project]]) do
          {:ok, milestone} -> {:ok, milestone}
          {:error, _} -> {:error, {:not_found, "Milestone not found"}}
        end
      end)
      |> Ecto.Multi.run(:project, fn _repo, %{milestone: milestone} ->
        {:ok, milestone.project}
      end)
    end

    def check_permissions(multi, permission) do
      Ecto.Multi.run(multi, :permissions, fn _repo, %{milestone: milestone} ->
        Operately.Projects.Permissions.check(milestone.request_info.access_level, permission)
      end)
    end

    def update_milestone_title(multi, new_title) do
      Ecto.Multi.run(multi, :validate_title, fn _repo, _changes ->
        if String.trim(new_title) == "" do
          {:error, "Title cannot be empty"}
        else
          {:ok, new_title}
        end
      end)
      |> Ecto.Multi.update(:updated_milestone, fn %{milestone: milestone} ->
        Operately.Projects.Milestone.changeset(milestone, %{title: new_title})
      end)
    end

    def update_milestone_due_date(multi, new_due_date) do
      Ecto.Multi.update(multi, :updated_milestone, fn %{milestone: milestone} ->
        cond do
          new_due_date == nil && milestone.timeframe == nil ->
            Operately.Projects.Milestone.changeset(milestone, %{timeframe: nil})

          milestone.timeframe == nil ->
            Operately.Projects.Milestone.changeset(milestone, %{
              timeframe: %{
                contextual_start_date: nil,
                contextual_end_date: new_due_date
              }
            })

          true ->
            Operately.Projects.Milestone.changeset(milestone, %{
              timeframe: %{
                contextual_start_date: milestone.timeframe.contextual_start_date,
                contextual_end_date: new_due_date
              }
            })
        end
      end)
    end

    def update_milestone_description(multi, new_description) do
      Ecto.Multi.update(multi, :updated_milestone, fn %{milestone: milestone} ->
        Operately.Projects.Milestone.changeset(milestone, %{description: new_description})
      end)
    end

    def delete_milestone(multi) do
      Ecto.Multi.run(multi, :delete_milestone, fn repo, %{milestone: milestone} ->
        case repo.delete(milestone) do
          {:ok, deleted_milestone} -> {:ok, deleted_milestone}
          {:error, changeset} -> {:error, changeset}
        end
      end)
    end

    def get_milestone_tasks(multi) do
      Ecto.Multi.run(multi, :tasks, fn _repo, %{milestone: milestone} ->
        tasks =
          from(t in Operately.Tasks.Task,
            where: t.milestone_id == ^milestone.id,
            preload: [:assigned_people, :milestone]
          )
          |> Operately.Repo.all()

        {:ok, tasks}
      end)
    end

    def save_activity(multi, activity_type, callback) do
      Ecto.Multi.merge(multi, fn changes ->
        Operately.Activities.insert_sync(Ecto.Multi.new(), changes.me.id, activity_type, fn _ -> callback.(changes) end)
      end)
    end

    def commit(multi) do
      Operately.Repo.transaction(multi)
    end

    def respond(result, ok_callback, error_callback \\ &handle_error/1) do
      case result do
        {:ok, changes} ->
          {:ok, ok_callback.(changes)}

        {:error, _, :idempotent, changes} ->
          {:ok, ok_callback.(changes)}

        e ->
          error_callback.(e)
      end
    end

    defp handle_error(reason) do
      case reason do
        {:error, _failed_operation, {:not_found, message}, _changes} ->
          {:error, :not_found, message}

        {:error, _failed_operation, :not_found, _changes} ->
          {:error, :not_found}

        {:error, _failed_operation, :forbidden, _changes} ->
          {:error, :forbidden}

        {:error, :validate_title, message, _changes} when is_binary(message) ->
          {:error, :bad_request, message}

        {:error, _failed_operation, reason, _changes} ->
          Logger.error("Transaction failed: #{inspect(reason)}")
          {:error, :internal_server_error}

        e ->
          Logger.error("Unexpected error: #{inspect(e)}")
          {:error, :internal_server_error}
      end
    end
  end
end
