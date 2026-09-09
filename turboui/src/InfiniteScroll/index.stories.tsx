import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { InfiniteScroll } from ".";

const meta = {
  title: "Components/InfiniteScroll",
  component: InfiniteScroll,
  args: {
    observationKey: "page-1",
    hasNextPage: true,
    isFetching: false,
    onLoadMore: async () => {
      console.log("Load more activities");
    },
    children: (ref) => (
      <div ref={ref} className="p-4 border border-stroke-base">
        Previously loaded activities remain visible.
      </div>
    ),
  },
} satisfies Meta<typeof InfiniteScroll>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = { args: { isFetching: true, isFetchingNextPage: true } };
export const Failed: Story = { args: { hasError: true } };
export const Complete: Story = { args: { hasNextPage: false } };

export const Progression: Story = {
  render: () => <ProgressionExample />,
};

function ProgressionExample() {
  const [pages, setPages] = React.useState(1);
  const [fetching, setFetching] = React.useState(false);

  const loadMore = async () => {
    console.log("Load activity page", pages + 1);
    setFetching(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setPages((count) => count + 1);
    setFetching(false);
  };

  return (
    <InfiniteScroll
      observationKey={`page-${pages}`}
      hasNextPage={pages < 3}
      isFetching={fetching}
      isFetchingNextPage={fetching}
      onLoadMore={loadMore}
    >
      {(ref) => (
        <div>
          {Array.from({ length: pages }, (_, page) => (
            <div key={page} className="space-y-4 mb-4">
              {Array.from({ length: 10 }, (_, row) => (
                <div
                  key={row}
                  ref={page === pages - 1 && row === 0 ? ref : undefined}
                  className="p-6 border border-stroke-base"
                >
                  Page {page + 1}, activity {row + 1}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </InfiniteScroll>
  );
}
