defmodule OperatelyWeb.Api.Mutations.RemoveReaction do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.{
    Activities,
    Projects,
    Updates,
    Goals,
    Groups,
    ResourceHubs
  }

  alias Operately.Goals.Update
  alias Operately.Messages.Message
  alias Operately.Projects.Retrospective
  alias Operately.ResourceHubs.{Document, File, Link}
  alias Operately.Operations.ReactionRemoving
  alias Operately.Comments.CommentThread

  inputs do
    field? :reaction_id, :id, null: true
  end

  outputs do
    field? :success, :boolean, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:reaction, fn ctx -> fetch_reaction(inputs.reaction_id, ctx.me) end)
    |> run(:check_permissions, fn ctx -> check_permissions(ctx.reaction, ctx.me) end)
    |> run(:operation, fn ctx -> execute(ctx, inputs) end)
    |> run(:serialized, fn _ -> {:ok, %{success: true}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :reaction, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, {:error, :reaction_not_found}} -> {:error, :not_found}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp fetch_reaction(id, person) do
    case Updates.get_reaction(id) do
      nil -> {:error, :not_found}
      reaction -> 
        # Verify we have access to the entity this reaction belongs to
        case get_entity_with_access(reaction, person) do
          {:ok, _entity} -> {:ok, reaction}
          {:error, reason} -> {:error, reason}
        end
    end
  end

  defp get_entity_with_access(reaction, person) do
    type = reaction.entity_type
    entity_id = reaction.entity_id

    case type do
      :project_check_in -> Projects.get_check_in_with_access_level(entity_id, person.id)
      :project_retrospective -> Retrospective.get(person, id: entity_id)
      :comment_thread -> CommentThread.get(person, id: entity_id, opts: [preload: :activity])
      :goal_update -> Update.get(person, id: entity_id)
      :message -> Message.get(person, id: entity_id)
      :comment -> 
        # For comments, we need the parent type, but we can get it from the comment
        comment = Updates.get_comment_with_access_level(entity_id, person.id, nil)
        case comment do
          nil -> {:error, :not_found}
          c -> {:ok, c}
        end
      :resource_hub_document -> Document.get(person, id: entity_id)
      :resource_hub_file -> File.get(person, id: entity_id)
      :resource_hub_link -> Link.get(person, id: entity_id)
      _ -> {:error, :invalid_entity_type}
    end
  end

  defp check_permissions(reaction, me) do
    # User can only remove their own reactions
    if reaction.person_id == me.id do
      {:ok, :authorized}
    else
      {:error, :not_authorized}
    end
  end

  defp execute(ctx, inputs) do
    ReactionRemoving.run_by_id(ctx.reaction.id)
  end

  defp parse_comment_parent(nil), do: :ok

  defp parse_comment_parent(parent_type) do
    String.to_existing_atom(parent_type)
  end
end