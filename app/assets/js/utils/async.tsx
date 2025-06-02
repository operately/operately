//
// This function takes a map of string keys to promises and returns a promise that resolves
// to a map of the same keys with the resolved values of the promises.
//
// Example usage:
//
// import { fetchAll } from './async';
//
// await fetchAll({
//   user: fetch('/api/user'),
//   posts: fetch('/api/posts'),
// });
//
async function fetchAll(map: Record<string, Promise<any>>): Promise<Record<string, any>> {
  const pairs = Object.entries(map);
  const results = await Promise.all(pairs.map(([_, promise]) => promise));
  const data: Record<string, any> = {};

  pairs.forEach(([key, _], index) => {
    data[key] = results[index];
  });

  return data;
}
