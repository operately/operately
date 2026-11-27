defmodule OperatelyWeb.Api.Projects.Discussions do
  alias OperatelyWeb.Api.Projects.Discussions.SharedMultiSteps, as: Steps

  alias Operately.Projects.Project
  alias OperatelyWeb.Api.Serializers.ProjectDiscussion

  defmodule Get do
    @moduledoc """
    Retrieves a single project discussion by ID with optional related data.
    """

    use TurboConnect.Query
    use OperatelyWeb.Api.Helpers

    inputs do
      field :id, :id

      field? :include_unread_notifications, :boolean, default: false
      field? :include_permissions, :boolean, default: true
      field? :include_subscriptions_list, :boolean, default: false
      field? :include_potential_subscribers, :boolean, default: false
      field? :include_unread_project_notifications, :boolean, default: false
      field? :include_project, :boolean, default: false
      field? :include_space, :boolean, default: false
    end

    outputs do
      field :discussion, :comment_thread
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_discussion(inputs.id, find_opts(conn, inputs))
      |> Steps.check_discussion_permissions(:can_view)
      |> Steps.respond(fn changes ->
        %{discussion: ProjectDiscussion.serialize(changes.discussion)}
      end)
    end

    defp find_opts(conn, inputs) do
      [
        preload: preload(inputs),
        after_load: after_load(conn, inputs)
      ]
    end

    defp preload(inputs) do
      Inputs.parse_includes(inputs,
        always_include: [:author, reactions: :person],
        include_subscriptions_list: :subscription_list,
        include_project: :project,
        include_space: :project,
        include_potential_subscribers: [project: [:access_context, contributors: :person]]
      )
    end

    defp after_load(conn, inputs) do
      {:ok, person} = find_me(conn)

      Inputs.parse_includes(inputs,
        include_unread_notifications: Operately.Notifications.UnreadNotificationsLoader.load(person),
        include_space: fn message ->
          case Operately.Groups.Group.get(person, id: message.project.group_id) do
            {:ok, space} -> %{message | space: space}
            {:error, :not_found} -> %{message | space: nil}
          end
        end,
        include_potential_subscribers: &Operately.Messages.Message.set_potential_subscribers/1,
        include_permissions: fn message ->
          permissions = Operately.Projects.Permissions.calculate(message.request_info.access_level, company_read_only: company_read_only(conn))
          %{message | permissions: permissions}
        end
      )
    end
  end

  defmodule List do
    @moduledoc """
    Lists all discussions for a given project.
    """

    use TurboConnect.Query

    inputs do
      field :project_id, :id
    end

    outputs do
      field :discussions, list_of(:comment_thread)
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id)
      |> Steps.check_project_permissions(:can_view)
      |> Steps.list_discussions()
      |> Steps.respond(fn changes ->
        %{discussions: Enum.map(changes.discussions, &ProjectDiscussion.serialize/1)}
      end)
    end
  end

  defmodule Create do
    @moduledoc """
    Creates a new project discussion.
    """

    use TurboConnect.Mutation

    inputs do
      field :project_id, :id
      field :title, :string
      field :message, :json
      field? :send_notifications_to_everyone, :boolean, null: false, default: false, external_default: true
      field? :subscriber_ids, list_of(:id), null: false, default: []
    end

    outputs do
      field :discussion, :comment_thread
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id)
      |> Steps.check_project_permissions(:can_edit)
      |> Steps.create_discussion(inputs.title, inputs.message, inputs.subscriber_ids, inputs.send_notifications_to_everyone)
      |> Steps.respond(fn changes ->
        %{discussion: ProjectDiscussion.serialize(changes.discussion)}
      end)
    end
  end

  defmodule Update do
    @moduledoc """
    Updates an existing project discussion's title and/or message.
    """

    use TurboConnect.Mutation

    inputs do
      field :id, :id
      field :title, :string
      field :message, :json
      field? :subscriber_ids, list_of(:id), default: []
    end

    outputs do
      field :discussion, :comment_thread
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_discussion(inputs.id)
      |> Steps.check_discussion_permissions(:can_edit)
      |> Steps.update_discussion(inputs.title, inputs.message)
      |> Steps.respond(fn changes ->
        %{discussion: ProjectDiscussion.serialize(changes.updated_discussion)}
      end)
    end
  end

  defmodule SharedMultiSteps do
    use Gettext, backend: OperatelyWeb.Gettext
    require Logger
    use OperatelyWeb.Api.Helpers

    def start_transaction(conn) do
      Ecto.Multi.new()
      |> Ecto.Multi.put(:conn, conn)
      |> Ecto.Multi.run(:me, fn _repo, %{conn: conn} ->
        {:ok, conn.assigns.current_person}
      end)
    end

    def find_project(multi, project_id) do
      Ecto.Multi.run(multi, :project, fn _repo, %{me: me} ->
        case Project.get(me, id: project_id, opts: [preload: [:access_context]]) do
          {:ok, project} -> {:ok, project}
          {:error, _} -> {:error, {:not_found, gettext("Project not found")}}
        end
      end)
    end

    def find_discussion(multi, discussion_id, opts \\ []) do
      Ecto.Multi.run(multi, :discussion, fn _repo, %{me: me} ->
        case Operately.Messages.Message.get(me, id: discussion_id, opts: Keyword.put(opts, :getter_profile, :project_discussion)) do
          {:ok, discussion} -> {:ok, discussion}
          {:error, _} -> {:error, {:not_found, gettext("Discussion not found")}}
        end
      end)
    end

    def check_project_permissions(multi, permission) do
      Ecto.Multi.run(multi, :permissions, fn _repo, changes ->
        Operately.Projects.Permissions.check(changes.project.request_info.access_level, permission, company_read_only: company_read_only(changes.conn))
      end)
    end

    def check_discussion_permissions(multi, permission) do
      Ecto.Multi.run(multi, :permissions, fn _repo, changes ->
        Operately.Projects.Permissions.check(changes.discussion.request_info.access_level, permission, company_read_only: company_read_only(changes.conn))
      end)
    end

    def list_discussions(multi) do
      Ecto.Multi.run(multi, :discussions, fn _repo, %{project: project} ->
        {:ok, Operately.Projects.Project.list_discussions(project.id)}
      end)
    end

    def create_discussion(multi, title, message, subscriber_ids, send_to_everyone) do
      Ecto.Multi.run(multi, :discussion, fn _, %{project: project, me: me} ->
        Operately.Operations.DiscussionPosting.run(me, project, %{title: title, content: message, subscriber_ids: subscriber_ids, send_to_everyone: send_to_everyone})
      end)
    end

    def update_discussion(multi, title, message) do
      Ecto.Multi.run(multi, :updated_discussion, fn _, %{discussion: discussion, me: me} ->
        Operately.Operations.DiscussionEditing.run(me, discussion, %{title: title, body: message})
      end)
    end

    def respond(multi, ok_callback, error_callback \\ &handle_error/1) do
      case Operately.Repo.transaction(multi) do
        {:ok, changes} ->
          {:ok, ok_callback.(changes)}

        {:error, _, :idempotent, changes} ->
          {:ok, ok_callback.(changes)}

        e ->
          error_callback.(e)
      end
    end

    defp handle_error(reason) do
      case reason do
        {:error, _failed_operation, {:not_found, message}, _changes} ->
          {:error, :not_found, message}

        {:error, _failed_operation, :not_found, _changes} ->
          {:error, :not_found}

        {:error, _failed_operation, :forbidden, _changes} ->
          {:error, :not_found}

        {:error, _failed_operation, %Ecto.Changeset{}, _changes} ->
          {:error, :bad_request}

        {:error, _failed_operation, reason, _changes} ->
          Logger.error("Transaction failed: #{inspect(reason)}")
          {:error, :internal_server_error}

        e ->
          Logger.error("Unexpected error: #{inspect(e)}")
          {:error, :internal_server_error}
      end
    end
  end
end
