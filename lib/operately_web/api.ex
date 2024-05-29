defmodule OperatelyWeb.Api do
  use TurboConnect.Specs

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
    field :theme, :string

    field :reports, list_of(:person)
    field :peers, list_of(:person)
  end

  object :company do
    field :id, :string
    field :name, :string
    field :mission, :string
    field :company_space_id, :string

    field :trusted_email_domains, list_of(:string)
    field :enabled_experimental_features, list_of(:string)

    field :admins, list_of(:person)
    field :people, list_of(:person)
  end

  object :group_contact do
    field :id, :string
    field :name, :string
    field :type, :string
    field :value, :string
  end

  object :group do
    field :id, :string
    field :name, :string
    field :mission, :string
    field :is_member, :boolean
    field :is_company_space, :boolean
    field :private_space, :boolean
    field :icon, :string
    field :color, :string
    field :members, list_of(:person)
    field :points_of_contact, list_of(:group_contact)
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

  object :goal do
    field :id, :string
    field :name, :string
    field :inserted_at, :datetime
    field :updated_at, :datetime
    field :next_update_scheduled_at, :datetime
    field :parent_goal_id, :string
    field :closed_at, :datetime
    field :description, :string
    field :champion, :person
    field :reviewer, :person
    field :closed_by, :person
    field :targets, list_of(:target)
    field :projects, list_of(:project)
    field :parent_goal, :goal
    field :progress_percentage, :float
    field :last_check_in, :project_check_in
    field :permissions, :string
    field :is_archived, :boolean
    field :is_closed, :boolean
    field :archived_at, :datetime
    field :space, :group
    field :my_role, :string
  end

  object :reaction do
    field :id, :string
    field :emoji, :string
    field :reaction_type, :string
    field :person, :person
  end

  object :comment do
    field :id, :string
    field :inserted_at, :datetime
    field :content, :string
    field :author, :person
    field :reactions, list_of(:reaction)
  end

  object :comment_thread do
    field :id, :string
    field :inserted_at, :datetime
    field :title, :string
    field :message, :string
    field :reactions, list_of(:reaction)
    field :comments, list_of(:comment)
    field :comments_count, :integer
    field :author, :person
  end

  object :project_check_in do
    field :id, :string
    field :status, :string
    field :inserted_at, :datetime
    field :description, :string
    field :author, :person
    field :project, :project
    field :acknowledged_at, :datetime
    field :acknowledged_by, :person
    field :reactions, list_of(:reaction)
  end

  object :milestone do
    field :id, :string
    field :title, :string
    field :status, :string
    field :inserted_at, :datetime
    field :deadline_at, :datetime
    field :completed_at, :datetime
    field :description, :string
    field :comments, list_of(:milestone_comment)
    field :tasks_kanban_state, :string
  end

  object :milestone_comment do
    field :id, :string
    field :action, :string
    field :comment, :comment
  end

  object :project_contributor do
    field :id, :string
    field :responsibility, :string
    field :role, :string
    field :person, :person
  end

  object :project_key_resource do
    field :id, :string
    field :title, :string
    field :link, :string
    field :resource_type, :string
  end

  object :project do
    field :id, :string
    field :name, :string
    field :inserted_at, :datetime
    field :updated_at, :datetime
    field :started_at, :datetime
    field :deadline, :datetime
    field :next_update_scheduled_at, :datetime
    field :next_check_in_scheduled_at, :datetime
    field :private, :boolean
    field :status, :string
    field :closed_at, :datetime
    field :retrospective, :string
    field :description, :string
    # field :goal, :goal
    field :last_check_in, :project_check_in
    field :milestones, list_of(:milestone)
    field :contributors, list_of(:project_contributor)
    field :key_resources, list_of(:project_key_resource)
    field :closed_by, :person
    field :is_outdated, :boolean
    field :space_id, :string
    # field :space, :group
    field :my_role, :string
    field :permissions, :string
    field :next_milestone, :milestone
    field :is_pinned, :boolean
    field :is_archived, :boolean
    field :archived_at, :datetime
    field :champion, :person
    field :reviewer, :person
  end

  object :discussion do
    field :id, :string
    field :name, :string
    field :inserted_at, :datetime
    field :updated_at, :datetime
    field :author, :person
    field :title, :string
    field :body, :string
    field :space, :group
    field :reactions, list_of(:reaction)
    field :comments, list_of(:comment)
  end

  object :activity do
    field :id, :string
    field :scope_type, :string
    field :scope_id, :string
    field :resource_id, :string
    field :resource_type, :string
    field :action_type, :string

    field :inserted_at, :datetime
    field :updated_at, :datetime

    field :comment_thread, :comment_thread
    field :author, :person
    field :person, :person

    field :resource, one_of([
      :project, 
      # :update, 
      :milestone, 
      :comment
    ])

    # field :event_data, one_of([
      # :activity_event_data_project_create, 
      # :activity_event_data_milestone_create, 
      # :activity_event_data_comment_post
    # ])

    field :content, :activity_content, one_of([
      :activity_content_comment_added,
      :activity_content_discussion_comment_submitted,
      :activity_content_discussion_editing,
      :activity_content_discussion_posting,
      :activity_content_goal_archived,
      # :activity_content_goal_check_in,
      # :activity_content_goal_check_in_acknowledgement,
      # :activity_content_goal_check_in_edit,
      # :activity_content_goal_closing,
      # :activity_content_goal_created,
      # :activity_content_goal_discussion_creation,
      # :activity_content_goal_discussion_editing,
      # :activity_content_goal_editing,
      # :activity_content_goal_reopening,
      # :activity_content_goal_reparent,
      # :activity_content_goal_timeframe_editing,
      # :activity_content_group_edited,
      # :activity_content_project_archived,
      # :activity_content_project_check_in_acknowledged,
      # :activity_content_project_check_in_commented,
      # :activity_content_project_check_in_edit,
      # :activity_content_project_check_in_submitted,
      # :activity_content_project_closed,
      # :activity_content_project_contributor_addition,
      # :activity_content_project_created,
      # :activity_content_project_discussion_submitted,
      # :activity_content_project_goal_connection,
      # :activity_content_project_goal_disconnection,
      # :activity_content_project_milestone_commented,
      # :activity_content_project_moved,
      # :activity_content_project_pausing,
      # :activity_content_project_renamed,
      # :activity_content_project_resuming,
      # :activity_content_project_review_acknowledged,
      # :activity_content_project_review_commented,
      # :activity_content_project_review_request_submitted,
      # :activity_content_project_review_submitted,
      # :activity_content_project_timeline_edited,
      # :activity_content_space_joining,
      # :activity_content_task_adding,
      # :activity_content_task_assignee_assignment,
      # :activity_content_task_closing,
      # :activity_content_task_description_change,
      # :activity_content_task_name_editing,
      # :activity_content_task_priority_change,
      # :activity_content_task_reopening,
      # :activity_content_task_size_change,
      # :activity_content_task_status_change,
      # :activity_content_task_update
    ])
  end

  object :activity_content_comment_added do
    field :comment, :comment
    field :activity, :activity
  end

  object :activity_content_discussion_comment_submitted do
    field :space_id, :string
    field :discussion_id, :string
    field :title, :string
    field :space, :group
  end

  object :activity_content_discussion_editing do
    field :company_id, :string
    field :space_id, :string
    field :discussion_id, :string
  end

  object :activity_content_discussion_posting do
    field :company_id, :string
    field :space_id, :string
    field :title, :string
    field :discussion_id, :string
    field :space, :group
    field :discussion, :discussion
  end

  object :activity_content_goal_archived do
    field :goal, :goal
  end

  object :activity_content_goal_check_in do
    field :goal, :goal
    field :update, :update
  end

  object :activity_content_goal_check_in_acknowledgement do
    field :goal, :goal
    field :update, :update
  end

  object :activity_content_goal_check_in_edit do
    field :company_id, :string
    field :goal_id, :string
    field :check_in_id, :string
  end

  object :activity_content_goal_closing do
    field :company_id, :string
    field :space_id, :string
    field :goal_id, :string
    field :success, :string
    field :goal, :goal
  end

  object :activity_content_goal_created do
    field :goal, :goal
  end

  object :activity_content_goal_discussion_creation do
    field :company_id, :string
    field :goal_id, :string
    field :goal, :goal
  end

  object :activity_content_goal_discussion_editing do
    field :company_id, :string
    field :space_id, :string
    field :goal_id, :string
    field :activity_id, :string
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
    field :added_targets, :target
    field :updated_targets, list_of(:goal_editing_updated_target)
    field :deleted_targets, list_of(:target)
  end

  object :goal_editing_updated_target do
    field :id, :string
    field :old_name, :string
    field :new_name, :string
  end

  object :timeframe do
    field :start_date, :date
    field :end_date, :date
    field :type, :string
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

  object :activity_content_goal_timeframe_editing do
    field :goal, :goal
    field :old_timeframe, :timeframe
    field :new_timeframe, :timeframe
  end

  object :activity_content_group_edited do
    field :example_field, :string
  end

  object :activity_content_project_archived do
    field :project_id, :string
    field :project, :project
  end

  object :activity_content_project_check_in_acknowledged do
    field :project_id, :string
    field :check_in_id, :string
    field :project, :project
    field :check_in, :project_check_in
  end

  object :activity_content_project_check_in_commented do
    field :project_id, :string
    field :check_in_id, :string
    field :project, :project
    field :check_in, :project_check_in
    field :comment, :comment
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

  object :activity_content_project_closed do
    field :project, :project
  end

  object :activity_content_project_contributor_addition do
    field :company_id, :string
    field :project_id, :string
    field :person_id, :string
    field :person, :person
    field :project, :project
  end

  object :activity_content_project_created do
    field :project, :project
    field :project_id, :string
  end

  object :activity_content_project_discussion_submitted do
    field :project_id, :string
    field :discussion_id, :string
    field :title, :string
    field :project, :project
  end

  object :activity_content_project_goal_connection do
    field :project, :project
    field :goal, :goal
  end

end
