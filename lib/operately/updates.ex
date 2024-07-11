defmodule Operately.Updates do
  @moduledoc """
  The Updates context.
  """

  import Ecto.Query, warn: false

  alias Operately.Activities
  alias Operately.Updates.Update
  alias Operately.Projects.Project
  alias Operately.Projects.ReviewRequest

  alias Operately.Repo
  alias Ecto.Multi

  def list_updates do
    Repo.all(Update)
  end

  def list_people_who_should_be_notified(update) do
    alias Operately.People.Person
    alias Operately.Projects.Contributor

    if update.updatable_type == :project do
      query = from p in Person,
        join: c in Contributor, on: c.person_id == p.id,
        where: c.project_id == ^update.updatable_id,
        where: p.id != ^update.author_id,
        where: not is_nil(p.email) and p.notify_about_assignments

      Repo.all(query)
    else
      []
    end
  end

  def list_updates(updatable_id, updatable_type, update_type \\ nil) do
    query = from u in Update,
      where: u.updatable_id == ^updatable_id,
      where: u.updatable_type == ^updatable_type,
      order_by: [desc: u.inserted_at]

    query = case update_type do
      nil -> query
      _ -> from u in query, where: u.type == ^update_type
    end

    Repo.all(query)
  end

  def get_update!(id), do: Repo.get!(Update, id)

  def create_update(attrs \\ %{}) do
    %Update{} |> Update.changeset(attrs) |> Repo.insert()
  end

  def get_last_check_in(updatable_id) do
    query = from u in Update,
      where: u.updatable_id == ^updatable_id,
      where: u.updatable_type == :project,
      where: u.type == :status_update,
      order_by: [desc: u.inserted_at],
      limit: 1

    Repo.one(query)
  end

  def get_last_goal_check_in(updatable_id) do
    query = from u in Update,
      where: u.updatable_id == ^updatable_id,
      where: u.updatable_type == :goal,
      where: u.type == :goal_check_in,
      order_by: [desc: u.inserted_at],
      limit: 1

    Repo.one(query)
  end

  def record_review(author, project, new_phase, content, review_request_id) do
    previous_phase = Atom.to_string(project.phase)

    changeset = Update.changeset(%{
      updatable_type: :project,
      updatable_id: project.id,
      author_id: author.id,
      title: "",
      type: :review,
      content: Operately.Updates.Types.Review.build(
        content["survey"],
        content["previousPhase"],
        content["newPhase"],
        review_request_id
      )
    })

    Multi.new()
    |> Multi.insert(:update, changeset)
    |> then(fn multi ->
      if review_request_id do
        request = Operately.Projects.get_review_request!(review_request_id)

        multi |> Multi.update(:review_request, fn changes ->
          ReviewRequest.changeset(request, %{status: :completed, update_id: changes.update.id})
        end)
      else
        multi
      end
    end)
    |> Multi.run(:phase_history, fn _repo, _changes ->
      Operately.Projects.record_phase_history(project, previous_phase, new_phase)
    end)
    |> Multi.update(:project, Project.changeset(project, %{phase: new_phase}))
    |> Activities.insert_sync(author.id, :project_review_submitted, fn changes -> %{update_id: changes.update.id, project_id: changes.project.id} end)
    |> Repo.transaction()
    |> Repo.extract_result(:update)
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

  def record_project_discussion(author, project, title, body) do
    action = :project_discussion_submitted

    changeset = Update.changeset(%{
      updatable_type: :project,
      updatable_id: project.id,
      author_id: author.id,
      title: "",
      type: :project_discussion,
      content: Operately.Updates.Types.ProjectDiscussion.build(title, body)
    })

    Multi.new()
    |> Multi.insert(:update, changeset)
    |> Activities.insert_sync(author.id, action, fn changes -> %{update_id: changes.update.id, project_id: project.id} end)
    |> Repo.transaction()
    |> Repo.extract_result(:update)
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

  def acknowledge_update(author, update) do
    changeset = change_update(update, %{
      acknowledged: true,
      acknowledged_at: DateTime.utc_now,
      acknowledging_person_id: author.id
    })

    action = case update.type do
      :goal_check_in -> :goal_check_in_acknowledgement
      _ -> raise "Unknown update type"
    end

    Multi.new()
    |> Multi.update(:update, changeset)
    |> Activities.insert_sync(author.id, action, fn _changes ->
      %{
        company_id: author.company_id,
        goal_id: update.updatable_id,
        update_id: update.id
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:update)
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

  def list_comments(entity_id, entity_type) do
    query = from c in Comment,
      where: c.entity_id == ^entity_id and c.entity_type == ^entity_type,
      order_by: [asc: c.inserted_at]

    Repo.all(query)
  end

  def count_comments(entity_id, entity_type) do
    query = (from c in Comment, where: c.entity_id == ^entity_id and c.entity_type == ^entity_type)

    Repo.aggregate(query, :count, :id)
  end

  def get_comment!(id), do: Repo.get!(Comment, id)

  # old version. TODO: remove
  def create_comment(_update, attrs) do
    changeset = Comment.changeset(attrs)

    Repo.insert(changeset)
  end

  def create_comment(author, update, content) do
    changeset = Comment.changeset(%{
      author_id: author.id,
      update_id: update.id,
      content: %{"message" => content}
    })

    Multi.new()
    |> Multi.insert(:comment, changeset)
    |> then(fn multi ->
      case update.type do
        :project_discussion ->
          Activities.insert_sync(multi, author.id, :discussion_comment_submitted, fn changes -> %{
            company_id: author.company_id,
            space_id: update.updatable_id,
            discussion_id: update.id,
            comment_id: changes.comment.id
          } end)
        :status_update ->
          Activities.insert_sync(multi, author.id, :project_status_update_commented, fn changes -> %{
            company_id: author.company_id,
            project_id: update.updatable_id,
            update_id: update.id,
            comment_id: changes.comment.id
          } end)
        _ ->
          raise "Unknown update type"
      end
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:comment)
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
end
