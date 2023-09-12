defmodule Operately.Updates do
  @moduledoc """
  The Updates context.
  """

  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Updates.Update

  def list_updates do
    Repo.all(Update)
  end

  def list_updates(updatable_id, updatable_type) do
    query = from u in Update,
      where: u.updatable_id == ^updatable_id,
      where: u.updatable_type == ^updatable_type,
      order_by: [desc: u.inserted_at]

    Repo.all(query)
  end

  def get_update!(id), do: Repo.get!(Update, id)

  def create_update(attrs \\ %{}) do
    %Update{} |> Update.changeset(attrs) |> Repo.insert()
  end

  def record_status_update(author, project, new_health, content) do
    Operately.Repo.transaction(fn -> 
      {:ok, update} = create_update(%{
        updatable_type: :project,
        updatable_id: project.id,
        author_id: author.id,
        title: "",
        type: :status_update,
        content: Operately.Updates.Types.StatusUpdate.build(project, new_health, content)
      })

      {:ok, _} = Operately.Projects.update_project(project, %{
        health: new_health,
        next_update_scheduled_at: Operately.Time.first_friday_from_today()
      })

      {:ok, _} = OperatelyEmail.UpdateEmail.new(%{update_id: update.id}) |> Oban.insert()

      update
    end)
  end

  def record_review(author, project, new_phase, content) do
    Operately.Repo.transaction(fn -> 
      previous_phase = Atom.to_string(project.phase)

      {:ok, update} = create_update(%{
        updatable_type: :project,
        updatable_id: project.id,
        author_id: author.id,
        title: "",
        type: :review,
        content: Operately.Updates.Types.Review.build(content, previous_phase, new_phase)
      })

      {:ok, _} = Operately.Projects.record_phase_history(project, previous_phase, new_phase)
      {:ok, _} = Operately.Projects.update_project(project, %{phase: new_phase})

      update
    end)
  end

  def record_message(author, project, content) do
    create_update(%{
      updatable_type: :project,
      updatable_id: project.id,
      author_id: author.id,
      title: "",
      type: :message,
      content: Operately.Updates.Types.Message.build(content)
    })
  end

  def record_project_creation(creator_id, project_id, champion_id, creator_role) do
    create_update(%{
      type: :project_created,
      author_id: creator_id,
      updatable_id: project_id,
      updatable_type: :project,
      content: %{
        creator_id: creator_id,
        champion_id: champion_id,
        creator_role: creator_role
      }
    })
  end

  def record_project_start_time_changed(person, project, old_start_time, new_start_time) do
    create_update(%{
      type: :project_start_time_changed,
      author_id: person.id,
      updatable_id: project.id,
      updatable_type: :project,
      content: %{
        old_start_time: old_start_time,
        new_start_time: new_start_time
      }
    })
  end

  def record_project_end_time_changed(person, project, old_end_time, new_end_time) do
    create_update(%{
      type: :project_end_time_changed,
      author_id: person.id,
      updatable_id: project.id,
      updatable_type: :project,
      content: %{
        old_end_time: old_end_time,
        new_end_time: new_end_time
      }
    })
  end

  def record_project_contributor_added(person, project_id, contributor) do
    create_update(%{
      type: :project_contributor_added,
      author_id: person.id,
      updatable_id: project_id,
      updatable_type: :project,
      content: %{
        contributor_id: contributor.person_id,
        contributor_role: Atom.to_string(contributor.role)
      }
    })
  end

  def record_project_contributor_removed(person, project_id, contributor) do
    create_update(%{
      type: :project_contributor_removed,
      author_id: person.id,
      updatable_id: project_id,
      updatable_type: :project,
      content: %{
        contributor_id: contributor.person_id,
        contributor_role: Atom.to_string(contributor.role)
      }
    })
  end

  def record_project_milestone_creation(creator, milestone) do
    create_update(%{
      type: :project_milestone_created,
      author_id: creator.id,
      updatable_id: milestone.project_id,
      updatable_type: :project,
      content: %{
        milestone_id: milestone.id,
        milestone_title: milestone.title,
        milestone_deadline: milestone.deadline_at
      }
    })
  end

  def record_project_milestone_deleted(person, milestone) do
    create_update(%{
      type: :project_milestone_deleted,
      author_id: person.id,
      updatable_id: milestone.project_id,
      updatable_type: :project,
      content: %{
        milestone_id: milestone.id,
      }
    })
  end

  def record_project_milestone_completed(person, milestone) do
    create_update(%{
      type: :project_milestone_completed,
      author_id: person.id,
      updatable_id: milestone.project_id,
      updatable_type: :project,
      content: %{
        milestone_id: milestone.id,
        milestone_title: milestone.title,
        milestone_deadline: milestone.deadline_at
      }
    })
  end

  def record_project_milestone_deadline_changed(person, milestone, old_deadline, new_deadline) do
    create_update(%{
      type: :project_milestone_deadline_changed,
      author_id: person.id,
      updatable_id: milestone.project_id,
      updatable_type: :project,
      content: %{
        milestone_id: milestone.id,
        old_milestone_deadline: old_deadline,
        new_milestone_deadline: new_deadline
      }
    })
  end

  def publish_update_added(update) do
    Absinthe.Subscription.publish(
      OperatelyWeb.Endpoint,
      update,
      update_added: "*")
  end
  
  def acknowledge_update(person, update) do
    Repo.transaction(fn ->
      {:ok, update} = update_update(update, %{
        acknowledged: true,
        acknowledged_at: DateTime.utc_now,
        acknowledging_person_id: person.id
      })

      {:ok, _} = Operately.Activities.submit_update_acknowledged(update)

      update
    end)
  end

  def update_update(%Update{} = update, attrs) do
    update
    |> Update.changeset(attrs)
    |> Repo.update()
  end

  def delete_update(%Update{} = update) do
    Repo.delete(update)
  end

  def change_update(%Update{} = update, attrs \\ %{}) do
    Update.changeset(update, attrs)
  end

  alias Operately.Updates.Comment

  def list_comments(update_id) do
    query = from c in Comment,
      where: c.update_id == ^update_id,
      order_by: [asc: c.inserted_at]

    Repo.all(query)
  end

  def get_comment!(id), do: Repo.get!(Comment, id)

  def create_comment(update, attrs) do
    Repo.transaction(fn ->
      result = %Comment{} |> Comment.changeset(attrs) |> Repo.insert()

      case result do
        {:ok, comment} ->
          {:ok, _} = Operately.Activities.submit_comment_posted(comment, update)
          :ok = publish_comment_added(comment)

          comment

        {:error, e} ->
          Repo.rollback(e)
          e
      end
    end)
  end

  def publish_comment_added(comment) do
    Absinthe.Subscription.publish(
      OperatelyWeb.Endpoint,
      comment,
      comment_added: "*")
  end

  def update_comment(%Comment{} = comment, attrs) do
    comment
    |> Comment.changeset(attrs)
    |> Repo.update()
  end

  def delete_comment(%Comment{} = comment) do
    Repo.delete(comment)
  end

  def change_comment(%Comment{} = comment, attrs \\ %{}) do
    Comment.changeset(comment, attrs)
  end

  alias Operately.Updates.Reaction

  def list_reactions(entity_id, entity_type) do
    query = (
      from r in Reaction, 
       where: r.entity_id == ^entity_id and r.entity_type == ^entity_type, 
       order_by: r.inserted_at
    )

    Repo.all(query)
  end

  def get_reaction!(id), do: Repo.get!(Reaction, id)

  def create_reaction(attrs \\ %{}) do
    %Reaction{}
    |> Reaction.changeset(attrs)
    |> Repo.insert()
  end

  def update_reaction(%Reaction{} = reaction, attrs) do
    reaction
    |> Reaction.changeset(attrs)
    |> Repo.update()
  end

  def delete_reaction(%Reaction{} = reaction) do
    Repo.delete(reaction)
  end

  def change_reaction(%Reaction{} = reaction, attrs \\ %{}) do
    Reaction.changeset(reaction, attrs)
  end

  defp schedule_notification(update) do
  end
end
