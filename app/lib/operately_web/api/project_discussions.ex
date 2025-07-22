defmodule OperatelyWeb.Api.ProjectDiscussions do
  alias __MODULE__.SharedMultiSteps, as: Steps

  alias Operately.Projects.Project
  alias OperatelyWeb.Api.Serializer

  defmodule Get do
    use TurboConnect.Query

    inputs do
      field :id, :id
    end

    outputs do
      field :discussion, :update
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_discussion(inputs.id)
      |> Steps.check_discussion_permissions(:can_view)
      |> Steps.respond(fn changes ->
        %{discussion: Serializer.serialize(changes.discussion, level: :essential)}
      end)
    end
  end

  defmodule List do
    use TurboConnect.Query

    inputs do
      field :project_id, :id
    end

    outputs do
      field :discussions, list_of(:update)
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id)
      |> Steps.check_project_permissions(:can_view)
      |> Steps.list_discussions()
      |> Steps.respond(fn changes ->
        %{discussions: Serializer.serialize(changes.discussions, level: :essential)}
      end)
    end
  end

  defmodule Create do
    use TurboConnect.Mutation

    inputs do
      field :project_id, :id
      field :title, :string
      field :message, :json
      field? :send_notifications_to_everyone, :boolean, default: false
      field? :subscriber_ids, list_of(:id), default: []
    end

    outputs do
      field :discussion, :comment_thread
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id)
      |> Steps.check_project_permissions(:can_comment)
      |> Steps.create_discussion(inputs.title, inputs.message, inputs.subscriber_ids, inputs.send_notifications_to_everyone)
      |> Steps.save_activity(:project_discussion_submitted, fn changes ->
        %{
          company_id: changes.project.company_id,
          project_id: changes.project.id,
          discussion_id: changes.thread.id,
          title: changes.thread.title
        }
      end)
      |> Steps.connect_activity_to_discussion()
      |> Steps.respond(fn changes ->
        %{discussion: Serializer.serialize(changes.thread, level: :essential)}
      end)
    end
  end

  defmodule Edit do
    use TurboConnect.Mutation

    inputs do
      field :id, :id
      field :title, :string
      field :message, :json
      field? :subscriber_ids, list_of(:id), default: []
    end

    outputs do
      field :discussion, :update
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_discussion(inputs.id)
      |> Steps.check_discussion_permissions(:can_comment)
      |> Steps.update_discussion(inputs.title, inputs.message, inputs.subscriber_ids)
      |> Steps.respond(fn changes ->
        %{discussion: Serializer.serialize(changes.updated_discussion, level: :essential)}
      end)
    end
  end

  defmodule SharedMultiSteps do
    require Logger

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
          {:error, _} -> {:error, {:not_found, "Project not found"}}
        end
      end)
    end

    def find_discussion(multi, discussion_id) do
      Ecto.Multi.run(multi, :discussion, fn _repo, %{me: me} ->
        case Operately.Comments.CommentThread.get(me, id: discussion_id) do
          {:ok, discussion} -> {:ok, discussion}
          {:error, _} -> {:error, {:not_found, "Discussion not found"}}
        end
      end)
    end

    def check_project_permissions(multi, permission) do
      Ecto.Multi.run(multi, :permissions, fn _repo, changes ->
        Operately.Projects.Permissions.check(changes.project.request_info.access_level, permission)
      end)
    end

    def check_discussion_permissions(multi, permission) do
      Ecto.Multi.run(multi, :permissions, fn _repo, changes ->
        Operately.Projects.Permissions.check(changes.discussion.request_info.access_level, permission)
      end)
    end

    def list_discussions(multi) do
      Ecto.Multi.run(multi, :discussions, fn _repo, %{project: _project} ->
        # discussions = Updates.list_updates(project.id, :project, :project_discussion)
        # {:ok, discussions}

        {:error, :not_implemented}
      end)
    end

    def create_discussion(multi, title, message, subscriber_ids, send_to_everyone) do
      alias Operately.Operations.Notifications.SubscriptionList
      alias Operately.Operations.Notifications.Subscription
      alias Operately.Comments.CommentThread

      Ecto.Multi.merge(multi, fn %{project: project, me: me} ->
        Ecto.Multi.new()
        |> SubscriptionList.insert(%{send_to_everyone: send_to_everyone, subscription_parent_type: :comment_thread})
        |> Subscription.insert(me, %{content: message, subscriber_ids: subscriber_ids})
        |> Ecto.Multi.insert(:thread, fn changes ->
          CommentThread.changeset(%{
            author_id: me.id,
            parent_id: project.id,
            parent_type: :project,
            message: message,
            title: title,
            has_title: true,
            subscription_list_id: changes.subscription_list.id
          })
        end)
        |> SubscriptionList.update(:thread)
      end)
    end

    def connect_activity_to_discussion(multi) do
      Ecto.Multi.run(multi, :activity_with_thread, fn _, changes ->
        Operately.Activities.update_activity(changes.activity, %{comment_thread_id: changes.thread.id})
      end)
    end

    def update_discussion(multi, title, message, subscriber_ids) do
      alias Operately.Comments.CommentThread
      alias Operately.Operations.Notifications.Subscription

      multi
      |> Ecto.Multi.update(:updated_discussion, fn changes ->
        CommentThread.changeset(changes.discussion, %{title: title, message: message})
      end)
      |> Ecto.Multi.run(:subscription_list, fn _, changes ->
        {:ok, Operately.Repo.preload(changes.discussion, subscription_list: :subscriptions).subscription_list}
      end)
      |> Subscription.update_mentioned_people(%{content: message, subscriber_ids: subscriber_ids})
    end

    def save_activity(multi, activity_type, callback) do
      Ecto.Multi.merge(multi, fn changes ->
        Operately.Activities.insert_sync(Ecto.Multi.new(), changes.me.id, activity_type, fn _ -> callback.(changes) end)
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
