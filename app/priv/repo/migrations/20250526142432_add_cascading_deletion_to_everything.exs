defmodule Operately.Repo.Migrations.AddCascadingDeletionToEverything do
  use Ecto.Migration

  def up do
    execute("""
      ALTER TABLE access_contexts DROP CONSTRAINT IF EXISTS access_contexts_resource_hub_id_fkey;
    """)

    execute("""
      ALTER TABLE access_contexts ADD CONSTRAINT access_contexts_resource_hub_id_fkey FOREIGN KEY (resource_hub_id) REFERENCES public.resource_hubs(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE access_group_memberships DROP CONSTRAINT IF EXISTS access_group_memberships_group_id_fkey;
    """)

    execute("""
      ALTER TABLE access_group_memberships ADD CONSTRAINT access_group_memberships_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.access_groups(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_person_id_fkey;
    """)

    execute("""
      ALTER TABLE activities ADD CONSTRAINT activities_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE blobs DROP CONSTRAINT IF EXISTS blobs_author_id_fkey;
    """)

    execute("""
      ALTER TABLE blobs ADD CONSTRAINT blobs_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.people(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE blobs DROP CONSTRAINT IF EXISTS blobs_company_id_fkey;
    """)

    execute("""
      ALTER TABLE blobs ADD CONSTRAINT blobs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_company_space_id_fkey;
    """)

    execute("""
      ALTER TABLE companies ADD CONSTRAINT companies_company_space_id_fkey FOREIGN KEY (company_space_id) REFERENCES public.groups(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE dashboard_panels DROP CONSTRAINT IF EXISTS dashboard_panels_dashboard_id_fkey;
    """)

    execute("""
      ALTER TABLE dashboard_panels ADD CONSTRAINT dashboard_panels_dashboard_id_fkey FOREIGN KEY (dashboard_id) REFERENCES public.dashboards(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE dashboards DROP CONSTRAINT IF EXISTS dashboards_company_id_fkey;
    """)

    execute("""
      ALTER TABLE dashboards ADD CONSTRAINT dashboards_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE goal_updates DROP CONSTRAINT IF EXISTS goal_updates_subscription_list_id_fkey;
    """)

    execute("""
      ALTER TABLE goal_updates ADD CONSTRAINT goal_updates_subscription_list_id_fkey FOREIGN KEY (subscription_list_id) REFERENCES public.subscription_lists(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_champion_id_fkey;
    """)

    execute("""
      ALTER TABLE goals ADD CONSTRAINT goals_champion_id_fkey FOREIGN KEY (champion_id) REFERENCES public.people(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_closed_by_id_fkey;
    """)

    execute("""
      ALTER TABLE goals ADD CONSTRAINT goals_closed_by_id_fkey FOREIGN KEY (closed_by_id) REFERENCES public.people(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_creator_id_fkey;
    """)

    execute("""
      ALTER TABLE goals ADD CONSTRAINT goals_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.people(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_group_id_fkey;
    """)

    execute("""
      ALTER TABLE goals ADD CONSTRAINT goals_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_parent_goal_id_fkey;
    """)

    execute("""
      ALTER TABLE goals ADD CONSTRAINT goals_parent_goal_id_fkey FOREIGN KEY (parent_goal_id) REFERENCES public.goals(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_reviewer_id_fkey;
    """)

    execute("""
      ALTER TABLE goals ADD CONSTRAINT goals_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.people(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE key_results DROP CONSTRAINT IF EXISTS key_results_group_id_fkey;
    """)

    execute("""
      ALTER TABLE key_results ADD CONSTRAINT key_results_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE key_results DROP CONSTRAINT IF EXISTS key_results_objective_id_fkey;
    """)

    execute("""
      ALTER TABLE key_results ADD CONSTRAINT key_results_objective_id_fkey FOREIGN KEY (objective_id) REFERENCES public.objectives(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE key_results DROP CONSTRAINT IF EXISTS key_results_owner_id_fkey;
    """)

    execute("""
      ALTER TABLE key_results ADD CONSTRAINT key_results_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.people(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE kpi_metrics DROP CONSTRAINT IF EXISTS kpi_metrics_kpi_id_fkey;
    """)

    execute("""
      ALTER TABLE kpi_metrics ADD CONSTRAINT kpi_metrics_kpi_id_fkey FOREIGN KEY (kpi_id) REFERENCES public.kpis(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE kpis DROP CONSTRAINT IF EXISTS kpis_tenet_id_fkey;
    """)

    execute("""
      ALTER TABLE kpis ADD CONSTRAINT kpis_tenet_id_fkey FOREIGN KEY (tenet_id) REFERENCES public.tenets(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE members DROP CONSTRAINT IF EXISTS members_group_id_fkey;
    """)

    execute("""
      ALTER TABLE members ADD CONSTRAINT members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_messages_board_id_fkey;
    """)

    execute("""
      ALTER TABLE messages ADD CONSTRAINT messages_messages_board_id_fkey FOREIGN KEY (messages_board_id) REFERENCES public.messages_boards(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_space_id_fkey;
    """)

    execute("""
      ALTER TABLE messages ADD CONSTRAINT messages_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.groups(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_subscription_list_id_fkey;
    """)

    execute("""
      ALTER TABLE messages ADD CONSTRAINT messages_subscription_list_id_fkey FOREIGN KEY (subscription_list_id) REFERENCES public.subscription_lists(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE milestone_comments DROP CONSTRAINT IF EXISTS milestone_comments_comment_id_fkey;
    """)

    execute("""
      ALTER TABLE milestone_comments ADD CONSTRAINT milestone_comments_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE milestone_comments DROP CONSTRAINT IF EXISTS milestone_comments_milestone_id_fkey;
    """)

    execute("""
      ALTER TABLE milestone_comments ADD CONSTRAINT milestone_comments_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.project_milestones(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE objectives DROP CONSTRAINT IF EXISTS objectives_group_id_fkey;
    """)

    execute("""
      ALTER TABLE objectives ADD CONSTRAINT objectives_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE objectives DROP CONSTRAINT IF EXISTS objectives_owner_id_fkey;
    """)

    execute("""
      ALTER TABLE objectives ADD CONSTRAINT objectives_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.people(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE objectives DROP CONSTRAINT IF EXISTS objectives_tenet_id_fkey;
    """)

    execute("""
      ALTER TABLE objectives ADD CONSTRAINT objectives_tenet_id_fkey FOREIGN KEY (tenet_id) REFERENCES public.tenets(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE people DROP CONSTRAINT IF EXISTS people_manager_id_fkey;
    """)

    execute("""
      ALTER TABLE people ADD CONSTRAINT people_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.people(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE project_check_ins DROP CONSTRAINT IF EXISTS project_check_ins_acknowledged_by_id_fkey;
    """)

    execute("""
      ALTER TABLE project_check_ins ADD CONSTRAINT project_check_ins_acknowledged_by_id_fkey FOREIGN KEY (acknowledged_by_id) REFERENCES public.people(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE project_check_ins DROP CONSTRAINT IF EXISTS project_check_ins_project_id_fkey;
    """)

    execute("""
      ALTER TABLE project_check_ins ADD CONSTRAINT project_check_ins_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE project_check_ins DROP CONSTRAINT IF EXISTS project_check_ins_subscription_list_id_fkey;
    """)

    execute("""
      ALTER TABLE project_check_ins ADD CONSTRAINT project_check_ins_subscription_list_id_fkey FOREIGN KEY (subscription_list_id) REFERENCES public.subscription_lists(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE project_documents DROP CONSTRAINT IF EXISTS project_documents_author_id_fkey;
    """)

    execute("""
      ALTER TABLE project_documents ADD CONSTRAINT project_documents_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.people(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE project_key_resources DROP CONSTRAINT IF EXISTS project_key_resources_project_id_fkey;
    """)

    execute("""
      ALTER TABLE project_key_resources ADD CONSTRAINT project_key_resources_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE project_retrospectives DROP CONSTRAINT IF EXISTS project_retrospectives_author_id_fkey;
    """)

    execute("""
      ALTER TABLE project_retrospectives ADD CONSTRAINT project_retrospectives_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.people(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE project_retrospectives DROP CONSTRAINT IF EXISTS project_retrospectives_project_id_fkey;
    """)

    execute("""
      ALTER TABLE project_retrospectives ADD CONSTRAINT project_retrospectives_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE project_retrospectives DROP CONSTRAINT IF EXISTS project_retrospectives_subscription_list_id_fkey;
    """)

    execute("""
      ALTER TABLE project_retrospectives ADD CONSTRAINT project_retrospectives_subscription_list_id_fkey FOREIGN KEY (subscription_list_id) REFERENCES public.subscription_lists(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE project_review_requests DROP CONSTRAINT IF EXISTS project_review_requests_author_id_fkey;
    """)

    execute("""
      ALTER TABLE project_review_requests ADD CONSTRAINT project_review_requests_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.people(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE project_review_requests DROP CONSTRAINT IF EXISTS project_review_requests_project_id_fkey;
    """)

    execute("""
      ALTER TABLE project_review_requests ADD CONSTRAINT project_review_requests_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_closed_by_id_fkey;
    """)

    execute("""
      ALTER TABLE projects ADD CONSTRAINT projects_closed_by_id_fkey FOREIGN KEY (closed_by_id) REFERENCES public.people(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_creator_id_fkey;
    """)

    execute("""
      ALTER TABLE projects ADD CONSTRAINT projects_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.people(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_goal_id_fkey;
    """)

    execute("""
      ALTER TABLE projects ADD CONSTRAINT projects_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_group_id_fkey;
    """)

    execute("""
      ALTER TABLE projects ADD CONSTRAINT projects_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_last_check_in_id_fkey;
    """)

    execute("""
      ALTER TABLE projects ADD CONSTRAINT projects_last_check_in_id_fkey FOREIGN KEY (last_check_in_id) REFERENCES public.project_check_ins(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_objective_id_fkey;
    """)

    execute("""
      ALTER TABLE projects ADD CONSTRAINT projects_objective_id_fkey FOREIGN KEY (objective_id) REFERENCES public.objectives(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_person_id_fkey;
    """)

    execute("""
      ALTER TABLE reactions ADD CONSTRAINT reactions_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE resource_documents DROP CONSTRAINT IF EXISTS resource_documents_subscription_list_id_fkey;
    """)

    execute("""
      ALTER TABLE resource_documents ADD CONSTRAINT resource_documents_subscription_list_id_fkey FOREIGN KEY (subscription_list_id) REFERENCES public.subscription_lists(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE resource_files DROP CONSTRAINT IF EXISTS resource_files_author_id_fkey;
    """)

    execute("""
      ALTER TABLE resource_files ADD CONSTRAINT resource_files_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.people(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE resource_files DROP CONSTRAINT IF EXISTS resource_files_blob_id_fkey;
    """)

    execute("""
      ALTER TABLE resource_files ADD CONSTRAINT resource_files_blob_id_fkey FOREIGN KEY (blob_id) REFERENCES public.blobs(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE resource_files DROP CONSTRAINT IF EXISTS resource_files_preview_blob_id_fkey;
    """)

    execute("""
      ALTER TABLE resource_files ADD CONSTRAINT resource_files_preview_blob_id_fkey FOREIGN KEY (preview_blob_id) REFERENCES public.blobs(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE resource_files DROP CONSTRAINT IF EXISTS resource_files_subscription_list_id_fkey;
    """)

    execute("""
      ALTER TABLE resource_files ADD CONSTRAINT resource_files_subscription_list_id_fkey FOREIGN KEY (subscription_list_id) REFERENCES public.subscription_lists(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE resource_links DROP CONSTRAINT IF EXISTS resource_links_author_id_fkey;
    """)

    execute("""
      ALTER TABLE resource_links ADD CONSTRAINT resource_links_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.people(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE resource_links DROP CONSTRAINT IF EXISTS resource_links_subscription_list_id_fkey;
    """)

    execute("""
      ALTER TABLE resource_links ADD CONSTRAINT resource_links_subscription_list_id_fkey FOREIGN KEY (subscription_list_id) REFERENCES public.subscription_lists(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE resource_nodes DROP CONSTRAINT IF EXISTS resource_nodes_folder_id_fkey;
    """)

    execute("""
      ALTER TABLE resource_nodes ADD CONSTRAINT resource_nodes_folder_id_fkey FOREIGN KEY (parent_folder_id) REFERENCES public.resource_folders(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_subscription_list_id_fkey;
    """)

    execute("""
      ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_subscription_list_id_fkey FOREIGN KEY (subscription_list_id) REFERENCES public.subscription_lists(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE task_assignees DROP CONSTRAINT IF EXISTS task_assignees_person_id_fkey;
    """)

    execute("""
      ALTER TABLE task_assignees ADD CONSTRAINT task_assignees_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE task_assignees DROP CONSTRAINT IF EXISTS task_assignees_task_id_fkey;
    """)

    execute("""
      ALTER TABLE task_assignees ADD CONSTRAINT task_assignees_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey;
    """)

    execute("""
      ALTER TABLE tasks ADD CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.people(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_creator_id_fkey;
    """)

    execute("""
      ALTER TABLE tasks ADD CONSTRAINT tasks_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.people(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_milestone_id_fkey;
    """)

    execute("""
      ALTER TABLE tasks ADD CONSTRAINT tasks_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.project_milestones(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_space_id_fkey;
    """)

    execute("""
      ALTER TABLE tasks ADD CONSTRAINT tasks_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.groups(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE tenets DROP CONSTRAINT IF EXISTS tenets_company_id_fkey;
    """)

    execute("""
      ALTER TABLE tenets ADD CONSTRAINT tenets_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
    """)

    execute("""
      ALTER TABLE updates DROP CONSTRAINT IF EXISTS updates_acknowledging_person_id_fkey;
    """)

    execute("""
      ALTER TABLE updates ADD CONSTRAINT updates_acknowledging_person_id_fkey FOREIGN KEY (acknowledging_person_id) REFERENCES public.people(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE updates DROP CONSTRAINT IF EXISTS updates_author_id_fkey;
    """)

    execute("""
      ALTER TABLE updates ADD CONSTRAINT updates_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.people(id) ON DELETE SET NULL;
    """)
  end
end
