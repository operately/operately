defimpl OperatelyWeb.Api.Serializable, for: Operately.ProductReleases.Release do
  def serialize(release, _opts) do
    %{
      id: release.id,
      version: release.version,
      title: release.title,
      published_at: OperatelyWeb.Api.Serializer.serialize(release.published_at),
      teaser: release.teaser
    }
  end
end
