defmodule Operately.AsyncPublishing.ScheduledPostPublishing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run("project_check_in", id) do
    check_in = Repo.get(Operately.Projects.CheckIn, id)
    if check_in && check_in.state == :scheduled do
      project = Repo.get!(Operately.Projects.Project, check_in.project_id)

      next_check_in = Operately.Time.calculate_next_weekly_check_in(
        project.next_check_in_scheduled_at,
        DateTime.utc_now()
      )

      Multi.new()
      |> Multi.update(:check_in, Operately.Projects.CheckIn.changeset(check_in, %{state: :published}))
      |> Multi.update(:project, fn changes ->
        Operately.Projects.Project.changeset(project, %{
          last_check_in_id: changes.check_in.id,
          last_check_in_status: changes.check_in.status,
          next_check_in_scheduled_at: next_check_in
        })
      end)
      |> Activities.insert_sync(check_in.author_id, :project_check_in_submitted, fn changes ->
        %{
          company_id: project.company_id,
          space_id: project.group_id,
          project_id: project.id,
          check_in_id: changes.check_in.id
        }
      end)
      |> Repo.transaction()
      |> Repo.extract_result(:check_in)
      |> case do
        {:ok, updated_check_in} ->
          OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: updated_check_in.author_id)
          {:ok, updated_check_in}

        error ->
          error
      end
    else
      {:ok, :skipped}
    end
  end

  def run("goal_update", id) do
    update = Repo.get(Operately.Goals.Update, id)
    if update && update.state == :scheduled do
      goal = Repo.get!(Operately.Goals.Goal, update.goal_id)

      Multi.new()
      |> Multi.update(:update, Operately.Goals.Update.changeset(update, %{state: :published}))
      |> Multi.update(:goal, fn changes ->
        Operately.Goals.Goal.changeset(goal, %{
          next_update_scheduled_at: Operately.Time.calculate_next_monthly_check_in(goal.next_update_scheduled_at, DateTime.utc_now()),
          last_check_in_id: changes.update.id,
          last_update_status: changes.update.status
        })
      end)
      |> Activities.insert_sync(update.author_id, :goal_check_in, fn changes ->
        %{
          company_id: goal.company_id,
          space_id: goal.group_id,
          goal_id: goal.id,
          update_id: changes.update.id,
          old_timeframe: goal.timeframe,
          new_timeframe: changes.update.timeframe
        }
      end)
      |> Repo.transaction()
      |> Repo.extract_result(:update)
      |> case do
        {:ok, updated_update} ->
          OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: updated_update.author_id)
          {:ok, updated_update}

        error ->
          error
      end
    else
      {:ok, :skipped}
    end
  end

  def run("message", id) do
    message = Repo.get(Operately.Messages.Message, id) |> Repo.preload(messages_board: :space)
    if message && message.state == :scheduled do
      Multi.new()
      |> Multi.update(:message, Operately.Messages.Message.changeset(message, %{state: :published}))
      |> Activities.insert_sync(message.author_id, :discussion_posting, fn changes ->
        %{
          company_id: message.messages_board.space.company_id,
          space_id: message.messages_board.space.id,
          discussion_id: changes.message.id,
          title: changes.message.title
        }
      end)
      |> Repo.transaction()
      |> Repo.extract_result(:message)
    else
      {:ok, :skipped}
    end
  end
end
