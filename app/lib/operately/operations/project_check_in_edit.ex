defmodule Operately.Operations.ProjectCheckInEdit do
  alias Ecto.Multi

  alias Operately.{Repo, Activities, Time}
  alias Operately.Drafts
  alias Operately.Projects.Project
  alias Operately.Projects.CheckIn
  alias Operately.Notifications.SubscriptionList

  def run(author, check_in, attrs) do
    project = Operately.Projects.get_project!(check_in.project_id)

    next_check_in =
      Operately.Time.calculate_next_weekly_check_in(
        project.next_check_in_scheduled_at,
        DateTime.utc_now()
      )

    Multi.new()
    |> set_if_full_edit_allowed(project, check_in)
    |> update_check_in(check_in, attrs)
    |> maybe_update_project(project, check_in, next_check_in)
    |> Multi.run(:subscription_list, fn _, changes ->
      SubscriptionList.get(:system,
        parent_id: changes.check_in.id,
        opts: [
          preload: :subscriptions
        ]
      )
    end)
    |> Operately.Operations.Notifications.Subscription.update_mentioned_people(attrs.description)
    |> record_activity(author, project, check_in, attrs)
    |> handle_oban_jobs(check_in, attrs)
    |> Repo.transaction()
    |> Repo.extract_result(:check_in)
    |> broadcast_if_published(author)
  end

  #
  # Edits to the status are allowed within 3 days of the check-in display date
  # and only if it is the latest check-in. Otherwise, only the description can
  # be edited.
  #
  defp set_if_full_edit_allowed(multi, project, check_in) do
    edit_start = Drafts.display_date(check_in)
    edit_deadline = DateTime.add(edit_start, 3, :day)

    is_latest = project.last_check_in_id == check_in.id
    is_in_edit_deadline = DateTime.compare(Time.utc_datetime_now(), edit_deadline) == :lt

    Multi.put(multi, :full_edit_allowed, check_in.state in [:draft, :scheduled] or (is_latest and is_in_edit_deadline))
  end

  defp update_check_in(multi, check_in, attrs) do
    Multi.update(multi, :check_in, fn changes ->
      if changes.full_edit_allowed do
        CheckIn.changeset(check_in, %{
          status: attrs.status,
          description: attrs.description,
          state: state(check_in, attrs),
          scheduled_at: scheduled_at(check_in, attrs)
        })
      else
        CheckIn.changeset(check_in, %{
          description: attrs.description,
          state: state(check_in, attrs)
        })
      end
    end)
  end

  defp maybe_update_project(multi, project, check_in, next_check_in) do
    Multi.update(multi, :project, fn changes ->
      cond do
        changes.check_in.state in [:draft, :scheduled] ->
          Project.changeset(project, %{})

        check_in.state in [:draft, :scheduled] ->
          Project.changeset(project, %{
            last_check_in_id: changes.check_in.id,
            last_check_in_status: changes.check_in.status,
            next_check_in_scheduled_at: next_check_in
          })

        changes.full_edit_allowed ->
          Project.changeset(project, %{
            last_check_in_status: changes.check_in.status
          })

        true ->
          Project.changeset(project, %{})
      end
    end)
  end

  defp record_activity(multi, author, project, %{state: old_state}, %{state: :published}) when old_state in [:draft, :scheduled] do
    Activities.insert_sync(multi, author.id, :project_check_in_submitted, fn changes ->
      %{
        company_id: project.company_id,
        space_id: project.group_id,
        project_id: project.id,
        check_in_id: changes.check_in.id
      }
    end)
  end

  defp record_activity(multi, _author, _project, %{state: old_state}, attrs) when old_state in [:draft, :scheduled] do
    new_state = attrs[:state] || old_state

    if new_state in [:draft, :scheduled] do
      multi
    else
      # Covered by the published clause
      multi
    end
  end

  defp record_activity(multi, author, project, _check_in, _attrs) do
    Activities.insert_sync(multi, author.id, :project_check_in_edit, fn changes ->
      %{
        company_id: project.company_id,
        project_id: changes.project.id,
        check_in_id: changes.check_in.id
      }
    end)
  end

  defp state(check_in, attrs) do
    cond do
      not is_nil(attrs[:state]) -> attrs[:state]
      not is_nil(attrs[:scheduled_at]) -> :scheduled
      true -> check_in.state
    end
  end

  defp scheduled_at(check_in, attrs) do
    cond do
      not is_nil(attrs[:scheduled_at]) -> attrs[:scheduled_at]
      attrs[:state] in [:draft, :published] -> nil
      true -> check_in.scheduled_at
    end
  end

  defp handle_oban_jobs(multi, check_in, attrs) do
    new_state = state(check_in, attrs)
    new_time = scheduled_at(check_in, attrs)

    if check_in.state == :scheduled or new_state == :scheduled do
      multi
      |> Multi.delete_all(:delete_oban_job, fn _ ->
        import Ecto.Query

        from j in Oban.Job,
          where: j.worker == "Operately.AsyncPublishing.Worker",
          where: fragment("args->>'type' = ?", "project_check_in"),
          where: fragment("args->>'id' = ?", ^check_in.id)
      end)
      |> Multi.run(:insert_oban_job, fn _repo, changes ->
        if new_state == :scheduled and not is_nil(new_time) do
          Operately.AsyncPublishing.Worker.new(
            %{"type" => "project_check_in", "id" => changes.check_in.id},
            scheduled_at: new_time
          )
          |> Oban.insert()
        else
          {:ok, nil}
        end
      end)
    else
      multi
    end
  end

  defp broadcast_if_published({:ok, check_in}, author) do
    if check_in.state == :published do
      OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: author.id)
    end

    {:ok, check_in}
  end

  defp broadcast_if_published(error, _author), do: error
end
