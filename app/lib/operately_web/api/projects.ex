defmodule OperatelyWeb.Api.Projects do
  alias __MODULE__.SharedMultiSteps, as: Steps

  defmodule UpdateDueDate do
    use TurboConnect.Mutation

    inputs do
      field :project_id, :id, null: false
      field :due_date, :contextual_date, null: true
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id)
      |> Steps.check_permissions(:can_edit_timeline)
      |> Steps.update_project_due_date(inputs.due_date)
      |> Steps.save_activity(:project_due_date_updating, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          old_due_date: Operately.ContextualDates.Timeframe.end_date(changes.project.timeframe),
          new_due_date: Operately.ContextualDates.Timeframe.end_date(changes.updated_project.timeframe)
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule UpdateStartDate do
    use TurboConnect.Mutation

    inputs do
      field :project_id, :id, null: false
      field :start_date, :contextual_date, null: true
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id)
      |> Steps.check_permissions(:can_edit_timeline)
      |> Steps.update_project_start_date(inputs.start_date)
      |> Steps.save_activity(:project_start_date_updating, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          old_start_date: Operately.ContextualDates.Timeframe.start_date(changes.project.timeframe),
          new_start_date: Operately.ContextualDates.Timeframe.start_date(changes.updated_project.timeframe)
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule SharedMultiSteps do
    require Logger

    def start_transaction(conn) do
      Ecto.Multi.new()
      |> Ecto.Multi.put(:conn, conn)
      |> Ecto.Multi.run(:me, fn _repo, %{conn: conn} ->
        {:ok, conn.assigns.current_person}
      end)
    end

    def find_project(multi, project_id) do
      Ecto.Multi.run(multi, :project, fn _repo, %{me: me} ->
        case Operately.Projects.Project.get(me, id: project_id, opts: [preload: [:access_context]]) do
          {:ok, project} -> {:ok, project}
          {:error, _} -> {:error, {:not_found, "Project not found"}}
        end
      end)
    end

    def check_permissions(multi, permission) do
      Ecto.Multi.run(multi, :permissions, fn _repo, %{project: project} ->
        Operately.Projects.Permissions.check(project.request_info.access_level, permission)
      end)
    end

    def update_project_due_date(multi, new_due_date) do
      Ecto.Multi.update(multi, :updated_project, fn %{project: project} ->
        cond do
          new_due_date == nil && project.timeframe == nil ->
            Operately.Projects.Project.changeset(project, %{timeframe: nil})

          project.timeframe == nil ->
            Operately.Projects.Project.changeset(project, %{
              timeframe: %{
                contextual_start_date: nil,
                contextual_end_date: new_due_date
              }
            })

          true ->
            Operately.Projects.Project.changeset(project, %{
              timeframe: %{
                contextual_start_date: project.timeframe.contextual_start_date,
                contextual_end_date: new_due_date
              }
            })
        end
      end)
    end

    def update_project_start_date(multi, new_start_date) do
      Ecto.Multi.update(multi, :updated_project, fn %{project: project} ->
        cond do
          new_start_date == nil && project.timeframe == nil ->
            Operately.Projects.Project.changeset(project, %{timeframe: nil})

          project.timeframe == nil ->
            Operately.Projects.Project.changeset(project, %{
              timeframe: %{
                contextual_start_date: new_start_date,
                contextual_end_date: nil
              }
            })

          true ->
            Operately.Projects.Project.changeset(project, %{
              timeframe: %{
                contextual_start_date: new_start_date,
                contextual_end_date: project.timeframe.contextual_end_date
              }
            })
        end
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
          {:error, :not_found}

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
