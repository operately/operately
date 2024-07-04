defmodule OperatelyWeb.Api.Types do
  use TurboConnect.Types

  object :activity_content_space_joining do
    field :company_id, :string
    field :space_id, :string
    field :space, :space
  end

  object :activity_content_goal_archived do
    field :goal, :goal
  end

  object :activity_content_project_check_in_edit do
    field :company_id, :string
    field :project_id, :string
    field :check_in_id, :string
  end

  object :activity_content_project_check_in_submitted do
    field :project_id, :string
    field :check_in_id, :string
    field :project, :project
    field :check_in, :project_check_in
  end

  union :update_content, types: [
    :update_content_project_created,
    :update_content_project_start_time_changed,
    :update_content_project_end_time_changed,
    :update_content_project_contributor_added,
    :update_content_project_contributor_removed,
    :update_content_project_milestone_created,
    :update_content_project_milestone_completed,
    :update_content_project_milestone_deadline_changed,
    :update_content_project_milestone_deleted,
    :update_content_status_update,
    :update_content_goal_check_in,
    :update_content_review,
    :update_content_project_discussion,
    :update_content_message
  ]

  object :activity_content_project_goal_connection do
    field :project, :project
    field :goal, :goal
  end

  object :update_content_project_discussion do
    field :title, :string
    field :body, :string
  end

  object :project_key_resource do
    field :id, :string
    field :title, :string
    field :link, :string
    field :resource_type, :string
  end

  object :activity_content_project_moved do
    field :project, :project
    field :old_space, :space
    field :new_space, :space
  end

  object :update_content_project_contributor_removed do
    field :contributor, :person
    field :contributor_id, :string
    field :contributor_role, :string
  end

  object :update_content_project_milestone_created do
    field :milestone, :milestone
  end

  object :update_content_project_milestone_deleted do
    field :milestone, :milestone
  end

  object :reaction do
    field :id, :string
    field :emoji, :string
    field :reaction_type, :string
    field :person, :person
  end

  object :activity_content_project_pausing do
    field :company_id, :string
    field :project_id, :string
    field :project, :project
  end

  object :activity_content_task_name_editing do
    field :company_id, :string
    field :space_id, :string
    field :task_id, :string
    field :old_name, :string
    field :new_name, :string
  end

  object :activity_content_task_priority_change do
    field :company_id, :string
    field :space_id, :string
    field :task_id, :string
    field :old_priority, :string
    field :new_priority, :string
  end

  object :goal_editing_updated_target do
    field :id, :string
    field :old_name, :string
    field :new_name, :string
  end

  object :project do
    field :id, :string
    field :name, :string
    field :inserted_at, :date
    field :updated_at, :date
    field :started_at, :date
    field :deadline, :date
    field :next_update_scheduled_at, :date
    field :next_check_in_scheduled_at, :date
    field :private, :boolean
    field :status, :string
    field :closed_at, :date
    field :retrospective, :string
    field :description, :string
    field :goal, :goal
    field :last_check_in, :project_check_in
    field :milestones, list_of(:milestone)
    field :contributors, list_of(:project_contributor)
    field :key_resources, list_of(:project_key_resource)
    field :closed_by, :person
    field :is_outdated, :boolean
    field :space_id, :string
    field :space, :space
    field :my_role, :string
    field :permissions, :project_permissions
    field :next_milestone, :milestone
    field :is_pinned, :boolean
    field :is_archived, :boolean
    field :archived_at, :date
    field :champion, :person
    field :reviewer, :person
  end

  object :discussion do
    field :id, :string
    field :name, :string
    field :inserted_at, :date
    field :updated_at, :date
    field :author, :person
    field :title, :string
    field :body, :string
    field :space, :space
    field :reactions, list_of(:reaction)
    field :comments, list_of(:comment)
  end

  object :activity do
    field :id, :string
    field :scope_type, :string
    field :scope_id, :string
    field :resource_id, :string
    field :resource_type, :string
    field :action, :string
    field :inserted_at, :datetime
    field :updated_at, :datetime
    field :comment_thread, :comment_thread
    field :author, :person
    field :resource, :activity_resource_union
    field :person, :person
    field :event_data, :activity_data_union
    field :content, :activity_content
  end

  object :activity_event_data_project_create do
    field :champion, :person
  end

  object :activity_content_project_review_commented do
    field :project_id, :string
    field :review_id, :string
    field :project, :project
  end

  object :assignment do
    field :type, :string
    field :due, :date
    field :resource, :assignment_resource
  end

  object :target do
    field :id, :string
    field :index, :integer
    field :name, :string
    field :from, :float
    field :to, :float
    field :unit, :string
    field :value, :float
  end

  object :milestone_comment do
    field :id, :string
    field :action, :string
    field :comment, :comment
  end

  object :space do
    field :id, :string
    field :name, :string
    field :mission, :string
    field :is_member, :boolean
    field :is_company_space, :boolean
    field :private_space, :boolean
    field :icon, :string
    field :color, :string
    field :members, list_of(:person)
  end

  object :panel do
    field :id, :string
    field :type, :string
    field :index, :integer
    field :linked_resource, :panel_linked_resource
  end

  object :update_content_message do
    field :message, :string
  end

  union :activity_content, types: [
    :activity_content_comment_added,
    :activity_content_discussion_comment_submitted,
    :activity_content_discussion_editing,
    :activity_content_discussion_posting,
    :activity_content_goal_archived,
    :activity_content_goal_check_in,
    :activity_content_goal_check_in_acknowledgement,
    :activity_content_goal_check_in_edit,
    :activity_content_goal_closing,
    :activity_content_goal_created,
    :activity_content_goal_discussion_creation,
    :activity_content_goal_discussion_editing,
    :activity_content_goal_editing,
    :activity_content_goal_reopening,
    :activity_content_goal_reparent,
    :activity_content_goal_timeframe_editing,
    :activity_content_group_edited,
    :activity_content_project_archived,
    :activity_content_project_check_in_acknowledged,
    :activity_content_project_check_in_commented,
    :activity_content_project_check_in_edit,
    :activity_content_project_check_in_submitted,
    :activity_content_project_closed,
    :activity_content_project_contributor_addition,
    :activity_content_project_created,
    :activity_content_project_discussion_submitted,
    :activity_content_project_goal_connection,
    :activity_content_project_goal_disconnection,
    :activity_content_project_milestone_commented,
    :activity_content_project_moved,
    :activity_content_project_pausing,
    :activity_content_project_renamed,
    :activity_content_project_resuming,
    :activity_content_project_review_acknowledged,
    :activity_content_project_review_commented,
    :activity_content_project_review_request_submitted,
    :activity_content_project_review_submitted,
    :activity_content_project_timeline_edited,
    :activity_content_space_joining,
    :activity_content_task_adding,
    :activity_content_task_assignee_assignment,
    :activity_content_task_closing,
    :activity_content_task_description_change,
    :activity_content_task_name_editing,
    :activity_content_task_priority_change,
    :activity_content_task_reopening,
    :activity_content_task_size_change,
    :activity_content_task_status_change,
    :activity_content_task_update
  ]

  object :activity_content_project_discussion_submitted do
    field :project_id, :string
    field :discussion_id, :string
    field :title, :string
    field :project, :project
  end

  object :activity_content_project_review_acknowledged do
    field :project_id, :string
    field :review_id, :string
    field :project, :project
  end

  object :activity_content_project_timeline_edited do
    field :project, :project
    field :old_start_date, :date
    field :new_start_date, :date
    field :old_end_date, :date
    field :new_end_date, :date
    field :new_milestones, list_of(:milestone)
    field :updated_milestones, list_of(:milestone)
  end

  object :update_content_project_milestone_deadline_changed do
    field :old_deadline, :string
    field :new_deadline, :string
    field :milestone, :milestone
  end

  object :activity_content_goal_check_in do
    field :goal, :goal
    field :update, :update
  end

  object :activity_content_discussion_posting do
    field :company_id, :string
    field :space_id, :string
    field :title, :string
    field :discussion_id, :string
    field :space, :space
    field :discussion, :discussion
  end

  object :activity_content_task_description_change do
    field :company_id, :string
    field :space_id, :string
    field :task_id, :string
  end

  object :update do
    field :id, :string
    field :title, :string
    field :inserted_at, :datetime
    field :updated_at, :datetime
    field :acknowledged, :boolean
    field :acknowledged_at, :datetime
    field :updatable_id, :string
    field :project, :project
    field :acknowledging_person, :person
    field :message, :string
    field :message_type, :string
    field :comments, list_of(:comment)
    field :author, :person
    field :reactions, list_of(:reaction)
    field :content, :update_content
    field :comments_count, :integer
  end

  object :activity_content_goal_created do
    field :goal, :goal
  end

  object :activity_content_project_check_in_acknowledged do
    field :project_id, :string
    field :check_in_id, :string
    field :project, :project
    field :check_in, :project_check_in
  end

  object :update_content_project_contributor_added do
    field :contributor_id, :string
    field :contributor_role, :string
    field :contributor, :person
  end

  object :project_permissions do
    field :can_view, :boolean
    field :can_create_milestone, :boolean
    field :can_delete_milestone, :boolean
    field :can_edit_contributors, :boolean
    field :can_edit_milestone, :boolean
    field :can_edit_description, :boolean
    field :can_edit_timeline, :boolean
    field :can_edit_resources, :boolean
    field :can_edit_goal, :boolean
    field :can_edit_name, :boolean
    field :can_edit_space, :boolean
    field :can_pause, :boolean
    field :can_check_in, :boolean
    field :can_acknowledge_check_in, :boolean
  end

  union :activity_data_union, types: [
    :activity_event_data_project_create,
    :activity_event_data_milestone_create,
    :activity_event_data_comment_post
  ]

  object :notification do
    field :id, :string
    field :read, :boolean
    field :read_at, :datetime
    field :activity, :activity
  end

  object :task do
    field :id, :string
    field :name, :string
    field :inserted_at, :date
    field :updated_at, :date
    field :due_date, :date
    field :size, :string
    field :priority, :string
    field :status, :string
    field :milestone, :milestone
    field :project, :project
    field :description, :string
    field :assignees, list_of(:person)
    field :creator, :person
  end

  object :activity_content_discussion_editing do
    field :company_id, :string
    field :space_id, :string
    field :discussion_id, :string
  end

  union :panel_linked_resource, types: [
    :project
  ]

  object :activity_content_group_edited do
    field :example_field, :string
  end

  object :activity_content_project_review_request_submitted do
    field :project_id, :string
    field :request_id, :string
    field :project, :project
  end

  object :activity_content_task_assignee_assignment do
    field :company_id, :string
    field :space_id, :string
    field :task_id, :string
    field :person_id, :string
  end

  object :goal_permissions do
    field :can_edit, :boolean
    field :can_check_in, :boolean
    field :can_acknowledge_check_in, :boolean
    field :can_close, :boolean
    field :can_archive, :boolean
  end

  object :activity_content_project_contributor_addition do
    field :company_id, :string
    field :project_id, :string
    field :person_id, :string
    field :person, :person
    field :project, :project
  end

  object :invitation do
    field :id, :string
    field :admin_name, :string
    field :admin, :person
    field :member, :person
    field :token, :string
  end

  object :activity_content_task_adding do
    field :name, :string
    field :task_id, :string
    field :company_id, :string
    field :space_id, :string
  end

  object :activity_event_data_milestone_create do
    field :title, :string
  end

  object :activity_content_goal_check_in_acknowledgement do
    field :goal, :goal
    field :update, :update
  end

  object :activity_content_project_archived do
    field :project_id, :string
    field :project, :project
  end

  object :goal do
    field :id, :string
    field :name, :string
    field :inserted_at, :date
    field :updated_at, :date
    field :next_update_scheduled_at, :date
    field :parent_goal_id, :string
    field :closed_at, :date
    field :timeframe, :timeframe
    field :description, :string
    field :champion, :person
    field :reviewer, :person
    field :closed_by, :person
    field :targets, list_of(:target)
    field :projects, list_of(:project)
    field :parent_goal, :goal
    field :progress_percentage, :float
    field :last_check_in, :update
    field :permissions, :goal_permissions
    field :is_archived, :boolean
    field :is_closed, :boolean
    field :archived_at, :date
    field :space, :space
    field :my_role, :string
  end

  object :activity_content_project_resuming do
    field :company_id, :string
    field :project_id, :string
    field :project, :project
  end

  object :activity_content_task_reopening do
    field :company_id, :string
    field :space_id, :string
    field :task_id, :string
  end

  object :activity_content_discussion_comment_submitted do
    field :space_id, :string
    field :discussion_id, :string
    field :discussion, :discussion
    field :space, :space
    field :title, :string
  end

  object :update_content_project_created do
    field :creator_role, :string
    field :creator, :person
    field :champion, :person
  end

  object :activity_content_goal_discussion_editing do
    field :company_id, :string
    field :space_id, :string
    field :goal_id, :string
    field :activity_id, :string
  end

  object :activity_content_task_status_change do
    field :company_id, :string
    field :task_id, :string
    field :status, :string
  end

  object :activity_content_task_update do
    field :company_id, :string
    field :task_id, :string
    field :name, :string
  end

  object :activity_event_data_comment_post do
    field :update_id, :string
  end

  object :activity_content_project_goal_disconnection do
    field :project, :project
    field :goal, :goal
  end

  object :person do
    field :id, :string
    field :manager_id, :string
    field :full_name, :string
    field :title, :string
    field :avatar_url, :string
    field :timezone, :string
    field :company_role, :string
    field :email, :string
    field :send_daily_summary, :boolean
    field :notify_on_mention, :boolean
    field :notify_about_assignments, :boolean
    field :suspended, :boolean
    field :company, :company
    field :manager, :person
    field :reports, list_of(:person)
    field :peers, list_of(:person)
    field :theme, :string
  end

  object :project_health do
    field :status, :string
    field :status_comments, :string
    field :schedule, :string
    field :schedule_comments, :string
    field :budget, :string
    field :budget_comments, :string
    field :team, :string
    field :team_comments, :string
    field :risks, :string
    field :risks_comments, :string
  end

  object :activity_content_goal_closing do
    field :company_id, :string
    field :space_id, :string
    field :goal_id, :string
    field :success, :string
    field :goal, :goal
  end

  object :activity_content_goal_editing do
    field :goal, :goal
    field :company_id, :string
    field :goal_id, :string
    field :old_name, :string
    field :new_name, :string
    field :old_timeframe, :timeframe
    field :new_timeframe, :timeframe
    field :old_champion_id, :string
    field :new_champion_id, :string
    field :old_reviewer_id, :string
    field :new_reviewer_id, :string
    field :new_champion, :person
    field :new_reviewer, :person
    field :added_targets, list_of(:target)
    field :updated_targets, list_of(:goal_editing_updated_target)
    field :deleted_targets, list_of(:target)
  end

  object :activity_content_task_closing do
    field :company_id, :string
    field :space_id, :string
    field :task_id, :string
  end

  object :update_content_review do
    field :survey, :string
    field :previous_phase, :string
    field :new_phase, :string
    field :review_reason, :string
    field :review_request_id, :string
  end

  object :update_content_status_update do
    field :message, :string
    field :old_health, :string
    field :new_health, :string
    field :next_milestone_id, :string
    field :next_milestone_title, :string
    field :next_milestone_due_date, :string
    field :phase, :string
    field :phase_start, :string
    field :phase_end, :string
    field :project_start_time, :string
    field :project_end_time, :string
    field :health, :project_health
  end

  object :activity_content_project_closed do
    field :project, :project
  end

  object :update_content_project_milestone_completed do
    field :milestone, :milestone
  end

  union :activity_resource_union, types: [
    :project,
    :update,
    :milestone,
    :comment
  ]

  object :activity_content_goal_discussion_creation do
    field :company_id, :string
    field :goal_id, :string
    field :goal, :goal
  end

  object :milestone do
    field :id, :string
    field :title, :string
    field :status, :string
    field :inserted_at, :date
    field :deadline_at, :date
    field :completed_at, :date
    field :description, :string
    field :comments, list_of(:milestone_comment)
    field :tasks_kanban_state, :string
  end

  object :activity_content_goal_check_in_edit do
    field :company_id, :string
    field :goal_id, :string
    field :check_in_id, :string
  end

  object :assignments do
    field :assignments, list_of(:assignment)
  end

  object :update_content_goal_check_in do
    field :message, :string
    field :targets, list_of(:update_content_goal_check_in_target)
  end

  object :company do
    field :id, :string
    field :name, :string
    field :mission, :string
    field :trusted_email_domains, list_of(:string)
    field :enabled_experimental_features, list_of(:string)
    field :company_space_id, :string
    field :admins, list_of(:person)
    field :people, list_of(:person)
    field :member_count, :integer
  end

  object :activity_content_goal_timeframe_editing do
    field :goal, :goal
    field :old_timeframe, :timeframe
    field :new_timeframe, :timeframe
  end

  object :activity_content_task_size_change do
    field :company_id, :string
    field :space_id, :string
    field :task_id, :string
    field :old_size, :string
    field :new_size, :string
  end

  object :timeframe do
    field :start_date, :date
    field :end_date, :date
    field :type, :string
  end

  object :activity_content_project_milestone_commented do
    field :project_id, :string
    field :project, :project
    field :milestone, :milestone
    field :comment_action, :string
    field :comment, :comment
  end

  object :activity_content_project_review_submitted do
    field :project_id, :string
    field :review_id, :string
    field :project, :project
  end

  object :comment_thread do
    field :id, :string
    field :inserted_at, :date
    field :title, :string
    field :message, :string
    field :reactions, list_of(:reaction)
    field :comments, list_of(:comment)
    field :comments_count, :integer
    field :author, :person
  end

  object :comment do
    field :id, :string
    field :inserted_at, :datetime
    field :content, :string
    field :author, :person
    field :reactions, list_of(:reaction)
  end

  union :assignment_resource, types: [
    :project,
    :milestone
  ]

  object :activity_content_comment_added do
    field :comment, :comment
    field :activity, :activity
  end

  object :activity_content_project_renamed do
    field :project, :project
    field :old_name, :string
    field :new_name, :string
  end

  object :project_review_request do
    field :id, :string
    field :inserted_at, :date
    field :updated_at, :date
    field :status, :string
    field :review_id, :string
    field :content, :string
    field :author, :person
  end

  object :update_content_project_end_time_changed do
    field :old_end_time, :string
    field :new_end_time, :string
  end

  object :activity_content_goal_reopening do
    field :company_id, :string
    field :goal_id, :string
    field :message, :string
    field :goal, :goal
  end

  object :activity_content_goal_reparent do
    field :company_id, :string
    field :old_parent_goal_id, :string
    field :new_parent_goal_id, :string
  end

  object :activity_content_project_created do
    field :project_id, :string
    field :project, :project
  end

  object :update_content_goal_check_in_target do
    field :id, :string
    field :name, :string
    field :value, :float
    field :unit, :string
    field :previous_value, :float
    field :index, :integer
    field :from, :float
    field :to, :float
  end

  object :project_check_in do
    field :id, :string
    field :status, :string
    field :inserted_at, :date
    field :description, :string
    field :author, :person
    field :project, :project
    field :acknowledged_at, :datetime
    field :acknowledged_by, :person
    field :reactions, list_of(:reaction)
  end

  object :activity_content_project_check_in_commented do
    field :project_id, :string
    field :check_in_id, :string
    field :project, :project
    field :check_in, :project_check_in
    field :comment, :comment
  end

  object :update_content_project_start_time_changed do
    field :old_start_time, :string
    field :new_start_time, :string
  end

  object :project_contributor do
    field :id, :string
    field :responsibility, :string
    field :role, :string
    field :person, :person
  end

  object :create_target_input do
    field :name, :string
    field :from, :float
    field :to, :float
    field :unit, :string
    field :index, :integer
  end

  object :update_target_input do
    field :id, :string
    field :name, :string
    field :from, :float
    field :to, :float
    field :unit, :string
    field :index, :integer
  end

end
