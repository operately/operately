defmodule Operately.Operations.InlineThreads.ReconcileAnchors do
  @moduledoc "Reconciles all thread anchors inside a document's locked save transaction."

  import Ecto.Query
  alias Operately.Comments.{AnchorMapping, InlineThread}

  def add(multi, locked_document) do
    Ecto.Multi.run(multi, :inline_anchors, fn repo, %{document: document} ->
      threads = repo.all(from t in InlineThread, where: t.resource_id == ^document.id)
      mapping = if threads != [], do: AnchorMapping.prepare(locked_document.content, document.content)

      Enum.reduce_while(threads, {:ok, []}, fn thread, {:ok, updated} ->
        anchor_mapping = if thread.anchor.current_version == locked_document.current_version, do: mapping
        anchor = AnchorMapping.remap(thread.anchor, anchor_mapping, document.current_version)
        changeset = thread |> Ecto.Changeset.change() |> Ecto.Changeset.put_embed(:anchor, Map.from_struct(anchor))

        case repo.update(changeset) do
          {:ok, thread} -> {:cont, {:ok, [thread | updated]}}
          {:error, reason} -> {:halt, {:error, reason}}
        end
      end)
    end)
  end
end
