defmodule OperatelyWeb.Api.Types do
  use TurboConnect.Types

  primitive(:id,
    encoded_type: :string,
    decoded_type: :string,
    decode_with: &OperatelyWeb.Api.Types.Id.decode/1
  )

  primitive(:company_id,
    encoded_type: :string,
    decoded_type: :number,
    decode_with: &OperatelyWeb.Api.Types.CompanyId.decode/1
  )

  primitive(:json,
    encoded_type: :string,
    decoded_type: :map,
    decode_with: &OperatelyWeb.Api.Types.Json.decode/1
  )

  enum :account_theme, values: Operately.People.Account.valid_themes()

  object :account do
    field :full_name, :string, null: false
    field :site_admin, :boolean, null: false
  end

  enum :access_options, values: Operately.Access.Binding.valid_access_levels(:as_atom)

  enum :resource_access_types, values: [:space, :goal, :project]

  object :resource_access_input do
    field :resource_type, :resource_access_types
    field :resource_id, :id
    field :access_level, :access_options
  end

  object :access_levels do
    field? :public, :integer, null: true
    field? :company, :integer, null: true
    field? :space, :integer, null: true
  end

  object :activity_content_goal_check_toggled do
    field :company, :company
    field :space, :space
    field :goal, :goal
    field :name, :string
    field :completed, :boolean
  end

  object :activity_content_goal_check_removing do
    field :company, :company
    field :space, :space
    field :goal, :goal
    field :name, :string
  end

  object :activity_content_goal_check_adding do
    field :company, :company
    field :space, :space
    field :goal, :goal
    field :name, :string
  end

  object :activity_content_goal_target_updating do
    field :company, :company
    field :space, :space
    field :goal, :goal
    field :target_name, :string
    field :old_value, :string
    field :new_value, :string
    field :unit, :string
  end

  object :activity_content_goal_target_deleting do
    field :company, :company
    field :space, :space
    field :goal, :goal
    field :target_name, :string
  end

  object :activity_content_goal_target_adding do
    field :company, :company
    field :space, :space
    field :goal, :goal
    field :target_name, :string
  end

  object :activity_content_goal_space_updating do
    field :company, :company
    field :space, :space
    field :goal, :goal
    field :old_space, :space
  end

  object :activity_content_goal_name_updating do
    field :company, :company
    field :space, :space
    field :goal, :goal
    field :old_name, :string
    field :new_name, :string
  end

  object :activity_content_goal_due_date_updating do
    field :company, :company
    field :space, :space
    field :goal, :goal
    field :old_due_date, :date, null: true
    field :new_due_date, :date, null: true
  end

  object :activity_content_goal_start_date_updating do
    field :company, :company
    field :space, :space
    field :goal, :goal
    field :old_start_date, :date, null: true
    field :new_start_date, :date, null: true
  end

  object :activity_content_project_due_date_updating do
    field :company, :company
    field :space, :space
    field :project, :project
    field :old_due_date, :date, null: true
    field :new_due_date, :date, null: true
  end

  object :activity_content_project_start_date_updating do
    field :company, :company
    field :space, :space
    field :project, :project
    field :old_start_date, :date, null: true
    field :new_start_date, :date, null: true
  end

  object :activity_content_project_milestone_creation do
    field :company, :company
    field :space, :space
    field :project, :project
    field :milestone, :milestone, null: true
    field :milestone_name, :string
  end

  object :activity_content_project_milestone_updating do
    field :company, :company
    field :space, :space
    field :project, :project
    field :milestone, :milestone
    field :old_milestone_name, :string
    field :new_milestone_name, :string
    field :old_timeframe, :timeframe, null: true
    field :new_timeframe, :timeframe, null: true
  end

  object :activity_content_goal_reviewer_updating do
    field :company, :company
    field :space, :space
    field :goal, :goal
    field :old_reviewer, :person
    field :new_reviewer, :person
  end

  object :activity_content_goal_champion_updating do
    field :company, :company
    field :space, :space
    field :goal, :goal
    field :old_champion, :person
    field :new_champion, :person
  end

  object :activity_content_project_champion_updating do
    field :company, :company
    field :space, :space
    field :project, :project
    field :old_champion, :person
    field :new_champion, :person
  end

  object :activity_content_project_reviewer_updating do
    field :company, :company
    field :space, :space
    field :project, :project
    field :old_reviewer, :person
    field :new_reviewer, :person
  end

  object :activity_content_message_archiving do
    field? :company_id, :string, null: true
    field? :space_id, :string, null: true
    field? :space, :space, null: true
    field? :message_id, :string, null: true
    field? :title, :string, null: true
  end

  object :activity_content_company_member_restoring do
    field? :person, :person, null: true
  end

  object :activity_content_guest_invited do
    field :company, :company, null: false
    field :person, :person, null: false
  end

  object :activity_content_company_member_added do
    field :company, :company, null: false
    field :person, :person, null: true
    field :name, :string, null: false
  end

  object :activity_content_company_member_converted_to_guest do
    field :company, :company, null: false
    field :person, :person, null: true
  end

  object :activity_content_company_owner_removing do
    field :company, :company, null: false
    field :person, :person, null: true
  end

  object :activity_content_space_added do
    field? :company_id, :string, null: true
    field? :space_id, :string, null: true
    field? :space, :space, null: true
  end

  object :activity_content_space_joining do
    field? :company_id, :string, null: true
    field? :space_id, :string, null: true
    field? :space, :space, null: true
  end

  object :activity_content_space_member_removed do
    field? :space, :space, null: true
    field? :member, :person, null: true
  end

  object :activity_content_space_members_added do
    field? :space, :space, null: true
    field? :members, list_of(:person), null: true
  end

  object :activity_content_goal_archived do
    field? :goal, :goal, null: true
  end

  object :activity_content_project_check_in_edit do
    field? :company_id, :string, null: true
    field? :project_id, :string, null: true
    field? :check_in_id, :string, null: true
  end

  object :activity_content_project_check_in_submitted do
    field? :project_id, :string, null: true
    field? :check_in_id, :string, null: true
    field? :project, :project, null: true
    field? :check_in, :project_check_in, null: true
  end

  object :activity_content_company_adding do
    field? :company, :company, null: true
    field? :creator, :person, null: true
  end

  object :activity_content_company_editing do
    field? :company_id, :string, null: true
    field? :company, :company, null: true
    field? :new_name, :string, null: true
    field? :old_name, :string, null: true
  end

  object :activity_content_company_members_permissions_edited_member do
    field :person_id, :string, null: false
    field :person, :person, null: false
    field :previous_access_level, :integer, null: false
    field :previous_access_level_label, :string, null: false
    field :updated_access_level, :integer, null: false
    field :updated_access_level_label, :string, null: false
  end

  object :activity_content_company_members_permissions_edited do
    field :company_id, :string, null: false
    field :members, list_of(:activity_content_company_members_permissions_edited_member), null: false
  end

  enum(:review_assignment_types,
    values: [
      :check_in,
      :goal_update,
      :space_task,
      :project_task,
      :milestone
    ]
  )

  enum(:review_assignment_roles, values: [ :owner, :reviewer ])

  enum(:review_assignment_origin_types, values: [ :project, :goal, :space ])

  object :review_assignment_origin do
    field :id, :string, null: false
    field :name, :string, null: false
    field :type, :review_assignment_origin_types, null: false
    field :path, :string, null: false
    field :space_name, :string, null: true
    field :due_date, :date, null: true
  end

  object :review_assignment do
    field :resource_id, :string, null: false
    field :name, :string, null: false
    field :due, :date, null: true
    field :type, :review_assignment_types, null: false
    field :role, :review_assignment_roles, null: false
    field :action_label, :string, null: true
    field :path, :string, null: false
    field :origin, :review_assignment_origin, null: false
    field :task_status, :string, null: true
    field :author_id, :string, null: true
    field :author_name, :string, null: true
    field :description, :string, null: true
  end

  union(:update_content,
    types: [
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
      :update_content_review,
      :update_content_project_discussion,
      :update_content_message
    ]
  )

  object :activity_content_project_goal_connection do
    field :project, :project, null: false
    field :goal, :goal, null: true
    field :goal_name, :string, null: true
    field :previous_goal, :goal, null: true
    field :previous_goal_name, :string, null: true
  end

  object :update_content_project_discussion do
    field? :title, :string, null: true
    field? :body, :string, null: true
  end

  object :project_key_resource do
    field :id, :string
    field :project_id, :string
    field :title, :string
    field :link, :string
    field? :resource_type, :string
  end

  object :activity_content_project_moved do
    field? :project, :project, null: true
    field? :old_space, :space, null: true
    field? :new_space, :space, null: true
  end

  object :update_content_project_contributor_removed do
    field? :contributor, :person, null: true
    field? :contributor_id, :string, null: true
    field? :contributor_role, :string, null: true
  end

  object :update_content_project_milestone_created do
    field? :milestone, :milestone, null: true
  end

  object :update_content_project_milestone_deleted do
    field? :milestone, :milestone, null: true
  end

  enum(:reaction_entity_type, values: [
    :project_check_in,
    :project_retrospective,
    :comment_thread,
    :goal_update,
    :message,
    :comment,
    :resource_hub_document,
    :resource_hub_file,
    :resource_hub_link,
  ])

  enum(:reaction_parent_type, values: [
    :project_check_in,
    :project_retrospective,
    :comment_thread,
    :goal_update,
    :message,
    :milestone,
    :project_task,
    :space_task,
    :resource_hub_document,
    :resource_hub_file,
    :resource_hub_link,
  ])

  object :reaction do
    field :id, :string, null: false
    field :emoji, :string, null: false
    field :person, :person, null: true
  end

  object :activity_content_project_pausing do
    field? :company_id, :string, null: true
    field? :project_id, :string, null: true
    field? :project, :project, null: true
  end

  object :activity_content_project_key_resource_added do
    field? :project_id, :string, null: true
    field? :project, :project, null: true
    field? :title, :string, null: true
  end

  object :activity_content_project_key_resource_deleted do
    field? :project_id, :string, null: true
    field? :project, :project, null: true
    field? :title, :string, null: true
  end

  object :activity_content_task_name_editing do
    field? :company_id, :string, null: true
    field? :space_id, :string, null: true
    field? :task_id, :string, null: true
    field? :old_name, :string, null: true
    field? :new_name, :string, null: true
  end

  object :activity_content_task_milestone_updating do
    field :project, :project, null: false
    field :task, :task, null: true
    field :old_milestone, :milestone, null: true
    field :new_milestone, :milestone, null: true
  end

  object :activity_content_milestone_deleting do
    field :project, :project, null: false
    field :milestone_name, :string, null: false
  end

  object :activity_content_task_priority_change do
    field? :company_id, :string, null: true
    field? :space_id, :string, null: true
    field? :task_id, :string, null: true
    field? :old_priority, :string, null: true
    field? :new_priority, :string, null: true
  end

  object :activity_content_project_task_commented do
    field :project, :project, null: false
    field :task, :task, null: true
    field :comment, :comment, null: true
  end

  object :activity_content_space_task_commented do
    field :space, :space, null: false
    field :task, :task, null: true
    field :comment, :comment, null: true
  end

  object :goal_editing_updated_target do
    field? :id, :string, null: true
    field? :old_name, :string, null: true
    field? :new_name, :string, null: true
  end

  object :project do
    field :id, :string
    field :name, :string
    field? :inserted_at, :date, null: true
    field? :updated_at, :date, null: true
    field? :timeframe, :timeframe
    field? :next_update_scheduled_at, :date, null: true
    field? :next_check_in_scheduled_at, :date, null: true
    field? :privacy, :string, null: true
    field :status, :string
    field? :state, :work_map_item_state, null: false
    field :success_status, :success_status
    field? :closed_at, :date, null: true
    field? :retrospective, :project_retrospective, null: true
    field? :description, :string, null: true
    field :goal_id, :string
    field? :goal, :goal, null: true
    field? :last_check_in, :project_check_in, null: true
    field? :milestones, list_of(:milestone), null: true
    field? :contributors, list_of(:project_contributor), null: true
    field? :key_resources, list_of(:project_key_resource), null: true
    field? :is_outdated, :boolean, null: true
    field? :space_id, :string, null: true
    field? :space, :space, null: true
    field? :my_role, :string, null: true
    field? :permissions, :project_permissions, null: true
    field? :next_milestone, :milestone, null: true
    field? :is_pinned, :boolean, null: true
    field? :is_archived, :boolean, null: true
    field? :archived_at, :date, null: true
    field? :champion, :person, null: true
    field? :reviewer, :person, null: true
    field? :access_levels, :access_levels, null: true
    field? :potential_subscribers, list_of(:subscriber), null: true
    field? :notifications, list_of(:notification), null: true
    field? :subscription_list, :subscription_list, null: true
    field? :milestones_ordering_state, list_of(:string), null: true
    field? :task_statuses, list_of(:task_status), null: true
    field? :tasks_kanban_state, :json, null: true
  end

  object :project_children_count do
    field :tasks_count, :integer
    field :discussions_count, :integer
    field :check_ins_count, :integer
  end

  object :project_retrospective do
    field :id, :string
    field :author, :person
    field :project, :project
    field :content, :string
    field :closed_at, :date
    field :permissions, :project_permissions
    field :reactions, list_of(:reaction)
    field :subscription_list, :subscription_list
    field :potential_subscribers, list_of(:subscriber)
    field :notifications, list_of(:notification)
  end

  object :messages_board do
    field? :id, :string, null: true
    field? :name, :string, null: true
    field? :description, :string, null: true
    field? :messages, list_of(:discussion), null: true
    field? :space, :space, null: true
    field? :inserted_at, :datetime, null: true
    field? :updated_at, :datetime, null: true
  end

  object :discussion do
    field :id, :string, null: false
    field :name, :string, null: false
    field? :inserted_at, :date, null: true
    field? :updated_at, :date, null: true
    field? :published_at, :date, null: true
    field? :state, :string, null: true
    field? :author, :person, null: true
    field? :title, :string, null: true
    field? :body, :string, null: true
    field? :space, :space, null: true
    field? :reactions, list_of(:reaction), null: true
    field? :comments, list_of(:comment), null: true
    field? :comments_count, :integer, null: true
    field? :subscription_list, :subscription_list, null: true
    field? :potential_subscribers, list_of(:subscriber), null: true
    field? :notifications, list_of(:notification), null: true
    field? :permissions, :space_permissions, null: true
  end

  object :activity do
    field :id, :string, null: false
    field? :scope_type, :string, null: true
    field? :scope_id, :string, null: true
    field? :resource_id, :string, null: true
    field? :resource_type, :string, null: true
    field :action, :string, null: false
    field :inserted_at, :datetime, null: false
    field? :updated_at, :datetime, null: true
    field? :comment_thread, :comment_thread, null: true
    field? :author, :person, null: true
    field? :resource, :activity_resource_union, null: true
    field? :person, :person, null: true
    field? :event_data, :activity_data_union, null: true
    field :content, :activity_content, null: false
    field? :notifications, list_of(:notification), null: true
    field? :permissions, :activity_permissions, null: true
  end

  enum(:activity_scope_type, values: [:person, :company, :space, :project, :milestone, :task, :goal])

  object :activity_permissions do
    field? :can_comment_on_thread, :boolean, null: true
    field? :can_view, :boolean, null: true
  end

  object :activity_event_data_project_create do
    field? :champion, :person, null: true
  end

  object :activity_content_project_review_commented do
    field? :project_id, :string, null: true
    field? :review_id, :string, null: true
    field? :project, :project, null: true
  end

  object :assignment do
    field? :type, :string, null: true
    field? :due, :date, null: true
    field? :resource, :assignment_resource, null: true
  end

  object :target do
    field? :id, :id, null: true
    field? :index, :integer, null: true
    field? :name, :string, null: true
    field? :from, :float, null: true
    field? :to, :float, null: true
    field? :unit, :string, null: true
    field? :value, :float, null: true
  end

  object :edit_milestone_ordering_state_input do
    field :milestone_id, :id, null: false
    field :ordering_state, list_of(:string), null: false
  end

  enum(:milestone_comment_action, values: Operately.Comments.MilestoneComment.valid_actions())

  object :milestone_comment do
    field :action, :milestone_comment_action, null: false
    field :comment, :comment, null: false
  end

  object :space do
    field :id, :string, null: false
    field :name, :string, null: false

    field? :mission, :string, null: true
    field? :is_member, :boolean, null: true
    field? :is_company_space, :boolean, null: true
    field? :private_space, :boolean, null: true
    field? :icon, :string, null: true
    field? :color, :string, null: true
    field? :permissions, :space_permissions, null: true
    field? :members, list_of(:person), null: true
    field? :access_levels, :access_levels, null: true
    field? :potential_subscribers, list_of(:subscriber), null: true
    field? :notifications, list_of(:notification), null: true
    field? :task_statuses, list_of(:task_status), null: true
    field? :tasks_kanban_state, :json, null: true
  end

  object :panel do
    field? :id, :string, null: true
    field? :type, :string, null: true
    field? :index, :integer, null: true
    field? :linked_resource, :panel_linked_resource, null: true
  end

  object :update_content_message do
    field? :message, :string, null: true
  end

  union(:activity_content,
    types: [
      :activity_content_company_owners_adding,
      :activity_content_company_admin_added,
      :activity_content_company_members_permissions_edited,
      :activity_content_company_member_added,
      :activity_content_company_member_converted_to_guest,
      :activity_content_guest_invited,
      :activity_content_company_editing,
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
      :activity_content_project_contributors_addition,
      :activity_content_project_contributor_edited,
      :activity_content_project_contributor_removed,
      :activity_content_project_created,
      :activity_content_project_discussion_submitted,
      :activity_content_project_goal_connection,
      :activity_content_project_goal_disconnection,
      :activity_content_project_milestone_commented,
      :activity_content_project_description_changed,
      :activity_content_milestone_description_updating,
      :activity_content_goal_description_changed,
      :activity_content_project_moved,
      :activity_content_project_pausing,
      :activity_content_project_renamed,
      :activity_content_project_resuming,
      :activity_content_project_review_acknowledged,
      :activity_content_project_review_commented,
      :activity_content_project_review_request_submitted,
      :activity_content_project_due_date_updating,
      :activity_content_project_start_date_updating,
      :activity_content_project_champion_updating,
      :activity_content_project_reviewer_updating,
      :activity_content_project_review_submitted,
      :activity_content_project_timeline_edited,
      :activity_content_space_task_commented,
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
      :activity_content_task_status_updating,
      :activity_content_task_update
    ]
  )

  object :activity_content_resource_hub_folder_copied do
    field? :space, :space, null: true
    field? :resource_hub, :resource_hub, null: true
    field? :folder, :resource_hub_folder, null: true
    field? :original_folder, :resource_hub_folder, null: true
  end

  object :activity_content_resource_hub_folder_created do
    field? :space, :space, null: true
    field? :resource_hub, :resource_hub, null: true
    field? :folder, :resource_hub_folder, null: true
  end

  object :activity_content_resource_hub_folder_deleted do
    field? :space, :space, null: true
    field? :resource_hub, :resource_hub, null: true
    field? :folder, :resource_hub_folder, null: true
  end

  object :activity_content_resource_hub_folder_renamed do
    field? :space, :space, null: true
    field? :resource_hub, :resource_hub, null: true
    field? :folder, :resource_hub_folder, null: true
    field? :old_name, :string, null: true
    field? :new_name, :string, null: true
  end

  object :activity_content_resource_hub_file_created do
    field? :resource_hub, :resource_hub, null: true
    field? :space, :space, null: true
    field? :files, list_of(:resource_hub_file), null: true
  end

  object :activity_content_resource_hub_file_deleted do
    field? :space, :space, null: true
    field? :resource_hub, :resource_hub, null: true
    field? :file, :resource_hub_file, null: true
  end

  object :activity_content_resource_hub_file_edited do
    field? :space, :space, null: true
    field? :resource_hub, :resource_hub, null: true
    field? :file, :resource_hub_file, null: true
  end

  object :activity_content_resource_hub_file_commented do
    field :space, :space, null: false
    field :file, :resource_hub_file, null: true
    field :comment, :comment, null: true
  end

  object :activity_content_resource_hub_document_created do
    field? :space, :space, null: true
    field? :resource_hub, :resource_hub, null: true
    field? :document, :resource_hub_document, null: true
    field? :copied_document, :resource_hub_document, null: true
  end

  object :activity_content_resource_hub_document_edited do
    field? :space, :space, null: true
    field? :resource_hub, :resource_hub, null: true
    field? :document, :resource_hub_document, null: true
  end

  object :activity_content_resource_hub_document_deleted do
    field? :space, :space, null: true
    field? :resource_hub, :resource_hub, null: true
    field? :document, :resource_hub_document, null: true
  end

  object :activity_content_resource_hub_document_commented do
    field :space, :space, null: false
    field :document, :resource_hub_document, null: true
    field :comment, :comment, null: true
  end

  object :activity_content_resource_hub_link_created do
    field? :space, :space, null: true
    field? :resource_hub, :resource_hub, null: true
    field? :link, :resource_hub_link, null: true
  end

  object :activity_content_resource_hub_link_edited do
    field? :resource_hub, :resource_hub, null: true
    field? :space, :space, null: true
    field? :link, :resource_hub_link, null: true

    field? :previous_name, :string, null: true
    field? :previous_type, :string, null: true
    field? :previous_url, :string, null: true
  end

  object :activity_content_resource_hub_link_deleted do
    field? :resource_hub, :resource_hub, null: true
    field? :space, :space, null: true
    field? :link, :resource_hub_link, null: true
  end

  object :activity_content_resource_hub_link_commented do
    field :space, :space, null: false
    field :link, :resource_hub_link, null: true
    field :comment, :comment, null: true
  end

  object :activity_content_project_discussion_submitted do
    field :title, :string, null: true
    field :project, :project, null: false
    field :discussion, :comment_thread, null: true
  end

  object :activity_content_project_review_acknowledged do
    field? :project_id, :string, null: true
    field? :review_id, :string, null: true
    field? :project, :project, null: true
  end

  object :activity_content_project_timeline_edited do
    field? :project, :project, null: true
    field? :old_start_date, :date, null: true
    field? :new_start_date, :date, null: true
    field? :old_end_date, :date, null: true
    field? :new_end_date, :date, null: true
    field? :new_milestones, list_of(:activity_milestone), null: true
    field? :updated_milestones, list_of(:activity_milestone), null: true
  end

  object :activity_milestone do
    field :id, :string
    field :title, :string
    field :deadline_at, :date
  end

  object :update_content_project_milestone_deadline_changed do
    field? :old_deadline, :string, null: true
    field? :new_deadline, :string, null: true
    field? :milestone, :milestone, null: true
  end

  object :activity_content_goal_check_in do
    field? :goal_id, :string, null: true
    field? :goal, :goal, null: true
    field? :update, :goal_progress_update, null: true

    field? :old_timeframe, :timeframe, null: true
    field? :new_timeframe, :timeframe, null: true
  end

  object :activity_content_discussion_posting do
    field? :company_id, :string, null: true
    field? :space_id, :string, null: true
    field? :title, :string, null: true
    field? :discussion_id, :string, null: true
    field? :space, :space, null: true
    field? :discussion, :discussion, null: true
  end

  object :activity_content_task_name_updating do
    field :space, :space, null: false
    field :project, :project, null: true
    field :task, :task, null: true
    field :old_name, :string, null: false
    field :new_name, :string, null: false
  end

  object :activity_content_task_description_change do
    field :task, :task, null: true
    field :space, :space, null: true
    field :project_name, :string, null: false
    field :has_description, :boolean, null: false
    field :description, :string, null: true
  end

  object :activity_content_task_due_date_updating do
    field :space, :space, null: false
    field :project, :project, null: true
    field :task, :task, null: true
    field :task_name, :string, null: true
    field :old_due_date, :contextual_date, null: false
    field :new_due_date, :contextual_date, null: false
  end

  object :activity_content_task_status_updating do
    field :space, :space, null: false
    field :project, :project, null: true
    field :task, :task, null: true
    field :old_status, :task_status, null: false
    field :new_status, :task_status, null: false
    field :name, :string, null: false
  end

  object :activity_content_milestone_title_updating do
    field :project, :project, null: false
    field :milestone, :milestone, null: true
    field :old_title, :string, null: false
    field :new_title, :string, null: false
  end

  object :activity_content_milestone_due_date_updating do
    field :project, :project, null: false
    field :milestone, :milestone, null: true
    field :milestone_name, :string, null: false
    field :old_due_date, :contextual_date, null: false
    field :new_due_date, :contextual_date, null: false
  end

  object :activity_content_milestone_description_updating do
    field :project, :project, null: false
    field :milestone, :milestone, null: true
    field :milestone_name, :string, null: false
    field :has_description, :boolean, null: false
    field :description, :string, null: true
  end

  object :activity_content_goal_description_changed do
    field :goal, :goal, null: true
    field :goal_name, :string, null: false
    field :has_description, :boolean, null: false
    field :old_description, :string, null: true
    field :new_description, :string, null: true
  end

  object :activity_content_project_description_changed do
    field :project, :project, null: false
    field :project_name, :string, null: false
    field :has_description, :boolean, null: false
    field :description, :string, null: true
  end

  object :activity_content_task_adding do
    field :space, :space
    field :project, :project, null: true
    field :milestone, :milestone, null: true
    field :task, :task, null: true
    field :task_name, :string, null: false
  end

  object :activity_content_task_assignee_updating do
    field :space, :space, null: false
    field :project, :project, null: true
    field :task, :task, null: true
    field :old_assignee, :person
    field :new_assignee, :person
  end

  object :activity_content_task_deleting do
    field :company, :company
    field :space, :space
    field :project, :project, null: true
    field :task_name, :string
  end

  object :update do
    field? :id, :string, null: true
    field? :title, :string, null: true
    field? :inserted_at, :datetime, null: true
    field? :updated_at, :datetime, null: true
    field? :acknowledged, :boolean, null: true
    field? :acknowledged_at, :datetime, null: true
    field? :updatable_id, :string, null: true
    field? :project, :project, null: true
    field? :acknowledging_person, :person, null: true
    field? :message, :string, null: true
    field? :message_type, :string, null: true
    field? :comments, list_of(:comment), null: true
    field? :author, :person, null: true
    field? :reactions, list_of(:reaction), null: true
    field? :content, :update_content, null: true
    field? :comments_count, :integer, null: true
  end

  object :activity_content_goal_created do
    field? :goal, :goal, null: true
  end

  object :activity_content_project_check_in_acknowledged do
    field? :project_id, :string, null: true
    field? :check_in_id, :string, null: true
    field? :project, :project, null: true
    field? :check_in, :project_check_in, null: true
  end

  object :update_content_project_contributor_added do
    field? :contributor_id, :string, null: true
    field? :contributor_role, :string, null: true
    field? :contributor, :person, null: true
  end

  object :update_space_tools_payload do
    field :tasks_enabled, :boolean, null: false
    field :discussions_enabled, :boolean, null: false
    field :resource_hub_enabled, :boolean, null: false
  end

  object :space_tools do
    field :tasks_enabled, :boolean, null: false
    field :discussions_enabled, :boolean, null: false
    field :resource_hub_enabled, :boolean, null: false

    field :projects, list_of(:project), null: true
    field :goals, list_of(:goal), null: true
    field :messages_boards, list_of(:messages_board), null: true
    field :resource_hubs, list_of(:resource_hub), null: true
    field :tasks, list_of(:task), null: true
  end

  object :blob_creation_input do
    field? :filename, :string, null: true
    field? :size, :integer, null: true
    field? :content_type, :string, null: true
    field? :width, :integer, null: true
    field? :height, :integer, null: true
  end

  object :blob_creation_output do
    field? :id, :string, null: true
    field? :url, :string, null: true
    field? :signed_upload_url, :string, null: true
    # "direct", "multipart"
    field? :upload_strategy, :string, null: true
  end

  object :blob do
    field? :id, :string, null: true
    field? :status, :string, null: true
    field? :filename, :string, null: true
    field? :size, :integer, null: true
    field? :content_type, :string, null: true
    field? :height, :integer, null: true
    field? :width, :integer, null: true
    field? :url, :string, null: true
  end

  object :resource_hub do
    field :id, :string, null: false
    field :name, :string, null: false
    field? :description, :string, null: true
    field? :space, :space, null: true
    field? :nodes, list_of(:resource_hub_node), null: true
    field? :potential_subscribers, list_of(:subscriber), null: true
    field? :permissions, :resource_hub_permissions, null: true
    field? :inserted_at, :date, null: true
    field? :updated_at, :date, null: true
  end

  object :resource_hub_permissions do
    field? :can_comment_on_document, :boolean, null: true
    field? :can_comment_on_file, :boolean, null: true
    field? :can_comment_on_link, :boolean, null: true
    field? :can_copy_folder, :boolean, null: true
    field? :can_create_document, :boolean, null: true
    field? :can_create_folder, :boolean, null: true
    field? :can_create_file, :boolean, null: true
    field? :can_create_link, :boolean, null: true
    field? :can_delete_document, :boolean, null: true
    field? :can_delete_file, :boolean, null: true
    field? :can_delete_folder, :boolean, null: true
    field? :can_delete_link, :boolean, null: true
    field? :can_edit_document, :boolean, null: true
    field? :can_edit_parent_folder, :boolean, null: true
    field? :can_edit_file, :boolean, null: true
    field? :can_edit_link, :boolean, null: true
    field? :can_rename_folder, :boolean, null: true
    field? :can_view, :boolean, null: true
  end

  object :resource_hub_folder do
    field? :id, :string, null: true
    field? :resource_hub_id, :string, null: true
    field? :resource_hub, :resource_hub, null: true
    field? :name, :string, null: true
    field? :description, :string, null: true
    field? :nodes, list_of(:resource_hub_node), null: true
    field? :potential_subscribers, list_of(:subscriber), null: true
    field? :permissions, :resource_hub_permissions, null: true
    field? :path_to_folder, list_of(:resource_hub_folder), null: true
    field? :children_count, :integer, null: true
    field? :parent_folder_id, :string, null: true
  end

  object :resource_hub_document do
    field :id, :string, null: false
    field? :author, :person, null: true
    field :resource_hub_id, :string, null: false
    field? :resource_hub, :resource_hub, null: true
    field? :parent_folder, :resource_hub_folder, null: true
    field :parent_folder_id, :string, null: false
    field :name, :string, null: false
    field :content, :string, null: false
    field :state, :string, null: false
    field? :inserted_at, :string, null: true
    field? :updated_at, :date, null: true
    field? :permissions, :resource_hub_permissions, null: true
    field? :reactions, list_of(:reaction), null: true
    field? :comments_count, :integer, null: true
    field? :potential_subscribers, list_of(:subscriber), null: true
    field? :subscription_list, :subscription_list, null: true
    field? :notifications, list_of(:notification), null: true
    field? :path_to_document, list_of(:resource_hub_folder), null: true
  end

  object :resource_hub_file do
    field :id, :string, null: false
    field? :author, :person, null: true
    field? :resource_hub_id, :string, null: true
    field? :resource_hub, :resource_hub, null: true
    field? :parent_folder, :resource_hub_folder, null: true
    field? :parent_folder_id, :string, null: true
    field? :name, :string, null: true
    field? :description, :string, null: true
    field? :potential_subscribers, list_of(:subscriber), null: true
    field? :subscription_list, :subscription_list, null: true
    field? :inserted_at, :string, null: true
    field? :permissions, :resource_hub_permissions, null: true
    field? :reactions, list_of(:reaction), null: true
    field? :comments_count, :integer, null: true
    field? :type, :string, null: true
    field? :size, :integer, null: true
    field? :blob, :blob, null: true
    field? :path_to_file, list_of(:resource_hub_folder), null: true
  end

  object :resource_hub_uploaded_file do
    field? :blob_id, :string, null: true
    field? :preview_blob_id, :string, null: true
    field? :name, :string, null: true
    field? :description, :string, null: true
  end

  object :resource_hub_link do
    field :id, :string, null: false
    field? :author, :person, null: true
    field? :resource_hub_id, :string, null: true
    field? :resource_hub, :resource_hub, null: true
    field? :parent_folder, :resource_hub_folder, null: true
    field? :parent_folder_id, :string, null: true
    field? :name, :string, null: true
    field? :url, :string, null: true
    field? :description, :string, null: true
    field? :type, :string, null: true
    field? :potential_subscribers, list_of(:subscriber), null: true
    field? :subscription_list, :subscription_list, null: true
    field? :inserted_at, :string, null: true
    field? :permissions, :resource_hub_permissions, null: true
    field? :reactions, list_of(:reaction), null: true
    field? :path_to_link, list_of(:resource_hub_folder), null: true
    field? :notifications, list_of(:notification), null: true
    field? :comments_count, :integer, null: true
  end

  object :resource_hub_node do
    field? :id, :string, null: true
    field? :name, :string, null: true
    field? :type, :string, null: true
    field? :inserted_at, :string, null: true
    field? :updated_at, :string, null: true
    field? :folder, :resource_hub_folder, null: true
    field? :document, :resource_hub_document, null: true
    field? :file, :resource_hub_file, null: true
    field? :link, :resource_hub_link, null: true
  end

  object :project_permissions do
    field :can_view, :boolean, null: false
    field :can_comment, :boolean, null: false
    field :can_edit, :boolean, null: false
    field :has_full_access, :boolean, null: false
  end

  object :space_permissions do
    field :can_view, :boolean, null: false
    field :can_comment, :boolean, null: false
    field :can_edit, :boolean, null: false
    field :has_full_access, :boolean, null: false
  end

  union(:activity_data_union,
    types: [
      :activity_event_data_project_create,
      :activity_event_data_milestone_create,
      :activity_event_data_comment_post
    ]
  )

  object :notification do
    field? :id, :string, null: true
    field? :read, :boolean, null: true
    field? :read_at, :datetime, null: true
    field? :activity, :activity, null: true
  end

  object :subscriber do
    field? :role, :string, null: true
    field? :priority, :boolean, null: true
    field? :is_subscribed, :boolean, null: true
    field? :person, :person, null: true
  end

  enum(:task_type, values: [:space, :project])

  object :task do
    field :id, :string
    field :name, :string
    field? :inserted_at, :date, null: true
    field? :updated_at, :date, null: true
    field? :due_date, :contextual_date, null: true
    field? :size, :string, null: true
    field? :priority, :string, null: true
    field? :status, :task_status, null: true
    field? :milestone, :milestone, null: true
    field? :project, :project, null: true
    field? :description, :string, null: true
    field? :assignees, list_of(:person), null: true
    field? :creator, :person, null: true
    field? :project_space, :space, null: true
    field? :space, :space, null: true
    field? :permissions, :project_permissions, null: true
    field? :comments_count, :integer, null: true
    field? :subscription_list, :subscription_list, null: true
    field? :available_statuses, list_of(:task_status), null: true
    field :type, :task_type, null: false
  end

  object :activity_content_discussion_editing do
    field? :company_id, :string, null: true
    field? :space_id, :string, null: true
    field? :discussion_id, :string, null: true
  end

  union(:panel_linked_resource,
    types: [
      :project
    ]
  )

  object :activity_content_group_edited do
    field :company, :company
    field :space, :space
    field :old_name, :string
    field :new_name, :string
    field :old_mission, :string, null: true
    field :new_mission, :string, null: true
  end

  object :activity_content_project_review_request_submitted do
    field? :project_id, :string, null: true
    field? :request_id, :string, null: true
    field? :project, :project, null: true
  end

  object :activity_content_task_assignee_assignment do
    field? :company_id, :string, null: true
    field? :space_id, :string, null: true
    field? :task_id, :string, null: true
    field? :person_id, :string, null: true
  end

  object :goal_permissions do
    field :can_view, :boolean, null: false
    field :can_comment, :boolean, null: false
    field :can_edit, :boolean, null: false
    field :has_full_access, :boolean, null: false
  end

  object :goal_update_permissions do
    field? :can_view, :boolean, null: true
    field? :can_edit, :boolean, null: true
    field? :can_delete, :boolean, null: true
    field? :can_acknowledge, :boolean, null: true
    field? :can_comment, :boolean, null: true
  end

  object :activity_content_project_contributor_addition do
    field? :company_id, :string, null: true
    field? :project_id, :string, null: true
    field? :person_id, :string, null: true
    field? :person, :person, null: true
    field? :project, :project, null: true
  end

  object :activity_content_project_contributors_addition do
    field? :project, :project, null: true
    field? :contributors, list_of(:project_contributors_addition_contributor), null: true
  end

  object :project_contributors_addition_contributor do
    field? :person, :person, null: true
    field? :responsibility, :string, null: true
  end

  object :activity_content_project_contributor_edited do
    field? :company_id, :string, null: true
    field? :project_id, :string, null: true
    field? :person_id, :string, null: true
    field? :project, :project, null: true
    field? :previous_contributor, :activity_content_project_contributor_edited_contributor, null: true
    field? :updated_contributor, :activity_content_project_contributor_edited_contributor, null: true
  end

  object :activity_content_project_contributor_edited_contributor do
    field? :person_id, :string, null: true
    field? :person, :person, null: true
    field? :role, :string, null: true
    field? :permissions, :integer, null: true
  end

  object :activity_content_project_contributor_removed do
    field? :company_id, :string, null: true
    field? :project_id, :string, null: true
    field? :person_id, :string, null: true
    field? :person, :person, null: true
    field? :project, :project, null: true
  end

  object :invite_link do
    field? :id, :string, null: true
    field? :token, :string, null: true
    field? :type, :string, null: true
    field? :company_id, :string, null: true
    field? :author, :person, null: true
    field? :company, :company, null: true
    field? :expires_at, :datetime, null: true
    field? :use_count, :integer, null: true
    field? :is_active, :boolean, null: true
    field? :inserted_at, :datetime, null: true
    field? :allowed_domains, list_of(:string), null: true
  end

  object :activity_event_data_milestone_create do
    field? :title, :string, null: true
  end

  object :activity_content_goal_check_in_acknowledgement do
    field? :goal, :goal, null: true
    field? :update, :goal_progress_update, null: true
  end

  object :activity_content_project_archived do
    field? :project_id, :string, null: true
    field? :project, :project, null: true
  end

  enum(:goal_privacy_values,
    values: [
      :public,
      :internal,
      :confidential,
      :secret
    ]
  )

  enum(:goal_status,
    values: [
      :on_track,
      :achieved,
      :missed,
      :paused,
      :caution,
      :off_track,
      :pending,
      :outdated
    ]
  )

  object :goal do
    field :id, :string, null: false
    field :name, :string, null: false
    field :status, :goal_status, null: false

    field? :inserted_at, :date, null: true
    field? :updated_at, :date, null: true
    field? :next_update_scheduled_at, :date, null: true
    field? :parent_goal_id, :string, null: true
    field? :closed_at, :date, null: true
    field? :timeframe, :timeframe, null: true
    field? :description, :string, null: true
    field? :champion, :person, null: true
    field? :reviewer, :person, null: true
    field? :closed_by, :person, null: true
    field? :targets, list_of(:target), null: true
    field? :projects, list_of(:project), null: true
    field? :parent_goal, :goal, null: true
    field? :progress_percentage, :float, null: true
    field? :last_check_in_id, :id, null: true
    field? :last_check_in, :goal_progress_update, null: true
    field? :permissions, :goal_permissions, null: true
    field? :is_archived, :boolean, null: true
    field? :is_closed, :boolean, null: true
    field? :archived_at, :date, null: true
    field? :is_outdated, :boolean, null: true
    field? :space, :space, null: true
    field? :my_role, :string, null: true
    field? :access_levels, :access_levels, null: true
    field? :privacy, :goal_privacy_values, null: true
    field? :potential_subscribers, list_of(:subscriber), null: true
    field? :notifications, list_of(:notification), null: true
    field? :success, :boolean, null: true
    field? :retrospective, :goal_retrospective, null: true
    field? :checklist, list_of(:goal_check)
  end

  object :goal_check do
    field :id, :id
    field :name, :string
    field :completed, :boolean
    field :index, :integer
    field :inserted_at, :date
    field :updated_at, :date
  end

  object :goal_discussion do
    field :id, :id, null: false
    field :title, :string, null: false
    field :inserted_at, :date, null: false
    field :comment_count, :integer, null: false
    field :author, :person, null: false
    field :content, :string, null: false
  end

  object :goal_retrospective do
    field :id, :id, null: false
    field :title, :string, null: false
    field :inserted_at, :date, null: false
    field :comment_count, :integer, null: false
    field :author, :person, null: false
    field :content, :string, null: false
  end

  object :activity_content_project_resuming do
    field? :company_id, :string, null: true
    field? :project_id, :string, null: true
    field? :project, :project, null: true
  end

  object :activity_content_task_reopening do
    field? :company_id, :string, null: true
    field? :space_id, :string, null: true
    field? :task_id, :string, null: true
  end

  object :activity_content_discussion_comment_submitted do
    field :discussion, :discussion, null: true
    field :comment, :comment, null: true
    field :space, :space, null: false
  end

  object :update_content_project_created do
    field? :creator_role, :string, null: true
    field? :creator, :person, null: true
    field? :champion, :person, null: true
  end

  object :activity_content_goal_discussion_editing do
    field? :company_id, :string, null: true
    field? :space_id, :string, null: true
    field? :goal_id, :string, null: true
    field? :activity_id, :string, null: true
  end

  object :activity_content_task_status_change do
    field? :company_id, :string, null: true
    field? :task_id, :string, null: true
    field? :status, :string, null: true
  end

  object :activity_content_task_update do
    field? :company_id, :string, null: true
    field? :task_id, :string, null: true
    field? :name, :string, null: true
  end

  object :activity_event_data_comment_post do
    field? :update_id, :string, null: true
  end

  object :activity_content_project_goal_disconnection do
    field? :project, :project, null: true
    field? :goal, :goal, null: true
  end

  object :person do
    field :id, :string
    field :full_name, :string
    field :title, :string
    field :avatar_url, :string, null: true
    field? :avatar_blob_id, :string, null: true
    field :email, :string
    field :type, :string
    field? :description, :string, null: true

    field? :timezone, :string, null: true
    field? :send_daily_summary, :boolean, null: true
    field? :notify_on_mention, :boolean, null: true
    field? :notify_about_assignments, :boolean, null: false
    field? :suspended, :boolean, null: true
    field? :company, :company, null: true
    field? :manager, :person, null: true
    field? :reports, list_of(:person), null: true
    field? :peers, list_of(:person), null: true
    field? :access_level, :integer, null: true
    field? :has_open_invitation, :boolean, null: true
    field? :invite_link, :invite_link, null: true
    field? :show_dev_bar, :boolean, null: true
    field? :permissions, :person_permissions, null: true
    field? :agent_def, :agent_def
  end

  object :agent_def do
    field :definition, :string
    field :sandbox_mode, :boolean
    field :planning_instructions, :string
    field :task_execution_instructions, :string
    field :daily_run, :boolean
    field :verbose_logs, :boolean
    field :provider, :string
  end

  object :agent_run do
    field :id, :string
    field :status, :string
    field :started_at, :datetime
    field :sandbox_mode, :boolean

    field? :logs, :string
  end

  object :agent_conversation do
    field :id, :id
    field :title, :string
    field :messages, list_of(:agent_message)
    field :created_at, :datetime
    field :updated_at, :datetime
  end

  enum(:create_conversation_context_type, values: [:goal, :project])
  enum(:agent_message_sender, values: [:user, :ai])
  enum(:agent_message_status, values: [:pending, :done])

  object :agent_message do
    field :id, :string
    field :content, :string
    field :timestamp, :date
    field :sender, :agent_message_sender
    field :status, :agent_message_status
  end

  object :person_permissions do
    field :can_edit_profile, :boolean, null: true
  end

  object :project_health do
    field? :status, :string, null: true
    field? :status_comments, :string, null: true
    field? :schedule, :string, null: true
    field? :schedule_comments, :string, null: true
    field? :budget, :string, null: true
    field? :budget_comments, :string, null: true
    field? :team, :string, null: true
    field? :team_comments, :string, null: true
    field? :risks, :string, null: true
    field? :risks_comments, :string, null: true
  end

  object :activity_content_goal_closing do
    field :success_status, :success_status
    field :goal, :goal
  end

  object :activity_content_goal_editing do
    field? :goal, :goal, null: true
    field? :company_id, :string, null: true
    field? :goal_id, :string, null: true
    field? :old_name, :string, null: true
    field? :new_name, :string, null: true
    field? :old_timeframe, :timeframe, null: true
    field? :new_timeframe, :timeframe, null: true
    field? :old_champion_id, :string, null: true
    field? :new_champion_id, :string, null: true
    field? :old_reviewer_id, :string, null: true
    field? :new_reviewer_id, :string, null: true
    field? :new_champion, :person, null: true
    field? :new_reviewer, :person, null: true
    field? :added_targets, list_of(:target), null: true
    field? :updated_targets, list_of(:goal_editing_updated_target), null: true
    field? :deleted_targets, list_of(:target), null: true
  end

  object :activity_content_task_closing do
    field? :company_id, :string, null: true
    field? :space_id, :string, null: true
    field? :task_id, :string, null: true
  end

  object :update_content_review do
    field? :survey, :string, null: true
    field? :previous_phase, :string, null: true
    field? :new_phase, :string, null: true
    field? :review_reason, :string, null: true
    field? :review_request_id, :string, null: true
  end

  object :update_content_status_update do
    field? :message, :string, null: true
    field? :old_health, :string, null: true
    field? :new_health, :string, null: true
    field? :next_milestone_id, :string, null: true
    field? :next_milestone_title, :string, null: true
    field? :next_milestone_due_date, :string, null: true
    field? :phase, :string, null: true
    field? :phase_start, :string, null: true
    field? :phase_end, :string, null: true
    field? :project_start_time, :string, null: true
    field? :project_end_time, :string, null: true
    field? :health, :project_health, null: true
  end

  object :activity_content_project_closed do
    field? :project, :project, null: true
  end

  object :update_content_project_milestone_completed do
    field? :milestone, :milestone, null: true
  end

  union(:activity_resource_union,
    types: [
      :project,
      :update,
      :milestone,
      :comment
    ]
  )

  object :activity_content_goal_discussion_creation do
    field :goal, :goal, null: false
  end

  enum(:milestone_status, values: Operately.Projects.Milestone.valid_status())

  object :milestone do
    field :id, :string, null: false
    field? :project, :project, null: true
    field? :creator, :person, null: true
    field :title, :string, null: false
    field :status, :milestone_status
    field :inserted_at, :date
    field :timeframe, :timeframe, null: true
    field :completed_at, :date
    field? :description, :string, null: true
    field? :comments, list_of(:milestone_comment), null: true
    field? :comments_count, :integer, null: true
    field? :tasks_kanban_state, :json, null: true
    field? :tasks_ordering_state, list_of(:string), null: true
    field? :permissions, :project_permissions, null: true
    field? :subscription_list, :subscription_list, null: true
    field? :space, :space, null: true
    field? :available_statuses, list_of(:task_status), null: true
  end

  object :activity_content_goal_check_in_edit do
    field? :company_id, :string, null: true
    field? :goal_id, :string, null: true
    field? :check_in_id, :string, null: true
  end

  object :assignments do
    field? :assignments, list_of(:assignment), null: true
  end

  object :company do
    field :id, :string, null: false
    field :name, :string, null: false
    field? :mission, :string, null: true
    field :setup_completed, :boolean, null: false
    field? :trusted_email_domains, list_of(:string), null: true
    field? :enabled_experimental_features, list_of(:string), null: true
    field? :company_space_id, :string, null: true
    field? :admins, list_of(:person), null: true
    field? :owners, list_of(:person), null: true
    field? :people, list_of(:person), null: true
    field? :member_count, :integer, null: true
    field? :permissions, :company_permissions, null: true
    field? :general_space, :space
  end

  object :company_permissions do
    field :can_view, :boolean, null: false
    field :is_admin, :boolean, null: false
    field :can_edit_trusted_email_domains, :boolean, null: false
    field :can_invite_members, :boolean, null: false
    field :can_remove_members, :boolean, null: false
    field :can_create_space, :boolean, null: false
    field :can_manage_admins, :boolean, null: false
    field :can_manage_owners, :boolean, null: false
    field :can_edit_members_access_levels, :boolean, null: false
  end

  object :space_setup_input do
    field :name, :string
    field :description, :string
  end

  object :activity_content_goal_timeframe_editing do
    field? :goal, :goal, null: true
    field? :old_timeframe, :timeframe, null: true
    field? :new_timeframe, :timeframe, null: true
  end

  object :activity_content_task_size_change do
    field? :company_id, :string, null: true
    field? :space_id, :string, null: true
    field? :task_id, :string, null: true
    field? :old_size, :string, null: true
    field? :new_size, :string, null: true
  end

  object :timeframe do
    field :contextual_start_date, :contextual_date, null: true
    field :contextual_end_date, :contextual_date, null: true
  end

  enum(:contextual_date_type, values: Operately.ContextualDates.ContextualDate.valid_types())

  object :contextual_date do
    field :date_type, :contextual_date_type
    field :value, :string
    field :date, :date
  end

  object :activity_content_project_milestone_commented do
    field :project, :project, null: false
    field :milestone, :milestone, null: true
    field :comment_action, :string, null: false
    field :comment, :comment, null: false
  end

  object :activity_content_project_review_submitted do
    field? :project_id, :string, null: true
    field? :review_id, :string, null: true
    field? :project, :project, null: true
  end

  object :comment_thread do
    field :id, :string, null: false
    field :inserted_at, :date, null: false
    field :title, :string, null: true
    field :message, :string, null: true
    field? :reactions, list_of(:reaction), null: true
    field? :comments, list_of(:comment), null: true
    field? :comments_count, :integer, null: true
    field? :author, :person, null: true
    field? :subscription_list, :subscription_list, null: true
    field? :potential_subscribers, list_of(:subscriber), null: true
    field? :notifications, list_of(:notification)
    field? :project, :project
    field? :project_permissions, :project_permissions
    field? :space, :space
    field? :can_comment, :boolean
  end

  enum(:comment_parent_type,
    values: [
      :project_check_in,
      :project_retrospective,
      :comment_thread,
      :goal_update,
      :message,
      :resource_hub_document,
      :resource_hub_file,
      :resource_hub_link,
      :space_task,
      :project_task,
      :milestone
    ]
  )

  object :comment do
    field? :id, :string, null: true
    field? :inserted_at, :datetime, null: true
    field? :content, :string, null: true
    field? :author, :person, null: true
    field? :reactions, list_of(:reaction), null: true
    field? :notification, :notification, null: true
  end

  union(:assignment_resource,
    types: [
      :project,
      :milestone
    ]
  )

  object :activity_content_comment_added do
    field? :comment, :comment, null: true
    field? :activity, :activity, null: true
  end

  object :activity_content_company_admin_added do
    field? :company, :company, null: true
    field? :people, list_of(:person), null: true
  end

  object :activity_content_company_owners_adding do
    field? :company, :company, null: true
    field? :people, list_of(:activity_content_company_owners_adding_person), null: true
  end

  object :activity_content_company_owners_adding_person do
    field? :person, :person, null: true
  end

  object :activity_content_company_admin_removed do
    field? :company, :company, null: true
    field? :person, :person, null: true
  end

  object :activity_content_project_renamed do
    field? :project, :project, null: true
    field? :old_name, :string, null: true
    field? :new_name, :string, null: true
  end

  object :project_review_request do
    field? :id, :string, null: true
    field? :inserted_at, :date, null: true
    field? :updated_at, :date, null: true
    field? :status, :string, null: true
    field? :review_id, :string, null: true
    field? :content, :string, null: true
    field? :author, :person, null: true
  end

  object :update_content_project_end_time_changed do
    field? :old_end_time, :string, null: true
    field? :new_end_time, :string, null: true
  end

  object :activity_content_goal_reopening do
    field? :company_id, :string, null: true
    field? :goal_id, :string, null: true
    field? :message, :string, null: true
    field? :goal, :goal, null: true
  end

  object :activity_content_goal_reparent do
    field? :goal, :goal, null: true
    field? :old_parent_goal, :goal, null: true
    field? :new_parent_goal, :goal, null: true
  end

  object :activity_content_project_created do
    field? :project_id, :string, null: true
    field? :project, :project, null: true
  end

  enum(:project_check_in_status, values: Operately.Projects.CheckIn.valid_status())

  object :project_check_in do
    field :id, :string
    field :status, :project_check_in_status
    field :inserted_at, :date, null: true
    field :description, :string, null: true
    field :author, :person, null: true
    field :project, :project, null: true
    field :space, :space, null: true
    field :acknowledged_at, :datetime, null: true
    field :acknowledged_by, :person, null: true
    field? :reactions, list_of(:reaction), null: true
    field? :subscription_list, :subscription_list, null: true
    field? :potential_subscribers, list_of(:subscriber), null: true
    field? :notifications, list_of(:notification), null: true
    field? :comments_count, :integer, null: true
  end

  object :activity_content_project_check_in_commented do
    field :project, :project, null: false
    field :check_in, :project_check_in, null: false
    field :comment, :comment, null: true
  end

  object :activity_content_goal_check_in_commented do
    field :goal, :goal, null: false
    field :update, :goal_progress_update, null: true
    field :comment, :comment, null: true
  end

  object :activity_content_project_retrospective_commented do
    field :project, :project, null: false
    field :comment, :comment, null: true
  end

  object :update_content_project_start_time_changed do
    field? :old_start_time, :string, null: true
    field? :new_start_time, :string, null: true
  end

  object :project_contributor do
    field :id, :string
    field :responsibility, :string, null: true
    field :role, :string, null: true
    field? :person, :person, null: true
    field :access_level, :integer, null: true
    field? :project, :project, null: true
  end

  object :create_target_input do
    field? :name, :string, null: true
    field? :from, :float, null: true
    field? :to, :float, null: true
    field? :unit, :string, null: true
    field? :index, :integer, null: true
  end

  object :update_target_input do
    field? :id, :id, null: true
    field? :name, :string, null: true
    field? :from, :float, null: true
    field? :to, :float, null: true
    field? :unit, :string, null: true
    field? :index, :integer, null: true
  end

  enum(:project_task_status_color, values: Operately.Tasks.Status.valid_colors())

  object :task_status do
    field :id, :string, null: false
    field :label, :string, null: false
    field :color, :project_task_status_color, null: false
    field :index, :integer, null: false
    field :value, :string, null: false
    field :closed, :boolean, null: false
  end

  object :deleted_status_replacement do
    field :deleted_status_id, :string, null: false
    field :replacement_status_id, :string, null: false
  end

  object :add_member_input do
    field? :id, :id, null: true
    field? :access_level, :integer, null: true
  end

  object :edit_member_permissions_input do
    field? :id, :id, null: true
    field? :access_level, :integer, null: true
  end

  object :edit_company_member_permissions_input do
    field :id, :id, null: false
    field :access_level, :access_options, null: false
  end

  object :edit_project_timeline_milestone_update_input do
    field :id, :string
    field :title, :string
    field :description, :string, null: true
    field :due_date, :contextual_date
  end

  object :edit_project_timeline_new_milestone_input do
    field :title, :string
    field :description, :string, null: true
    field :due_date, :contextual_date
  end

  object :goal_progress_update do
    field :id, :string, null: false
    field? :status, :string, null: true
    field? :message, :string, null: true
    field? :inserted_at, :datetime, null: true
    field? :author, :person, null: true
    field? :acknowledged, :boolean, null: true
    field? :acknowledged_at, :datetime, null: true
    field? :acknowledging_person, :person, null: true
    field? :reactions, list_of(:reaction), null: true
    field? :goal_target_updates, list_of(:goal_target_updates), null: true
    field? :checklist, list_of(:goal_check_update), null: true
    field? :comments_count, :integer, null: true
    field? :goal, :goal, null: true
    field? :subscription_list, :subscription_list, null: true
    field? :potential_subscribers, list_of(:subscriber), null: true
    field? :notifications, list_of(:notification), null: true
    field? :timeframe, :timeframe, null: true
    field? :permissions, :goal_update_permissions, null: true
  end

  object :goal_target_updates do
    field? :id, :string, null: true
    field? :index, :integer, null: true
    field? :name, :string, null: true
    field? :from, :float, null: true
    field? :to, :float, null: true
    field? :unit, :string, null: true
    field? :value, :float, null: true
    field? :previous_value, :float, null: true
  end

  object :goal_check_update do
    field :id, :id
    field :name, :string
    field :completed, :boolean
    field :index, :integer
  end

  enum(:subscription_parent_type, values: [
    :project_check_in,
    :project_retrospective,
    :goal_update,
    :message,
    :resource_hub_document,
    :resource_hub_file,
    :resource_hub_link,
    :comment_thread,
    :project,
    :milestone,
    :project_task,
  ])

  object :subscription_list do
    field :id, :string, null: false
    field :parent_type, :subscription_parent_type, null: false
    field :send_to_everyone, :boolean, null: false
    field :subscriptions, list_of(:subscription), null: true
  end

  object :subscription do
    field :id, :string, null: false
    field :type, :string, null: false
    field :canceled, :boolean, null: false
    field :person, :person, null: true
  end

  object :project_contributor_input do
    field :person_id, :id, null: false
    field :responsibility, :string, null: true
    field :access_level, :access_options, null: false
  end

  enum(:work_map_item_type, values: [:project, :goal])

  enum(:work_map_item_status,
    values: [
      :on_track,
      :achieved,
      :missed,
      :paused,
      :caution,
      :off_track,
      :pending,
      :outdated
    ]
  )

  enum(:work_map_item_privacy, values: [:public, :internal, :confidential, :secret])
  enum(:work_map_item_state, values: [:active, :paused, :closed])

  object :work_map_item do
    field :id, :string, null: false
    field :parent_id, :string, null: true
    field :name, :string, null: false
    field :state, :work_map_item_state, null: false
    field :status, :work_map_item_status, null: false
    field :task_status, :task_status, null: true
    field :progress, :float, null: false
    field :space, :space, null: true
    field :space_path, :string, null: true
    field :project, :project, null: true
    field :project_path, :string, null: true
    field :owner, :person, null: true
    field :owner_path, :string, null: true
    field :reviewer, :person, null: true
    field :reviewer_path, :string, null: true
    field :next_step, :string, null: false
    field :is_new, :boolean, null: false
    field :completed_on, :date, null: true
    field :timeframe, :timeframe, null: true
    field :children, list_of(:work_map_item), null: false
    field :type, :work_map_item_type, null: false
    field :item_path, :string, null: false
    field :privacy, :work_map_item_privacy, null: false

    field? :assignees, list_of(:person), null: true
  end

  enum(:success_status, values: [:achieved, :missed])
end
