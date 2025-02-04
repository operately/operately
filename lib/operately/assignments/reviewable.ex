defprotocol Operately.Assignments.Reviewable do
  def reviewer_id(resource)

  def due_date(resource)

  def is_reviewer?(resource, person)
end

defimpl Operately.Assignments.Reviewable, for: Operately.Projects.Project do
  def reviewer_id(project), do: project.reviewer.id

  def due_date(project), do: project.next_check_in_scheduled_at

  def is_reviewer?(project, person), do: project.reviewer.id == person.id
end

defimpl Operately.Assignments.Reviewable, for: Operately.Projects.CheckIn do
  def reviewer_id(check_in), do: check_in.project.reviewer.id

  def due_date(check_in), do: check_in.inserted_at

  def is_reviewer?(check_in, person), do: check_in.project.reviewer.id == person.id
end

defimpl Operately.Assignments.Reviewable, for: Operately.Goals.Goal do
  def reviewer_id(goal), do: goal.reviewer_id

  def due_date(goal), do: goal.next_update_scheduled_at

  def is_reviewer?(goal, person), do: goal.reviewer_id == person.id
end

defimpl Operately.Assignments.Reviewable, for: Operately.Goals.Update do
  def reviewer_id(update), do: update.goal.reviewer_id

  def due_date(update), do: update.inserted_at

  def is_reviewer?(update, person), do: update.goal.reviewer_id == person.id
end
