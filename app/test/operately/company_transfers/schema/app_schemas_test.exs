defmodule Operately.CompanyTransfers.Schema.AppSchemasTest do
  use ExUnit.Case, async: true

  alias Operately.CompanyTransfers.Schema.AppSchemas

  test "schema_for_table/1 resolves task_assignees in release-safe discovery" do
    assert AppSchemas.schema_for_table("task_assignees") == Operately.Tasks.Assignee
  end

  test "persisted_fields_for_table/1 exposes task assignee columns" do
    assert AppSchemas.persisted_fields_for_table("task_assignees") == %{
             "id" => :id,
             "inserted_at" => :inserted_at,
             "person_id" => :person_id,
             "task_id" => :task_id,
             "updated_at" => :updated_at
           }
  end

  test "schema_for_table/1 resolves project template schemas" do
    assert AppSchemas.schema_for_table("project_templates") == Operately.ProjectTemplates.ProjectTemplate
    assert AppSchemas.schema_for_table("project_template_comments") == Operately.ProjectTemplates.Comment
    assert AppSchemas.schema_for_table("project_template_discussions") == Operately.ProjectTemplates.Discussion
    assert AppSchemas.schema_for_table("project_template_milestones") == Operately.ProjectTemplates.Milestone
    assert AppSchemas.schema_for_table("project_template_people") == Operately.ProjectTemplates.Person
    assert AppSchemas.schema_for_table("project_template_resource_nodes") == Operately.ProjectTemplates.ResourceNode
    assert AppSchemas.schema_for_table("project_template_resource_documents") == Operately.ProjectTemplates.ResourceDocument
    assert AppSchemas.schema_for_table("project_template_resource_files") == Operately.ProjectTemplates.ResourceFile
    assert AppSchemas.schema_for_table("project_template_resource_folders") == Operately.ProjectTemplates.ResourceFolder
    assert AppSchemas.schema_for_table("project_template_resource_links") == Operately.ProjectTemplates.ResourceLink
    assert AppSchemas.schema_for_table("project_template_task_assignments") == Operately.ProjectTemplates.TaskAssignment
    assert AppSchemas.schema_for_table("project_template_tasks") == Operately.ProjectTemplates.Task
  end
end
