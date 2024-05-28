defmodule OperatelyWeb.Jsonapi.Types.People do
  # use OperatelyWeb.Jsonapi.Types.Base

  # object :blob do
  #   field :author, :person
  #   field :status, :string
  #   field :filename, :string
  #   field :url, :string
  #   field :signed_upload_url, :string
  # end

  # object :comment_thread do
  #   field :id, :id
  #   field :inserted_at, :datetime
  #   field :title, :string

  #   field :message, :string
  #   field :reactions, list_of(:reaction)
  #   field :comments, list_of(:comment)
  #   field :comments_count, :integer
  #   field :author, :person
  # end

  # object :comment do
  #   field :id, :id
  #   field :inserted_at, :datetime
  #   field :content, :string
  #   field :author, :person
  #   field :reactions, list_of(:reaction)
  # end

  # object :person do
  #   field :id, :id, required: true
  #   field :email, :string, required: true
  #   field :name, :string, required: true
  #   field :avatar_url, :string
  #   field :created_at, :datetime, required: true
  #   field :updated_at, :datetime, required: true

  #   field :activities, list_of(:activity)
  #   field :comments, list_of(:comment)
  #   field :projects, list_of(:project)
  #   field :milestones, list_of(:milestone)
  #   field :updates, list_of(:update)
  # end

  # object :activities do
  #   field :id, :id, required: true
  #   field :scope_type, :string, required: true
  #   field :scope_id, :id, required: true
  #   field :resource_id, :id, required: true
  #   field :resource_type, :string, required: true
  #   field :action_type, :string, required: true
  #   field :inserted_at, :datetime, required: true
  #   field :updated_at, :datetime, required: true
  #   field :author, :person, required: true
  #   field :person, :person, required: true
  #   field :comment_thread, :comment_thread

  #   field :resource, one_of(:project, :update, :milestone, :comment)

  #   field :content, one_of(
  #     :activity_content_comment_added,
  #     :activity_content_discussion_comment_submitted,
  #     :activity_content_discussion_editing,
  #     :activity_content_discussion_posting,
  #     :activity_content_goal_archived,
  #     :activity_content_goal_check_in,
  #     :activity_content_goal_check_in_acknowledgement,
  #     :activity_content_goal_check_in_edit,
  #     :activity_content_goal_closing,
  #     :activity_content_goal_created,
  #     :activity_content_goal_discussion_creation,
  #     :activity_content_goal_discussion_editing,
  #     :activity_content_goal_editing,
  #     :activity_content_goal_reopening,
  #     :activity_content_goal_reparent,
  #     :activity_content_goal_timeframe_editing,
  #     :activity_content_group_edited,
  #     :activity_content_project_archived,
  #     :activity_content_project_check_in_acknowledged,
  #     :activity_content_project_check_in_commented,
  #     :activity_content_project_check_in_edit,
  #     :activity_content_project_closed,
  #     :activity_content_project_contributor_addition,
  #     :activity_content_project_created,
  #     :activity_content_project_discussion_submitted,
  #     :activity_content_project_goal_connection,
  #     :activity_content_project_goal_disconnection,
  #     :activity_content_project_milestone_commented,
  #     :activity_content_project_moved,
  #     :activity_content_project_pausing,
  #     :activity_content_project_renamed,
  #     :activity_content_project_resuming,
  #     :activity_content_project_review_acknowledged,
  #     :activity_content_project_review_commented,
  #     :activity_content_project_review_request_submitted,
  #     :activity_content_project_review_submitted,
  #     :activity_content_project_timeline_edited,
  #     :activity_content_space_joining,
  #     :activity_content_task_adding,
  #     :activity_content_task_assignee_assignment,
  #     :activity_content_task_closing,
  #     :activity_content_task_description_change,
  #     :activity_content_task_name_editing,
  #     :activity_content_task_priority_change,
  #     :activity_content_task_reopening,
  #     :activity_content_task_size_change,
  #     :activity_content_task_status_cha,
  #     :activity_content_task_update,
  #   ) 
  # end
end
