defmodule Operately.CompanyTransfers.Schema.PolicyRegistry do
  @moduledoc """
  Explicit classification of tables for export/import behavior.

  **All tables must be explicitly classified**

  ## Categories

  1. **Excluded tables** - System tables not exported:
     - `schema_migrations`, `oban_*` - System/infrastructure
     - `company_export_runs`, `company_import_runs` - Transfer metadata
     - `accounts_tokens`, `api_tokens`, `email_activation_codes`, `invite_links` - Authentication/invitation tokens
     - `notification_email_batches`, `system_settings` - Transient

  2. **Polymorphic tables** - Confirmed tables using a type/id pattern:
     - `comments` - `entity_type`/`entity_id`
     - `reactions` - `entity_type`/`entity_id`
     - `comment_threads` - `parent_type`/`parent_id`

  3. **Audited type/id reference tables** - Real schema tables using a type/id pattern
     that are not part of the confirmed polymorphic set:
     - `subscription_lists` - `parent_type`/`parent_id`

  4. **Exception tables** - Known special cases deferred from the minimal slice:
     - `activities` - requires separate handling due to serialized references in activity content
     - `notifications` - depends on deferred `activities`, but is not polymorphic itself

  5. **Dependency parent tables** - Referenced but not company-owned:
     - `accounts` - Shared across companies
     - `subscription_lists`, `subscriptions` - Referenced by multiple entities

  6. **Included tables** - Normal company-owned tables to export:
     - Explicitly listed (50+ tables including `companies`, `projects`, `goals`, etc.)
     - **Must be manually maintained** - new tables will cause tests to fail until classified

  7. **Rich text columns** - Columns containing JSON with blob references:
     - `projects.description`, `goals.description`
     - `messages.body`, `resource_hub_documents.content`
     - And others (see module attributes for full list)

  ## Key Functions

  - `excluded?/1` - Check if table should be skipped
  - `included?/1` - Check if table is a normal company-owned table
  - `polymorphic?/1` - Check if table uses polymorphic associations
  - `get_polymorphic_config/1` - Get type/id column names
  - `get_type_id_reference_configs/1` - Get audited type/id column names and kinds
  - `exception?/1` - Check if table is deferred for separate handling
  - `dependency_parent?/1` - Check if table is dependency-only
  - `has_rich_text?/2` - Check if column contains rich text

  ## Safety Mechanism

  The explicit `@included_tables` list ensures:
  - New tables added via migrations will cause `Discovery.validate_schema_coverage/0` to fail
  - Developers must explicitly decide: excluded, polymorphic, exception, dependency_parent, or included
  - No tables can be accidentally exported or skipped
  - The list serves as a complete inventory of exportable tables
  """

  @excluded_tables [
    "schema_migrations",
    "oban_jobs",
    "oban_peers",
    "company_export_runs",
    "company_import_runs",
    "accounts_tokens",
    "api_tokens",
    "email_activation_codes",
    "invite_links",
    "notification_email_batches",
    "system_settings"
  ]

  @polymorphic_tables %{
    "comments" => %{
      type_column: "entity_type",
      id_column: "entity_id",
      table_map: %{
        "comment_thread" => "comment_threads",
        "goal_update" => "goal_updates",
        "message" => "messages",
        "project_check_in" => "project_check_ins",
        "project_milestone" => "project_milestones",
        "project_retrospective" => "project_retrospectives",
        "project_task" => "tasks",
        "resource_hub_document" => "resource_documents",
        "resource_hub_file" => "resource_files",
        "resource_hub_link" => "resource_links",
        "space_task" => "tasks"
      }
    },
    "reactions" => %{
      type_column: "entity_type",
      id_column: "entity_id",
      table_map: %{
        "comment" => "comments",
        "comment_thread" => "comment_threads",
        "goal_update" => "goal_updates",
        "message" => "messages",
        "project_check_in" => "project_check_ins",
        "project_retrospective" => "project_retrospectives",
        "resource_hub_document" => "resource_documents",
        "resource_hub_file" => "resource_files",
        "resource_hub_link" => "resource_links",
        "space_task" => "tasks"
      }
    },
    "comment_threads" => %{
      type_column: "parent_type",
      id_column: "parent_id",
      table_map: %{
        "activity" => "activities",
        "project" => "projects"
      }
    }
  }

  @typed_reference_tables %{
    "subscription_lists" => [
      %{type_column: "parent_type", id_column: "parent_id"}
    ]
  }

  @exception_tables [
    "activities",
    "notifications",
  ]

  @dependency_parent_tables [
    "accounts",
    "subscription_lists",
    "subscriptions"
  ]

  @included_tables [
    "access_bindings",
    "access_contexts",
    "access_group_memberships",
    "access_groups",
    "agent_convos",
    "agent_defs",
    "agent_messages",
    "agent_runs",
    "blobs",
    "companies",
    "goal_checks",
    "goal_updates",
    "goals",
    "groups",
    "members",
    "messages",
    "messages_boards",
    "milestone_comments",
    "people",
    "project_check_ins",
    "project_contributors",
    "project_key_resources",
    "project_milestones",
    "project_phase_history",
    "project_retrospectives",
    "projects",
    "resource_documents",
    "resource_files",
    "resource_folders",
    "resource_hubs",
    "resource_links",
    "resource_nodes",
    "targets",
    "task_assignees",
    "tasks"
  ]

  @rich_text_columns %{
    "projects" => ["description"],
    "goals" => ["description"],
    "project_check_ins" => ["description"],
    "goal_updates" => ["content"],
    "messages" => ["body"],
    "resource_hub_documents" => ["content"],
    "milestones" => ["description"],
    "tasks" => ["description"],
    "project_retrospectives" => ["content"],
    "comment_threads" => ["message"]
  }

  def excluded?(table_name) when is_binary(table_name) do
    table_name in @excluded_tables
  end

  def excluded_tables, do: @excluded_tables

  def included?(table_name) when is_binary(table_name) do
    table_name in @included_tables
  end

  def included_tables, do: @included_tables

  def polymorphic?(table_name) when is_binary(table_name) do
    Map.has_key?(@polymorphic_tables, table_name)
  end

  def get_polymorphic_config(table_name) when is_binary(table_name) do
    Map.get(@polymorphic_tables, table_name)
  end

  def polymorphic_tables, do: @polymorphic_tables

  def get_type_id_reference_configs(table_name) when is_binary(table_name) do
    polymorphic_configs =
      case Map.get(@polymorphic_tables, table_name) do
        nil -> []
        config -> [Map.put(config, :reference_kind, :polymorphic)]
      end

    typed_reference_configs =
      @typed_reference_tables
      |> Map.get(table_name, [])
      |> Enum.map(&Map.put(&1, :reference_kind, :typed_reference))

    polymorphic_configs ++ typed_reference_configs
  end

  def exception?(table_name) when is_binary(table_name) do
    table_name in @exception_tables
  end

  def exception_tables, do: @exception_tables

  def dependency_parent?(table_name) when is_binary(table_name) do
    table_name in @dependency_parent_tables
  end

  def dependency_parent_tables, do: @dependency_parent_tables

  def has_rich_text?(table_name, column_name) when is_binary(table_name) and is_binary(column_name) do
    case Map.get(@rich_text_columns, table_name) do
      nil -> false
      columns -> column_name in columns
    end
  end

  def get_rich_text_columns(table_name) when is_binary(table_name) do
    Map.get(@rich_text_columns, table_name, [])
  end

  def rich_text_columns, do: @rich_text_columns
end
